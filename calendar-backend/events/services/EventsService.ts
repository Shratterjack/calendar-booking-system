import { Timestamp } from "firebase-admin/firestore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import FirestoreService from "../../shared/FirestoreService.ts";
import type { FreeSlotsResponse } from "../types/events.ts";
import { SlotConflictErrors } from "../constants/errorResponse.ts";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default class EventsService {
  #db;
  constructor() {
    const firestore = new FirestoreService();
    const db = firestore.getDb();
    this.#db = db;
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

    const eventsRef = this.#db.collection("events");

    const snapshot = await eventsRef
      .where("startTime", ">=", Timestamp.fromDate(startingHourTime))
      .where("endTime", "<", Timestamp.fromDate(endingHourTime))
      .orderBy("startTime", "asc")
      .get();

    let bookedSlots = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      let temp = {
        bookedStartTime: data.startTime.toDate(),
      };

      bookedSlots.push(temp);
    });
    let freeSlots = [];

    let i = 0;

    while (startingHourTime.getTime() < endingHourTime.getTime()) {
      const slotObject = {
        startingTime: startingHourTime.toISOString(),
        startingDisplayTime: this.formatTimeSlot(startingHourTime, timezone),
      };

      if (i < bookedSlots.length) {
        let slot = bookedSlots[i];

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

  checkSlotAvailablity = async (
    requestedStartTime: Date,
    requestedEndTime: Date,
  ) => {
    // For booking validation, use UTC since booking times are already in UTC
    const { startingHourTime, endingHourTime } = this.getSlotAvailableHours(
      requestedStartTime.toISOString().slice(0, 10),
      "UTC",
    );

    if (
      requestedStartTime < startingHourTime ||
      requestedStartTime >= endingHourTime
    ) {
      return {
        isSlotAvailable: false,
        errorCode: "SLOT_OUTSIDE_WORKING_HRS",
        message: SlotConflictErrors.SLOT_OUTSIDE_WORKING_HRS,
      };
    }

    // console.log("oneHrBeforeSlot", oneHrBeforeSlot);
    // console.log("onHrAfterSlot", onHrAfterSlot);
    //
    // console.log("onHrAfterSlot", onHrAfterSlot);

    // // Query to fetch booked slots that occur within the requested time range
    // // We need to find events where:
    // // - Event starts after requested start time AND
    // // - Event ends aft requested end time
    const oneHrBeforeSlot = new Date(
      requestedStartTime.getTime() - 60 * 60 * 1000,
    );
    const onHrAfterSlot = new Date(
      requestedStartTime.getTime() + 60 * 60 * 1000,
    );

    const eventsRef = this.#db.collection("events");

    const snapshot = await eventsRef
      .where("startTime", ">=", Timestamp.fromDate(oneHrBeforeSlot))
      .where("endTime", "<", Timestamp.fromDate(onHrAfterSlot))
      .orderBy("startTime", "asc")
      .get();

    // // // Check 1: If there are no results, slot is available
    if (snapshot.empty) {
      return {
        isSlotAvailable: true,
        errorCode: "",
        message:
          "No booked slots found in the requested schedule- timeslot is available",
      };
    }
    // Check 2: If there are results, check each booked slot
    for (const doc of snapshot.docs) {
      const data = doc.data();

      // // Convert Firestore Timestamps to UTC Date objects
      const bookedStartTime = data.startTime.toDate();
      const bookedEndTime = data.endTime.toDate();

      console.log("requestedStartUTC", requestedStartTime.getTime());
      console.log("bookedStartUTC", bookedEndTime.getTime());

      // // Check 2.1: requestedStartTime === bookedStartTime
      if (requestedStartTime.getTime() === bookedStartTime.getTime()) {
        console.log(SlotConflictErrors.SLOT_ALREADY_BOOKED);
        return {
          isSlotAvailable: false,
          errorCode: "SLOT_ALREADY_BOOKED:",
          message: SlotConflictErrors.SLOT_ALREADY_BOOKED,
        };
      }

      // // Check 2.2: bookedStartTime < requestedStartTime AND requestedEndTime < bookedEndTime
      // // This means the requested slot is completely within a booked slot
      if (
        requestedStartTime.getTime() > bookedStartTime.getTime() &&
        requestedStartTime.getTime() < bookedEndTime.getTime()
      ) {
        console.log(SlotConflictErrors.SLOT_OVERLAPS_EXISTING_MEETING);
        return {
          isSlotAvailable: false,
          errorCode: "SLOT_OVERLAPS_EXISTING_MEETING",
          message: SlotConflictErrors.SLOT_OVERLAPS_EXISTING_MEETING,
        };
      }

      // // Check 2.3: bookedStartTime > requestedStartTime AND bookedStartTime < requestedEndTime
      // // This means the requested slot overlaps with the start of a booked slot
      if (
        bookedStartTime.getTime() > requestedStartTime.getTime() &&
        bookedStartTime.getTime() < requestedEndTime.getTime()
      ) {
        return {
          isSlotAvailable: false,
          errorCode: "SLOT_OVERLAPS_MEETING_START",
          message: SlotConflictErrors.SLOT_OVERLAPS_MEETING_START,
        };
      }
    }

    // // If no conflicts found, slot is available
    return {
      isSlotAvailable: true,
      errorCode: "",
      message: "No conflicts found - timeslot is available",
    };
  };

  bookEventSlot = async (slotTime: string, duration: number) => {
    const requestedStartTime = new Date(slotTime);
    const requestedEndTime = this.addMinutes(requestedStartTime, duration);

    console.log("startTime", requestedStartTime);

    console.log("endTime", requestedEndTime);

    const { isSlotAvailable, errorCode, message } =
      await this.checkSlotAvailablity(requestedStartTime, requestedEndTime);

    if (isSlotAvailable) {
      const docRef = await this.#db.collection("events").add({
        startTime: Timestamp.fromDate(requestedStartTime),
        duration: duration,
        endTime: Timestamp.fromDate(requestedEndTime),
      });
    }

    return {
      isBookingSuccess: isSlotAvailable,
      message: message,
      errorCode: errorCode,
    };
  };

  getBookedEvents = async (startDate: string, endDate: string) => {
    const startingDate = new Date(startDate);

    const endingLastDate = new Date(endDate);
    endingLastDate.setHours(23, 59, 59);

    const eventsRef = this.#db.collection("events");

    const snapshot = await eventsRef
      .where("startTime", ">=", Timestamp.fromDate(startingDate))
      .where("endTime", "<", Timestamp.fromDate(endingLastDate))
      .orderBy("startTime", "asc")
      .get();

    if (snapshot.empty) {
      console.log("No matching documents.");
      return [];
    }

    let result = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      let temp = {
        startingTime: data.startTime.toDate(),
        duration: data.duration,
      };

      result.push(temp);
    });

    console.log("result", result);

    return result;
  };

  formatTimeSlot = (dateTime: Date, timeZone: string) => {
    return dateTime.toLocaleString("en-IN", {
      timeZone: timeZone,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
}
