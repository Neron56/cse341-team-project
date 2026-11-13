# W03 Feature Set 3: Bookings

## Purpose and scope

Store bookings with Mongoose, separate page and JSON controllers from routing,
preserve the existing booking flow, and add an admin page hydrated by an API.
The work is on `feat/w03-bookings`; it must be reviewed through a PR to `main`.
Trip, schedule, and ticket-class feature ownership stays with the other team
members. Until their models exist, reference-data reads live in a separate
booking-options model using the existing database interface.

## Data model

Collection: `bookings`, replacing `confirmations`.

| Field | Type | Rules |
| --- | --- | --- |
| id | string | Unique, server-generated `JR` booking reference |
| scheduleId | number | Required positive integer; must identify an active schedule |
| tripId | string | Required; derived from the schedule, never trusted from the form |
| ticketClass | string | Required; must identify an existing ticket class |
| selectedDay | string | Required; must be in the schedule's daysOfWeek |
| passengers | embedded array | 1–8 passengers |
| passengers[].firstName | string | Required, trimmed |
| passengers[].lastName | string | Required, trimmed |
| passengers[].email | string | Required, trimmed, email format |
| passengers[].phone | string | Required, trimmed |
| createdAt / updatedAt | date | Managed by Mongoose |

Model functions: `createBooking(data)`, `getAllBookings()`, and
`getBookingById(id)` (lookup by public booking reference, not MongoDB `_id`).
Creation explicitly selects input fields so a client cannot override the
reference or timestamps. Queries return plain objects for JSON/EJS.

## Routes and contracts

- `GET /api/bookings`: 200 JSON `{ "bookings": [...] }`, including an empty
  array when no bookings exist. Database failure: 500 JSON
  `{ "error": "Failed to fetch bookings" }`. Swagger documents the response
  and nested passenger schema. This assignment provides no authentication;
  use fictional passenger data in the demo.
- `GET /bookings-admin`: 200 EJS shell. Browser JavaScript fetches the API,
  creates booking cards and passenger details, and handles loading, empty,
  and error states. User data is inserted with `textContent`.
- `GET /trips/booking/:scheduleId`: 200 EJS booking form with schedule and
  calculated ticket options; 404 for invalid, missing, or inactive schedules.
- `POST /trips/book`: existing URL-encoded form fields `scheduleId`,
  `ticketClass`, `selectedDay`, and `passengers[index][field]`; JSON input with
  the same structure is also accepted. Success: 302 redirect to
  `/trips/confirmation/:bookingId`. Invalid submission: 400 JSON error;
  unavailable schedule: 404 JSON error; unexpected failure: existing 500 page.
- `GET /trips/confirmation/:bookingId`: existing URL retained for links;
  200 EJS confirmation using a booking loaded through the new model, or 404
  when no booking matches. Presentation may still say “confirmation.”

Page routes live in `ejs-routes.js`, API routes in `api-routes.js`.
Existing non-booking routes and the trains API contract remain compatible.

## Database integration and migration

Add the missing Mongoose dependency and use one shared Mongoose connection.
Expose its underlying database through `getDb()` for team features that still
use the native interface. Retain isolated MongoDB Memory Server tests.
Provide a separate, non-destructive migration command to rename the legacy
collection. Refuse to overwrite an existing `bookings` collection. Do not run
the starter-data import to migrate: it intentionally resets booking data.

## Test plan

1. Run `npm test` and `npm run lint` with no failures.
2. Create a booking through the real form endpoint; verify its redirect,
   Mongoose document, passenger fields, and rendered confirmation.
3. Verify two passengers survive URL-encoded submission.
4. Verify empty and populated `/api/bookings` responses and a simulated
   database failure returning JSON 500.
5. Reject missing/invalid passengers, more than eight passengers, unknown
   ticket classes, invalid days, and missing/inactive schedules without writes.
6. Confirm client-supplied IDs, timestamps, and trip IDs cannot override
   server-owned values; missing booking references return 404.
7. Verify admin HTML contains only a shell and client script, with booking
   data loaded through `/api/bookings`; check browser loading, empty, populated,
   and failed-request states, and literal display of HTML-like passenger names.
8. Verify the migration preserves old documents, is safe to rerun after a
   successful rename, and refuses to overwrite an existing target collection.
9. Re-run existing trains tests to check database/routing compatibility.

## Review deliverables

Use this specification as the GitHub issue body. The PR should link that issue,
summarize the implementation, list checks actually run, and include the
student's walkthrough video URL. Record the feature locally, explain the
schema/model/controller flow and at least one decision (e.g. server-owned
booking references and trip IDs), then share the PR in Teams. The student
must write the reflection in their own words and submit the links in Canvas.
