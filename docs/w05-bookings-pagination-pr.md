# Paginate booking administration and return query metadata

Closes #21

The booking admin page now requests ten bookings at a time instead of loading
every booking. `/bookings` is the canonical page, with `/bookings-admin` retained
as an alias. Previous/Next controls and a range/total summary update through the
API without a page reload. Booking dates display in UTC.

`GET /api/bookings` accepts validated `page`, `limit` (1-100, default 10), and
`sort` (asc/desc, default desc). MongoDB performs the sort, skip, limit, and count.
The response retains `bookings` and adds `pagination`, `sort`, and an empty
`filters` object. Empty/out-of-range pages return 200 with metadata; malformed,
repeated, unknown, and unsafe query values return JSON 400. Database failures
return generic JSON 500. Swagger documents the contract.

Ordering uses `createdAt` plus `_id` to break ties. Existing databases should
run `npm run db:migrate-bookings`: it preserves records, normalizes valid legacy
ISO timestamp strings, and adds the date-order index. Invalid historical date
values are retained for manual correction. Do not use `db:import` to migrate.

## Dependency and second PR

This PR targets `feat/w03-bookings`, the still-unmerged PR #4, so its diff
contains only the pagination work. Reconcile the accepted prerequisite and
retarget to `main` after PR #4 merges. The related issue #22 adds ticket/date
filters in a separate PR on top of this one; this first PR does not add filters.
The team's authentication integration remains separate from this booking base.

## Verified test plan

- [x] `npm test`: 65 tests pass across 4 files.
- [x] `npm run lint` and `git diff --check` pass.
- [x] API pages of 10/10/5, correct totals and boundaries, stable ties, ascending
  order, custom limits, empty/out-of-range results, query validation and DB errors.
- [x] Existing booking flow, confirmation, migration, and train regression tests.
- [x] DOM checks for safe rendering, controls, navigation, retry after failure,
  empty results, and recovery when the last page disappears.
- [x] Real Chrome demo: 36 temporary bookings render as 10/10/10/6 across four
  pages, final Next is disabled, no page reload, zero browser script errors.
- [x] Swagger annotations parse with the new parameters, metadata, and statuses.
- [ ] Student's narrated walkthrough recording (2 minutes, maximum 3).

## Walkthrough video

Pending: add the pagination-specific recording before marking ready for review.
The student must explain at least two decisions and their alternatives.

## Local demonstration

Run `npm run demo:bookings`, then open `http://127.0.0.1:3400/bookings`.
The command creates 36 fictional bookings in a temporary MongoDB instance;
it never reads or changes the configured shared database. Stop with Ctrl+C.
