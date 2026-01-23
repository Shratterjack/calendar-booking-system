# Calendar Backend API

A RESTful API service for managing calendar event bookings with slot availability checking and conflict detection.

## Table of Contents

- [Structure](#structure)
- [Database Models](#database-models)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)

---

## Structure

The project follows a **layered architecture** with clear separation of concerns:

```
calendar-backend/
├── config/
│   └── db.ts                          # Firebase Admin SDK initialization
├── events/
│   ├── constants/
│   │   └── errorResponse.ts           # Error message constants
│   ├── controllers/
│   │   └── events.controller.ts       # HTTP request handlers
│   ├── models/
│   │   └── EventsModel.ts             # Data model definitions
│   ├── repository/
│   │   └── EventRepository.ts         # Data access layer (WIP)
│   ├── routes/
│   │   └── events.route.ts            # API route definitions
│   ├── services/
│   │   └── EventsService.ts           # Business logic layer
│   ├── types/
│   │   └── events.ts                  # TypeScript type definitions
│   └── validation/
│       ├── events.validator.ts        # Yup validation schemas
│       └── validation.middleware.ts   # Request validation middleware
├── shared/
│   └── FirestoreService.ts            # Firestore singleton service
├── utilities/
├── index.ts                           # Application entry point
└── package.json
```

### Architecture Layers

1. **Routes Layer** (`events/routes/`)
   - Defines API endpoints
   - Applies validation middleware
   - Maps routes to controllers

2. **Controllers Layer** (`events/controllers/`)
   - Handles HTTP requests/responses
   - Extracts request parameters
   - Delegates business logic to services
   - Formats responses

3. **Services Layer** (`events/services/`)
   - Contains core business logic
   - Implements slot availability checking
   - Manages booking operations
   - Handles timezone conversions

4. **Repository Layer** (`events/repository/`)
   - Data access abstraction (Work in Progress)
   - Firestore query operations
   - Database interaction layer

5. **Validation Layer** (`events/validation/`)
   - Request validation using Yup schemas
   - Middleware for schema enforcement
   - Input sanitization

---

## Database Models

The application uses **Firebase Firestore** as the database. Currently, there is one main collection:

### Events Collection

**Collection Name:** `events`

**Document Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `startTime` | Timestamp | Event start time (UTC) |
| `endTime` | Timestamp | Event end time (UTC) |
| `duration` | Number | Duration in minutes |

**Example Document:**
```json
{
  "startTime": Timestamp(2026-01-23T10:00:00Z),
  "endTime": Timestamp(2026-01-23T10:30:00Z),
  "duration": 30
}
```

### Type Definitions

**FreeSlotsResponse** (`events/types/events.ts`)
```typescript
type FreeSlotsResponse = {
  startingTime: string;         // ISO 8601 format
  startingDisplayTime: string;  // Formatted for display (timezone-aware)
};
```

### Firestore Queries

The service performs the following types of queries:

1. **Find overlapping events:**
   ```typescript
   db.collection("events")
     .where("startTime", "<", requestedEndTime)
     .where("endTime", ">", requestedStartTime)
     .orderBy("startTime")
   ```

2. **Find events in date range:**
   ```typescript
   db.collection("events")
     .where("startTime", ">=", startDate)
     .where("startTime", "<=", endDate)
     .orderBy("startTime")
   ```

### Configuration

Working hours and slot duration are configured via environment variables:

```env
START_HOUR=9          # Business hours start (24-hour format)
END_HOUR=17           # Business hours end (24-hour format)
DURATION=30           # Default slot duration in minutes
```

---

## Validation

The application uses **Yup** schemas for request validation with Express middleware.

### Validation Middleware

All requests pass through validation middleware before reaching controllers:

```typescript
// events/validation/validation.middleware.ts
export const validate = (schema: AnySchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(
        { body: req.body, query: req.query, params: req.params },
        { abortEarly: false }  // Collect all validation errors
      );
      next();
    } catch (error) {
      // Returns 400 with detailed error messages
    }
  };
};
```

### Validation Schemas

#### 1. GET /events/free-slots

**Schema:** `fetchFreeSlotsSchema`

```typescript
{
  query: {
    slotTime: string      // Required, YYYY-MM-DD format
    timezone?: string     // Optional, default: "Asia/Kolkata"
  }
}
```

**Validation Rules:**
- `slotTime`: Must be in `YYYY-MM-DD` format and a valid date
- `timezone`: Must be one of the supported timezones:
  - Asia/Kolkata
  - America/Los_Angeles
  - America/New_York
  - Europe/London
  - Europe/Moscow
  - Asia/Tokyo
  - Australia/Sydney

**Example Request:**
```
GET /events/free-slots?slotTime=2026-01-25&timezone=Asia/Kolkata
```

---

#### 2. GET /events/list

**Schema:** `fetchBookedSlotsSchema`

```typescript
{
  query: {
    startDate: string    // Required, YYYY-MM-DD format
    endDate: string      // Required, YYYY-MM-DD format
  }
}
```

**Validation Rules:**
- `startDate`: Must be in `YYYY-MM-DD` format and a valid date
- `endDate`: Must be in `YYYY-MM-DD` format and a valid date
- `endDate` must be after or equal to `startDate`

**Example Request:**
```
GET /events/list?startDate=2026-01-23&endDate=2026-01-30
```

---

#### 3. POST /events/booking

**Schema:** `createBookingSchema`

```typescript
{
  body: {
    slotTime: string     // Required, ISO 8601 format
    duration: number     // Required, minutes (multiple of 15)
  }
}
```

**Validation Rules:**
- `slotTime`: Must be a valid ISO 8601 datetime string (e.g., `2026-01-25T10:00:00Z`)
- `duration`:
  - Required
  - Must be a positive integer
  - Minimum: 15 minutes
  - Maximum: 480 minutes (8 hours)
  - Must be a multiple of 15

**Example Request:**
```json
POST /events/booking
Content-Type: application/json

{
  "slotTime": "2026-01-25T10:00:00Z",
  "duration": 30
}
```

### Validation Error Response

When validation fails, the API returns a **400 Bad Request** with detailed error information:

```json
{
  "errors": [
    {
      "field": "duration",
      "message": "duration must be a multiple of 15"
    },
    {
      "field": "slotTime",
      "message": "slotTime must be a valid ISO 8601 date"
    }
  ]
}
```

---

## Error Handling

The application implements multiple layers of error handling:

### 1. Validation Errors (HTTP 400)

Handled by validation middleware before reaching business logic.

**Trigger:** Invalid request format, missing required fields, or constraint violations.

**Response Format:**
```json
{
  "errors": [
    {
      "field": "fieldName",
      "message": "Error description"
    }
  ]
}
```

---

### 2. Business Logic Errors

Handled by service layer with semantic error codes.

#### Error Constants

**Location:** `events/constants/errorResponse.ts`

| Error Code | Message | Description |
|------------|---------|-------------|
| `SLOT_OUTSIDE_WORKING_HRS` | "Requested slot not within working hours. Please choose a time within" | Slot falls outside configured business hours |
| `SLOT_ALREADY_BOOKED` | "The requested time slot is already booked. Please choose a different time." | Exact time slot is already occupied |
| `SLOT_OVERLAPS_EXISTING_MEETING` | "The requested time slot conflicts with an existing meeting. Please select a non-overlapping time." | Requested slot overlaps with existing event |
| `SLOT_OVERLAPS_MEETING_START` | "The requested time slot overlaps with the start of a scheduled meeting. Please choose a time that doesn't conflict." | Requested slot conflicts with the beginning of another event |

#### Slot Availability Response

When checking or booking a slot, the service returns:

**Success Response:**
```json
{
  "isSlotAvailable": true,
  "message": "Slot is available for booking"
}
```

**Conflict Response:**
```json
{
  "isSlotAvailable": false,
  "conflictType": "SLOT_OVERLAPS_MEETING_START",
  "message": "The requested time slot overlaps with the start of a scheduled meeting. Please choose a time that doesn't conflict."
}
```

**Booking Success Response:**
```json
{
  "status": "booked",
  "message": "Slot booked successfully"
}
```

**Booking Failure Response:**
```json
{
  "status": "unavailable",
  "conflictType": "SLOT_ALREADY_BOOKED",
  "message": "The requested time slot is already booked. Please choose a different time."
}
```

---

### 3. Server Errors (HTTP 500)

Handled by global error handler middleware.

**Trigger:** Unexpected exceptions, database connection issues, or unhandled errors.

**Response Format:**
```json
{
  "error": "Something broke!"
}
```

---

### Error Flow

```
Request
  ↓
Validation Middleware
  ↓ (Invalid)
  └→ 400 Bad Request (Field-level errors)
  ↓ (Valid)
Controller
  ↓
Service Layer
  ↓ (Business Rule Violation)
  └→ Semantic error response with conflictType
  ↓ (Success)
Response
  ↓ (Unexpected Error)
Global Error Handler
  └→ 500 Internal Server Error
```

---

## Setup

### Prerequisites

- Node.js (v18+)
- Firebase Admin SDK credentials
- Firestore database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   START_HOUR=9
   END_HOUR=17
   DURATION=30
   PORT=3000
   ```

4. Configure Firebase credentials in `config/db.ts`

### Running the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Testing

**Race Condition Test:**

To verify that the booking system correctly handles concurrent requests for the same time slot:

```bash
npm install
npm run test:race
```

This test sends 10 concurrent booking requests for the same time slot and verifies that:
- Only 1 request succeeds (HTTP 201 Created)
- All other requests fail with HTTP 409 Conflict
- No double-booking occurs

**Expected Output:**
```
========================================
  Race Condition Analysis
========================================

  Successful Bookings: 1
  Conflict Responses: 9

PASS: Race condition handled correctly!
  - Only 1 booking succeeded
  - 9 concurrent requests properly rejected
  - Transactions are working as expected
```

**Note:** The test requires the server to be running on `http://localhost:3000`.

---

## API Endpoints

### GET /events/free-slots

Retrieve available time slots for a specific date.

**Query Parameters:**
- `slotTime` (required): Date in YYYY-MM-DD format
- `timezone` (optional): Timezone for display formatting (default: Asia/Kolkata)

**Response:**
```json
[
  {
    "startingTime": "2026-01-25T09:00:00.000Z",
    "startingDisplayTime": "25/01/2026, 02:30 PM"
  },
  {
    "startingTime": "2026-01-25T09:30:00.000Z",
    "startingDisplayTime": "25/01/2026, 03:00 PM"
  }
]
```

---

### GET /events/list

Retrieve all booked events within a date range.

**Query Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

**Response:**
```json
{
  "bookedSlots": [
    {
      "startingTime": "2026-01-23T10:00:00.000Z",
      "startingDisplayTime": "23/01/2026, 03:30 PM"
    }
  ],
  "count": 1
}
```

---

### POST /events/booking

Create a new event booking.

**Request Body:**
```json
{
  "slotTime": "2026-01-25T10:00:00Z",
  "duration": 30
}
```

**Success Response:**
```json
{
  "status": "booked",
  "message": "Slot booked successfully"
}
```

**Conflict Response:**
```json
{
  "status": "unavailable",
  "conflictType": "SLOT_ALREADY_BOOKED",
  "message": "The requested time slot is already booked. Please choose a different time."
}
```

---

## Dependencies

- **express**: Web framework
- **firebase-admin**: Firebase Admin SDK for Firestore
- **yup**: Schema validation
- **dayjs**: Date/time manipulation
- **cors**: Cross-origin resource sharing

---

## Author

Shreyansh Shekhar

## License

ISC
