# Add protected user administration with owner/admin permissions

Closes #11

Signed-in customers can now edit or delete their own profile at `/admin/users`.
Admins see all profiles and can edit or delete any account. The EJS page renders
only a shell and form template; the browser fetches the list and refreshes it
after successful API updates/deletions without a page reload.

## Dependency and merge order

This is a stacked feature PR based on **core-authentication PR #6**, commit
`cee414325be3879d8ddff9309570096db600ba51`. Its base branch is
`deps/w04-core-auth-pr6`, a pointer to that exact prerequisite commit. Only
Feature Set 3 changes should appear in this PR's diff.

Do not merge the dependency branch into `main`. Keep this PR as a draft until
the team accepts core authentication and the walkthrough is recorded. Reconcile
the final PR #6 changes and retarget this PR to `main` before approval/merge.
W03 booking/schedule integration remains a team prerequisite. This PR does not
claim that core-auth ownership, its remaining review items, or deployment are done.

## Changes and decisions

- Mongoose model functions list, look up, update, and delete safe user profiles;
  explicit output fields exclude hashes, and updates allow only display name,
  username, and email with validation and duplicate-conflict handling.
- The server checks current account/role data on every authenticated request.
  This is necessary for profile deletion: another session belonging to a deleted
  user must stop working. It also closes the stale-admin-role case reviewed in
  PR #6. Self-deletion destroys the current session and clears its cookie.
- `GET /api/users` scopes customers to self and admins to all users. PATCH/DELETE
  require owner/admin permission and a session-bound `X-CSRF-Token`; customer
  probes of another ID return 403 regardless of target existence.
- Separate page/API routes preserve login redirects versus JSON errors.
  OpenAPI annotations document the new contracts. API failures return generic
  JSON; profile responses use `Cache-Control: no-store`.
- Browser forms render user data with text/value DOM properties, confirm deletes,
  handle validation/conflict/request errors, and refresh the list and signed-in
  name after changes. The admin dashboard and signed-in navigation link to the page.

## Verified test plan

- [x] `npm test`: **56 passing tests across 4 files**, including inherited
  core-auth and train regression tests.
- [x] `npm run lint`: passes.
- [x] Signed-out page redirect and JSON API 401 for list/update/delete.
- [x] Customer sees self; admin sees all; API never returns password hashes.
- [x] Own/admin update and deletion; forbidden access to another customer's
  account; 400 invalid input/ID, 404 missing authorized target, 409 conflicts.
- [x] Reject missing, invalid, and another-session mutation tokens; reject
  role/password/ID/timestamp/query-operator updates without writes.
- [x] Preserve credentials/roles on profile edits; new email works for login.
- [x] Self-deletion revokes current and second sessions. Deleting another user
  revokes their next request; demoted admins lose privileged access immediately.
- [x] Query and identity-lookup failures produce generic JSON 500.
- [x] DOM tests cover safe rendering, save/delete refetches, cancellation,
  empty/error states, conflict correction, retry, and refresh failure after save.
- [x] Real headless Chrome, isolated temporary MongoDB: signed-out redirect,
  admin list/edit/delete, customer self-only list/edit, direct cross-account
  mutation rejection (403), self-deletion redirect, and zero browser script errors.
  Inspected desktop and mobile profile screenshots.
- [x] New route annotations parse with swagger-jsdoc, including response schemas.
- [ ] Student's narrated application/code walkthrough video (pending).
- [ ] Final integration after PR #6 is accepted; team review and Teams post.

## Walkthrough video

Pending: add a new recording for Feature Set 3 before marking ready for review.
The earlier W03 bookings recording does not demonstrate this feature.

## Remaining dependency limitations

The prerequisite core-auth PR is unmerged and still has review follow-ups,
including its login password-length boundary. That login behavior is outside
this profile-management change. The current dependency audit reports 14
advisories (7 moderate, 6 high, 1 critical); remediation is not included here.
No persistent database was changed during verification.
