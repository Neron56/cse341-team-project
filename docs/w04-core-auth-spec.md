# W04 Feature Set 1: Core Authentication

**Status:** proposed implementation; the course feature set is confirmed, but a team owner has not been confirmed. This is not a claim that the team assigned the work to Kenneth.

## Source and scope

The implementation follows the current [official W04 assignment](https://byui-cse.github.io/cse341-ww-course-v2/week04/assignment.html), Feature Set 1, and its [Session Authentication Middleware learning activity](https://byui-cse.github.io/cse341-ww-course-v2/week04/prepare-auth-middleware.html).

Included: customer registration, login/logout, password hashing, server-side sessions, customer/admin roles, page/API authentication and role guards, and the admin dashboard. Public registration is always assigned the `customer` role on the server. No user/booking/trip administration from Feature Sets 2-5, business-specific roles, OAuth provider, JWTs, or default administrator credentials are included.

## Data and session design

- Mongoose `Role` documents use the course's standard `customer` and `admin` names.
- Mongoose `User` documents store `displayName`, unique normalized `username` and `email`, a bcrypt `passwordHash`, and a required `Role` reference. The hash is excluded from normal Mongoose queries.
- The database initializer upserts both roles and ensures unique role, username, and email indexes. It does not create an administrator or reset user records.
- `express-session` stores session data in MongoDB via `connect-mongo`. The browser receives a signed session identifier, not credentials or role data.
- The cookie is HttpOnly, SameSite=Lax, Secure in production, and has a one-hour rolling idle expiry. Session IDs are regenerated at login; logout destroys the server-side session and clears the cookie.
- `SESSION_SECRET` is required and must be at least 32 characters. Use a unique random value per environment.

## Routes and behavior

| Method and path | Access | Behavior |
|---|---|---|
| `GET /register` | Public | Render registration form |
| `POST /register` | Public | Validate input, assign `customer`, hash password; redirect 303 or render 400/409 |
| `GET /login` | Public | Render login form |
| `POST /login` | Public | Verify credentials; redirect 303 or show a generic 401 |
| `POST /logout` | Authenticated | Destroy session, clear cookie, redirect 303 |
| `GET /admin` | Admin | Render dashboard; signed-out users redirect to `/login`; other roles receive 403 |
| `GET /api/auth/me` | Authenticated | Return safe session user JSON; signed-out response is JSON 401 |
| `GET /api/admin/dashboard` | Admin | Return dashboard JSON; signed-out response is JSON 401; other roles receive JSON 403 |

Authentication establishes `req.user`; authorization separately compares its session role to the required role. There is no user-supplied role selector and no owner-sensitive resource in this feature set.

## Acceptance criteria

- Registration stores no plaintext password and cannot self-assign `admin`.
- Existing normalized email or username conflicts receive a friendly 409.
- Invalid credentials use the same message and status without disclosing whether an account exists.
- Login creates a new server-side session and the browser receives only the session cookie.
- Unauthenticated page and API requests receive their distinct redirect/JSON 401 behavior.
- An authenticated customer is denied the admin page and API with 403; an admin can access both.
- Logout revokes server-side access.
- Existing public routes and the trains API continue to work.
- Lint and the full automated test suite pass.

## Test plan and evidence

Automated HTTP tests in `tests/auth.test.js` exercise invalid registration, successful registration and hashing, duplicate accounts, bad credentials, session persistence, page/API 401 and 403 behavior, admin access, logout revocation, and cookie flags. Existing `tests/trains.test.js` covers the trains API regression.

Verified: `npm run lint` passed; `npm test -- --reporter=verbose` passed (2 files, 7 tests); the database import module ran against an isolated MongoDB Memory Server and confirmed both standard roles; and `npm run demo:auth` was exercised in a browser for customer registration/login, `/api/auth/me`, customer 403 responses, logout followed by 401, and successful temporary-admin access to the page and API. Test evidence is not a substitute for team review or an official feature-owner confirmation. No Loom recording exists yet.

## Integration boundary

This branch is based on fork `main` and does not include W03 PR #4 or #5. Both open PRs modify shared integration files (including app/route/database/dependency files), and PR #4 adds Mongoose. This feature necessarily touches the same integration surface to introduce sessions, Mongoose models, and auth routes. Do not merge either PR head into this branch speculatively; resolve the overlapping work against the team's accepted integration baseline before opening a team PR.
