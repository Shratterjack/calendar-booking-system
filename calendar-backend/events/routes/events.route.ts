import express from "express";
import {
  fetchFreeSlotsAction,
  fetchBookedSlotsAction,
  createBookingAction,
} from "../controllers/events.controller.ts";
import {
  validateFetchFreeSlotsSchema,
  validateCreateBookingSchema,
  validateFetchBookedSlotsSchema,
} from "../validation/validation.middleware.ts";

const router = express.Router();

// GET /events/free-slots - Fetch available time slots for a given date
router.get("/free-slots", validateFetchFreeSlotsSchema, fetchFreeSlotsAction);

// GET /events/list - Fetch booked events within a date range
router.get("/list", validateFetchBookedSlotsSchema, fetchBookedSlotsAction);

// POST /events/booking - Create a new booking
router.post("/booking", validateCreateBookingSchema, createBookingAction);

export default router;
