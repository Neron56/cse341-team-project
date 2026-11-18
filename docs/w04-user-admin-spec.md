# W04 Feature Set 3: Protected User Admin Page

## Purpose and dependency

Give signed-in customers access to their own profile and admins access to all
profiles, with API-driven editing/deletion and no page refresh after changes.
Owner: `IOneStarI`. Branch: `feat/w04-user-admin`.

This feature depends on core authentication in PR #6, currently unmerged. Its
initial baseline is commit `cee414325be3879d8ddff9309570096db600ba51`.
Use `deps/w04-core-auth-pr6` as the stacked PR base so the review shows only
Feature Set 3 changes. Do not merge this dependency branch into `main`.
After PR #6 is accepted, reconcile its final changes and retarget this PR to
`main`. W03 branches remain separate. Core-auth ownership and merge decisions
still belong to the team; this issue does not claim that prerequisite is done.

## Data and authorization

Reuse the existing Mongoose `User` and `Role` models and MongoDB sessions.
A public user representation contains `id`, `displayName`, `username`, `email`,
`role`, `createdAt`, and `updatedAt`. Never return password hashes or session
identifiers. Editable fields are `displayName`, `username`, and `email`;
role/password/ID/timestamps are not editable through this feature.

Every authenticated request reloads the account and role from the database.
Deleted accounts lose access on their next request, including other sessions.
Role changes are reflected without requiring a new login. Self-updates refresh
the current session identity; self-deletion destroys that session and clears
the cookie. Customer-to-customer reads, updates, and deletes are forbidden.
Admins can edit/delete any account, including their own, as the assignment
requires. No special last-admin exception is introduced.

Updates accept a nonempty JSON object with only editable fields. Values must
be strings; display names are trimmed and 1-80 characters, usernames are
normalized lowercase and match `[a-z0-9._-]{3,32}`, and emails are trimmed,
lowercase, at most 254 characters, and pass the existing basic format check.
Model updates use an explicit field allowlist, validators, and no upsert.
Duplicate usernames/emails return a generic conflict without database details.
Mutations require a session-bound CSRF token in `X-CSRF-Token`.

## Routes and responses

| Route | Access | Result |
| --- | --- | --- |
| `GET /admin/users` | Any signed-in user | 200 EJS shell; signed-out users redirect to `/login` |
| `GET /api/users` | Any signed-in user | 200 `{ users: User[], currentUserId, csrfToken }`; admin sees all, customer sees self |
| `PATCH /api/users/:id` | Admin or owner + CSRF token | 200 `{ user: User }` with updated profile |
| `DELETE /api/users/:id` | Admin or owner + CSRF token | 200 `{ deletedId, signedOut }`; `signedOut` true for self-deletion |

JSON errors use `{ error: string }`: 400 invalid ID/body/fields, 401 signed out
or account deleted, 403 another customer's account or invalid/missing CSRF
token, 404 authorized target not found, 409 duplicate username/email, and 500
unexpected failure. Check ownership before looking up another customer's
target so the result does not disclose whether it exists. Sensitive page/API
responses use `Cache-Control: no-store`. Include OpenAPI response documentation.

## Frontend behavior

The page contains loading/error/status messages, an empty list, and a reusable
profile form template. Client JavaScript fetches `/api/users` and inserts values
using DOM APIs. The server does not iterate through the user list in EJS.
Each card provides Save changes and Delete actions. Delete asks for confirmation.
Mutation requests include the CSRF header; successful changes refetch the list
without reloading the page. Refresh the signed-in name after self-updates.
Show useful validation/conflict/error messages, disable controls while saving,
and redirect to login after self-deletion or a 401 response. Add a Manage users
link to the admin dashboard and a My account navigation link for signed-in users.

## Test plan

1. Run `npm test` and `npm run lint`; retain existing auth/train tests.
2. Signed-out page redirects; list/update/delete APIs return JSON 401.
3. Customer sees only their profile; admin sees every account; no hashes leak.
4. Customer can update/delete self but cannot change another valid/nonexistent
   user ID. Admin can update/delete any account and receives 404 for missing ones.
5. Reject malformed IDs, empty/invalid updates, arrays, query operators, role or
   password changes, and missing/wrong/other-session CSRF tokens without writes.
6. Duplicate email/username returns 409; profile edits preserve password hash
   and role. Changed email works for a subsequent login.
7. Self-updates refresh session/profile identity. Self-deletion destroys access
   in current and second sessions. A deleted/demoted admin loses old privileges.
8. Database errors return generic JSON 500 without private details; failed
   authorization/database lookup never grants access.
9. DOM tests verify dynamic rendering, safe display of HTML-like names,
   update/delete requests and list refresh, cancellation, and error/empty states.
10. Record an interactive local walkthrough of signed-out, customer, and admin
    behavior and explain authorization, editable-field allowlisting, and CSRF.

## Deliverables

Create this issue before implementation. Open a draft PR linked to the issue,
include verified checks and dependency details, then add the student's actual
video URL before requesting final review. Prepare recording/reflection files
locally; do not commit or push them. The student posts the ready PR in Teams,
coordinates feature ownership/dependencies, and completes Canvas submission.
