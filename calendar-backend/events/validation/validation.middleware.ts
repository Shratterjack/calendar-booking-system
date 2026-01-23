import type { Request, Response, NextFunction } from "express";
import type { AnySchema } from "yup";
import {
  fetchFreeSlotsSchema,
  fetchBookedSlotsSchema,
  createBookingSchema,
} from "./events.validator.ts";

/**
 * Generic validator helper - handles validation logic for all schemas
 * @param schema - Yup validation schema to validate against
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const validateRequest = async (
  schema: AnySchema,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // console.log("reqbody", req.body);

    const validated = await schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true, // Remove unknown fields
      },
    );

    // // Apply validated data back to request object
    // req.body = validated.body || req.body;
    // req.query = validated.query || req.query;
    // req.params = validated.params || req.params;
    // console.log("Validation passed:", validated);
    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = error.inner.map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Other errors - pass to error handler
    next(error);
  }
};

/**
 * Validates GET /events/free-slots request
 * Checks: slotTime (ISO string), timezone
 */
export const validateFetchFreeSlotsSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => validateRequest(fetchFreeSlotsSchema, req, res, next);

/**
 * Validates GET /events/list request
 */
export const validateFetchBookedSlotsSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => validateRequest(fetchBookedSlotsSchema, req, res, next);

/**
 * Validates POST /events/booking request
 * Checks: slot_time (ISO string, future), duration (15-480 minutes, multiple of 15)
 */
export const validateCreateBookingSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => validateRequest(createBookingSchema, req, res, next);
