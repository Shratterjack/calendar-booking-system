import EventsService from "../services/EventsService.ts";
import type { Request, Response, NextFunction } from "express";

const fetchFreeSlotsAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { slotTime, timezone } = req.query as {
      slotTime: string;
      timezone: string;
    };

    console.log("Fetching free slots for:", { slotTime, timezone });

    const eventsService = new EventsService();
    const slots = await eventsService.getFreeSlots(slotTime, timezone);

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Error in fetchFreeSlotsAction:", error);
    next(error);
  }
};

const fetchBookedSlotsAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    console.log("Fetching booked events:", { startDate, endDate });

    const eventsService = new EventsService();
    const bookedSlots = await eventsService.getBookedEvents(startDate, endDate);

    res.status(200).json({
      success: true,
      data: bookedSlots,
    });
  } catch (error) {
    console.error("Error in fetchBookedSlotsAction:", error);
    next(error);
  }
};

const createBookingAction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { slotTime, duration } = req.body;

    const eventsService = new EventsService();
    const result = await eventsService.bookEventSlot(slotTime, duration);
    if (result.isBookingSuccess) {
      res.status(200).json({
        success: true,
        data: result,
      });
    } else {
      res.status(422).json({
        success: false,
        data: result,
      });
    }
  } catch {}
};

export { fetchFreeSlotsAction, fetchBookedSlotsAction, createBookingAction };
