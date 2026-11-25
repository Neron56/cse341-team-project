# W05 Feature Set 3: booking pagination and filters

Owner: `IOneStarI`. Create both issues before implementation.

## Dependencies and two-PR plan

The existing booking feature is still in PR #4 at `cc871d4`, not in `main`.
PR 1 (`feat/w05-bookings-pagination`) targets `feat/w03-bookings` and adds
pagination only. PR 2 (`feat/w05-bookings-filters`) targets PR 1's branch and
adds ticket-class/date filtering. After prerequisites merge, reconcile the
accepted code and retarget the next PR to `main`. Do not merge dependency
branches merely to bypass their existing review. Authentication integration
remains with the team's accepted auth work; these PRs preserve the booking
baseline's access policy and do not introduce a different session contract.

## Common routes and response contract

`GET /bookings` is the canonical EJS page. Keep `/bookings-admin` as a compatible
alias. EJS supplies the page shell; JavaScript fetches `/api/bookings`, updates
cards and controls, and changes pages without navigation or a full refresh.
The UI always requests 10 results at a time.

`GET /api/bookings` returns 200 with:

```json
{
  "bookings": [],
  "pagination": {
    "page": 1, "limit": 10, "totalItems": 0, "totalPages": 0,
    "hasPreviousPage": false, "hasNextPage": false
  },
  "sort": { "by": "createdAt", "order": "desc" },
  "filters": {}
}
```

Keep the existing booking/passenger fields unchanged. An empty result or a page
beyond the last page returns 200 with an empty bookings array and accurate
metadata; do not silently change the requested API page. The UI recovers to
the last valid page if records disappear while it is being used.
Queries run in MongoDB with `skip`, `limit`, and `countDocuments`, not by loading
all bookings into Node or slicing them in the browser. Count and page use the
same filter. Sort by `createdAt` and `_id` in the same direction for stable ties.
Offset pages may shift when new records arrive; no snapshot consistency is
promised between the independent count and list reads.

## PR 1: pagination

| Parameter | Default | Validation |
| --- | --- | --- |
| `page` | 1 | Positive safe integer in canonical decimal notation |
| `limit` | 10 | Positive integer, maximum 100 |
| `sort` | desc | `desc` (newest first) or `asc` (oldest first), on booking date |

Reject zero, negatives, decimals, exponent notation, repeated/structured values,
empty values, unsafe page offsets, and unknown query parameters with 400 JSON
`{ "error": "specific safe validation message" }`. Unexpected database failures
return 500 `{ "error": "Failed to fetch bookings" }`. Apply `Cache-Control:
no-store`. Document parameters, metadata, empty results, and 400/500 in Swagger.

Add Previous/Next buttons, a range/total summary, a page indicator, loading and
error states, and a retry action. Disable unavailable controls and preserve
the last successful page after errors. Ignore stale responses if requests
overlap. Show booking date in UTC to match the later filter boundaries.
Add a `{ createdAt: -1, _id: -1 }` index through the existing non-destructive
migration command and fresh-database initializer. Use a temporary-data demo
command so recording never changes the team's shared database.
The migration also converts valid legacy ISO timestamp strings into BSON dates
so date sorting/range queries work on migrated confirmations. Malformed legacy
values are preserved for manual correction; they are not valid booking dates.

### PR 1 test plan

1. Seed 25 known bookings: verify pages contain 10/10/5 records, metadata and
   adjacent-page IDs are correct, default order is descending, and asc works.
2. Verify deterministic ties, empty results, out-of-range pages, custom limit,
   all rejected query shapes, count/query failures, and no regression in the
   booking submission/confirmation and train endpoints.
3. Verify `/bookings` and its alias render shells. DOM tests cover controls,
   range text, Previous/Next, safe rendering, empty/error/retry states, and stale
   responses. Check actual browser pagination without a page reload.
4. Run tests, ESLint, diff checks, and parse the Swagger annotations.

## PR 2: ticket class and booking date filters

Add optional `ticketClass`, `startDate`, and `endDate` query parameters. Valid
classes match the current starter ticket classes: `standard`, `premium`, `first`.
Dates must be actual calendar dates in exact `YYYY-MM-DD` format. Reject invalid
dates (including impossible days), timestamps, duplicate/structured values,
unsupported classes, and start dates later than end dates with 400 JSON.

Filter `createdAt`, not travel day. Start date includes UTC midnight; end date
includes its full UTC day by querying strictly before the following midnight.
Either bound may be supplied alone. Combine class and date conditions with AND.
Add normalized metadata:

```json
"filters": { "ticketClass": null, "startDate": null, "endDate": null }
```

Replace nulls with the applied values. `totalItems`, `totalPages`, and navigation
flags describe only matching records. Preserve all pagination/sort validation.
Add a `{ ticketClass: 1, createdAt: -1, _id: -1 }` index alongside the date index.

Add a ticket-class selector and date inputs with an Apply filters button and
Clear filters button. Applying/clearing resets to page 1. Page navigation keeps
the applied filters, while editing draft inputs alone does not change them.
Empty matches show a useful no-results message. Handle invalid input and API
errors without displaying an incorrect page or leaving stale requests in charge.
Document the date semantics and normalized filter metadata in Swagger.

### PR 2 test plan

1. Verify each class, start-only/end-only ranges, inclusive boundaries, a
   leap day, combined filters, and no matches; totals and pages must be filtered.
2. Seed more than 10 matches: verify page 2 keeps all conditions and returns
   the right IDs/count. Test invalid dates/ranges/classes and query injection.
3. DOM and actual-browser checks: Apply/Clear reset page, Next/Previous preserve
   applied values, invalid ranges show an error, and updates need no refresh.
4. Run the full tests, ESLint, diff checks, and Swagger parsing again.

## Submission and personal artifacts

Each PR links its own issue, lists verified checks, and stays a draft until its
own 2-minute (maximum 3-minute) walkthrough recording is supplied. Each recording
must demonstrate behavior, explain code, and discuss at least two choices with
their alternatives. Recording scripts and the W05 reflection/template remain
local and Git-excluded. The student personalizes the reflection, includes both
PR links, posts ready PRs in Teams, and uploads the reflection to Canvas.
