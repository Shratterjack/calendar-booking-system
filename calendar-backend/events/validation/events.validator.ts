import * as yup from "yup";

// Validation schema for GET /events/free-slots
export const fetchFreeSlotsSchema = yup.object({
  query: yup.object({
    slotTime: yup
      .string()
      .required("startDate is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format")
      .test("is-valid-date", "startDate must be a valid date", (value) => {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      }),
    // .test(
    //   "is-valid-iso",
    //   "slotTime must be a valid ISO 8601 date",
    //   (value) => {
    //     if (!value) return false;
    //     const date = new Date(value);
    //     return !isNaN(date.getTime()) && value.includes("T");
    //   },
    // ),
    // .test("is-future-or-today", "slotTime must be today or in the future", (value) => {
    //   if (!value) return false;
    //   const requestedDate = new Date(value);
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);
    //   return requestedDate >= today;
    // }),
    timezone: yup
      .string()
      .optional()
      .oneOf(
        [
          "Asia/Kolkata",
          "America/Los_Angeles",
          "America/New_York",
          "Europe/London",
          "Europe/Moscow",
          "Asia/Tokyo",
          "Australia/Sydney",
        ],
        "Invalid timezone",
      )
      .default("Asia/Kolkata"),
  }),
});

// Validation schema for GET /events/list
export const fetchBookedSlotsSchema = yup.object({
  query: yup.object({
    startDate: yup
      .string()
      .required("startDate is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format")
      .test("is-valid-date", "startDate must be a valid date", (value) => {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      }),
    endDate: yup
      .string()
      .required("endDate is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format")
      .test("is-valid-date", "endDate must be a valid date", (value) => {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      })
      .test(
        "is-after-start",
        "endDate must be after or equal to startDate",
        function (value) {
          const { startDate } = this.parent;
          if (!startDate || !value) return true;
          return new Date(value) >= new Date(startDate);
        },
      ),
  }),
});

// Validation schema for POST /events/booking
export const createBookingSchema = yup.object({
  body: yup.object({
    slotTime: yup
      .string()
      .required("slotTime is required")
      .test(
        "is-valid-iso",
        "slotTime must be a valid ISO 8601 date",
        (value) => {
          if (!value) return false;
          const date = new Date(value);
          return !isNaN(date.getTime()) && value.includes("T");
        },
      ),
    // .test("is-future", "slot_time must be in the future", (value) => {
    //   if (!value) return false;
    //   const requestedDate = new Date(value);
    //   const now = new Date();
    //   return requestedDate > now;
    // }),
    duration: yup
      .number()
      .required("duration is required")
      .positive("duration must be positive")
      .integer("duration must be an integer")
      .min(15, "duration must be at least 15 minutes")
      .max(480, "duration cannot exceed 480 minutes (8 hours)")
      .test(
        "is-multiple-of-15",
        "duration must be a multiple of 15",
        (value) => {
          if (!value) return false;
          return value % 15 === 0;
        },
      ),
  }),
});
