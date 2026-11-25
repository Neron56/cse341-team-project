# Filter paginated bookings by ticket class and booking date

Closes #22

Builds on pagination PR #23. `/bookings` now provides ticket-class and inclusive
booking date-range controls. Apply/Clear reset to page 1, while Previous/Next
keep the applied filters. Draft input changes alone do not change the query.
The page renders matches and updated totals through API calls without reloading.

`GET /api/bookings` adds optional `ticketClass`, `startDate`, and `endDate`.
Dates use exact, validated `YYYY-MM-DD` UTC calendar days and filter `createdAt`,
not travel day. The upper bound is strictly before the following midnight so
the complete end day is included. Either bound works independently; all supplied
conditions combine with AND. The same query is used for the count and page.

Responses include normalized `filters` (omitted values are null), matching
pagination totals, and the existing sort metadata. Invalid/repeated/structured
filters, impossible dates, reversed ranges, and unsupported classes return safe
JSON 400. Existing pagination/sort validation and generic 500 responses remain.
Swagger documents all query parameters, metadata, and UTC semantics.

## Dependency and merge order

This PR targets `feat/w05-bookings-pagination` so only the filter additions
appear in its diff. PR #23 itself depends on the W03 booking PR #4. Reconcile
the accepted prerequisites and retarget after their merges; do not merge the
dependency branches to bypass review. The booking baseline's access policy is
unchanged; authentication integration remains with the team's accepted work.

## Verified test plan

- [x] `npm test`: **94 tests pass across 5 files**.
- [x] `npm run lint` and `git diff --check` pass.
- [x] All three classes, 10/2 filtered pages, combined filters with more than
  10 matches, independent date bounds, ascending order, empty/out-of-range pages.
- [x] Inclusive UTC midnight/last-millisecond boundaries and a valid leap day.
- [x] Reject unknown/empty classes, malformed or impossible dates, timestamps,
  reversed ranges, duplicate parameters, and query-operator input.
- [x] DOM tests verify Apply/Clear reset, applied versus draft filters,
  preservation across pages, empty matches, local range validation, and ignoring
  a late response from an older filter request.
- [x] Real Chrome with temporary data: baseline pages 10/10/10/6; premium pages
  10/2; premium plus November 3-5 has 3 matches; empty dates show a message;
  Clear restores all 36 bookings. No page reload and zero browser script errors.
- [x] New Swagger filter parameters and response metadata parse successfully.
- [ ] Student's filter-specific walkthrough video, 2 minutes (maximum 3).

## Walkthrough video

Pending: add a separate recording for this filtering PR before marking it ready.
Explain at least two decisions and the alternative approaches considered.

## Local demonstration and indexes

Run `npm run demo:bookings` and open `http://127.0.0.1:3400/bookings`. The demo
contains 36 fictional bookings from November 1-12, 2026, with 12 per class.
It never modifies the configured shared database.

For existing data, run `npm run db:migrate-bookings` with the app stopped to
normalize valid legacy timestamp strings and add the new compound class/date/ID
index. The migration preserves invalid historical values for manual correction;
those are not valid booking dates. Do not use the destructive starter-data import
for migration. No persistent database was modified during verification.
