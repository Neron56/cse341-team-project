# Add Mongoose bookings and an API-driven bookings admin page

Closes #3

Booking submissions now create validated Mongoose documents in `bookings`
instead of writing request bodies directly to `confirmations`. The existing
form and confirmation URLs are preserved. Booking page controllers live in
`src/controllers/bookings.js`, with separate EJS and API route modules.

`GET /api/bookings` returns JSON with Swagger documentation. `/bookings-admin`
loads its list and passenger details using client-side JavaScript, with
loading, empty, and error states. Passenger values are rendered as text.

The change adds the missing Mongoose dependency and shares its connection
with the existing native database readers. Reference-data lookups are isolated
in `src/models/booking-options.js` until the team's related models are ready.
A separate migration renames existing data without overwriting either collection.

## Verified test plan

- [x] Automated booking creation and lookup in `bookings`.
- [x] Two-passenger URL-encoded submission and existing confirmation rendering.
- [x] Rejection of invalid passengers, more than eight passengers, unknown
  ticket classes, unsupported days, missing and inactive schedules.
- [x] Server-owned references, timestamps, and trip IDs cannot be overridden.
- [x] Empty and populated API responses; generic JSON 500 on query failure.
- [x] Admin page contains a shell without server-rendered booking records.
- [x] DOM checks for loading, empty, populated, failed, and malformed API
  responses, including literal rendering of HTML-like passenger names.
- [x] Migration preserves legacy records, is safe to rerun, and refuses to
  overwrite an existing target.
- [x] Existing train endpoint regression tests.
- [x] `npm test`.
- [x] `npm run lint`.
- [ ] Student's interactive local walkthrough and recording.

Validation result: all 34 tests pass across three test files; ESLint passes.
`npm audit` reports 14 dependency advisories (7 moderate, 6 high, 1 critical).
Dependency remediation is not included in this feature branch.

## Walkthrough video

Pending: add the student's recording URL before marking the PR ready for review.
Recording outline: `docs/w03-bookings-walkthrough.md`.

## Database rollout

Stop the app and run `npm run db:migrate-bookings` before starting this version
against existing data. Do not use `db:import` for migration because it resets
starter collections and bookings. The assignment does not include admin
authentication, so use fictional passenger details for demonstrations.
