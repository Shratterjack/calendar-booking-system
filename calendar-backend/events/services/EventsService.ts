import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Timestamp } from "firebase-admin/firestore";

import type { FreeSlotsResponse, BookedSlot } from "../types/events.ts";
import { SlotConflictErrors } from "../constants/errorResponse.ts";
import EventRepository from "../repository/EventRepository.ts";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default class EventsService {
  eventRepo;
  constructor() {
    this.eventRepo = new EventRepository();
  }

  addMinutes = (date: Date, minutes: number) => {
    const result = new Date(date.toISOString());
    result.setMinutes(result.getMinutes() + minutes);

    return result;
  };

  getSlotAvailableHours = (currentDate: string, requestedTimezone: string) => {
    const startHour = Number(process.env.START_HOUR);
    const endHour = Number(process.env.END_HOUR);

    console.log("currentDate", currentDate);
    console.log("requestedTimezone", requestedTimezone);

    // Create dates in the client's timezone, then convert to UTC
    // This ensures working hours respect the client's local time
    // dayjs.tz() creates a moment in the specified timezone
    // .toDate() converts to JavaScript Date (which is always stored in UTC internally)
    const startingHourTime = dayjs
      .tz(
        `${currentDate} ${startHour.toString().padStart(2, "0")}:00:00`,
        requestedTimezone,
      )
      .toDate();

    const endingHourTime = dayjs
      .tz(
        `${currentDate} ${endHour.toString().padStart(2, "0")}:00:00`,
        requestedTimezone,
      )
      .toDate();

    console.log("startingHourTime (UTC)", startingHourTime.toISOString());
    console.log("endingHourTime (UTC)", endingHourTime.toISOString());

    return { startingHourTime, endingHourTime };
  };

  getFreeSlots = async (
    slotTime: string,
    timezone: string,
  ): Promise<FreeSlotsResponse[]> => {
    let { startingHourTime, endingHourTime } = this.getSlotAvailableHours(
      slotTime,
      timezone,
    );

    const duration = Number(process.env.DURATION);

    const bookedSlotData = await this.eventRepo.getSlotsInIntervalQuery(
      startingHourTime,
      endingHourTime,
    );

    let freeSlots = [];

    let i = 0;

    while (startingHourTime.getTime() < endingHourTime.getTime()) {
      const slotObject = {
        startingTime: startingHourTime.toISOString(),
        startingDisplayTime: this.formatTimeSlot(startingHourTime, timezone),
      };

      if (i < bookedSlotData.length) {
        let slot = bookedSlotData[i];

        let { bookedStartTime } = slot;
        if (startingHourTime.getTime() < bookedStartTime.getTime()) {
          freeSlots.push(slotObject);
        } else if (startingHourTime.getTime() === bookedStartTime.getTime()) {
          i = i + 1;
        }
      } else {
        freeSlots.push(slotObject);
      }

      let nextTime = this.addMinutes(startingHourTime, duration);
      startingHourTime = nextTime;
    }

    return freeSlots;
  };

  checkSlotAvailablity = (
    requestedStartTime: Date,
    requestedEndTime: Date,
    bookedSlots: BookedSlot[],
  ) => {
    let isSlotAvailable = true;

    // Check 1: If there are no results, slot is available
    if (bookedSlots.length === 0) {
      return { isSlotAvailable };
    }

    // Check 2: If there are results, check each booked slot
    for (const slot of bookedSlots) {
      // Convert Firestore Timestamps to UTC Date objects
      const { bookedStartTime } = slot;
      const { bookedEndTime } = slot;

      console.log("requestedStartUTC", requestedStartTime.getTime());
      console.log("bookedStartUTC", bookedEndTime.getTime());

      // Check 2.1: requestedStartTime === bookedStartTime
      if (requestedStartTime.getTime() === bookedStartTime.getTime()) {
        isSlotAvailable = false;
        throw new Error(SlotConflictErrors.SLOT_ALREADY_BOOKED.name);
      }

      // Check 2.2: bookedStartTime < requestedStartTime AND requestedEndTime < bookedEndTime
      // This means the requested slot is completely within a booked slot
      if (
        requestedStartTime.getTime() > bookedStartTime.getTime() &&
        requestedStartTime.getTime() < bookedEndTime.getTime()
      ) {
        isSlotAvailable = false;
        throw new Error(SlotConflictErrors.SLOT_OVERLAPS_EXISTING_MEETING.name);
      }

      // Check 2.3: bookedStartTime > requestedStartTime AND bookedStartTime < requestedEndTime
      // This means the requested slot overlaps with the start of a booked slot
      if (
        bookedStartTime.getTime() > requestedStartTime.getTime() &&
        bookedStartTime.getTime() < requestedEndTime.getTime()
      ) {
        isSlotAvailable = false;
        throw new Error(SlotConflictErrors.SLOT_OVERLAPS_MEETING_START.name);
      }
    }

    // If no conflicts found, slot is available
    return {
      isSlotAvailable: true,
    };
  };

  bookEventSlot = async (slotTime: string, duration: number) => {
    try {
      const requestedStartTime = new Date(slotTime);
      const requestedEndTime = this.addMinutes(requestedStartTime, duration);

      console.log("startTime", requestedStartTime);

      console.log("endTime", requestedEndTime);

      // Use default timezone from .env for working hours validation
      // This checks if the requested slot is between START_HOUR - END_HOUR in the configured timezone
      const systemTimezone = process.env.TIMEZONE;

      const { startingHourTime, endingHourTime } = this.getSlotAvailableHours(
        requestedStartTime.toISOString().slice(0, 10),
        systemTimezone,
      );

      if (
        requestedStartTime < startingHourTime ||
        requestedStartTime >= endingHourTime
      ) {
        throw new Error(SlotConflictErrors.SLOT_OUTSIDE_WORKING_HRS.name);
      }

      // Define time window for conflict checking
      const oneHrBeforeSlot = new Date(
        requestedStartTime.getTime() - 60 * 60 * 1000,
      );
      const oneHrAfterSlot = new Date(
        requestedStartTime.getTime() + 60 * 60 * 1000,
      );

      // STEP 2: Transaction - atomic read + validate + write
      const res = await this.eventRepo.getDBConn().runTransaction(async (t) => {
        // Build query from repository (doesn't execute yet)
        const query = this.eventRepo.buildSlotsInIntervalQuery(
          oneHrBeforeSlot,
          oneHrAfterSlot,
        );

        // Execute query within transaction (critical for race condition protection)
        const snapshot = await t.get(query);

        // Transform snapshot to booked slots
        const bookedSlotData =
          this.eventRepo.transformSnapshotToBookedSlots(snapshot);

        // Check for conflicts
        const { isSlotAvailable } = this.checkSlotAvailablity(
          requestedStartTime,
          requestedEndTime,
          bookedSlotData,
        );

        if (isSlotAvailable) {
          // Get document reference from repository
          const docRef = this.eventRepo.createEventDocRef();

          // MUST use transaction.set() for atomic operation
          // t.set(docRef, {
          //   startTime: Timestamp.fromDate(requestedStartTime),
          //   duration: duration,
          //   endTime: Timestamp.fromDate(requestedEndTime),
          // });
        }

        return isSlotAvailable;
      });

      return {
        isBookingSuccess: res,
        errorCode: "",
        message: "Slot Booked Successfully",
      };
    } catch (error) {
      // Handle errors gracefully
      const errorInfo = SlotConflictErrors[error.message];
      return {
        isBookingSuccess: false,
        errorCode: errorInfo?.name || "UNKNOWN_ERROR",
        message: errorInfo?.message || error.message,
      };
    }
  };

  getBookedEvents = async (startDate: string, endDate: string) => {
    const startingDate = new Date(startDate);
    startingDate.setHours(0, 0, 0);

    const endingLastDate = new Date(endDate);

    const bookedSlotData = await this.eventRepo.getSlotsInIntervalQuery(
      startingDate,
      endingLastDate,
    );

    if (bookedSlotData.length == 0) {
      return [];
    }

    const response = {
      result: bookedSlotData,
      count: bookedSlotData.length,
    };

    return response;
  };

  formatTimeSlot = (dateTime: Date, timeZone: string) => {
    return dateTime.toLocaleString("en-GB", {
      timeZone: timeZone,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
}
