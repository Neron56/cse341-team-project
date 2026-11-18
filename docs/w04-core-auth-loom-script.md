# Week 04 Core Authentication Walk-through

**Recording status:** not recorded. This script describes the local demonstration to record after running the checks; it is not evidence of a video link.

## Short English script

“This is my proposed implementation of Week 04 Feature Set 1, Core Authentication. The official course page describes the feature, but I have not confirmed that the team assigned it to me.

I’ll first open `/admin` while signed out. The page guard redirects me to `/login`. The login form is rendered by `src/views/auth/login.ejs`; registration is in `src/views/auth/register.ejs`.

I’ll register a test customer. `register` in `src/controllers/auth.js` validates the submitted values, and `createUser` in `src/models/users.js` assigns the customer role on the server and hashes the password with bcrypt. The Mongoose user schema stores only the hash and references the role.

Now I’ll sign in with a wrong password, then the correct one. `login` checks the same generic error for invalid credentials. On success it regenerates the session identifier and saves only the safe user id, display name, username, and role in the server-side session. The cookie is HttpOnly and SameSite=Lax; production cookies are Secure. MongoDB stores the session.

The customer can call `/api/auth/me`, but cannot open `/admin` or `/api/admin/dashboard`: page and API role guards return different 403 responses. After a test account is promoted to the existing admin role in the local database, the admin dashboard and API are available.

Finally, I’ll POST `/logout`. The server destroys the session and clears the cookie; a new request to `/api/auth/me` receives 401.

I chose Mongo-backed sessions because this app renders EJS pages and makes same-origin API requests, so the browser sends its session cookie automatically. This follows the official W04 learning activity and keeps authorization checks on the server. The current checks are [list the exact test and lint results only after rerunning them]. The team assignment and the W03 integration baseline remain unconfirmed, so this is a proposed contribution rather than a completed team handoff.”

## Demo checklist

1. Start the app using the instructions in `README.md`.
2. Show unauthenticated `GET /admin` redirecting to `/login`.
3. Register a fictional test user; show duplicate/short-password rejection if time allows.
4. Submit invalid credentials, then log in successfully.
5. Show `GET /api/auth/me` in the browser or a local HTTP client.
6. Show the customer getting 403 from `/admin` and `/api/admin/dashboard`.
7. Promote only the local test account to the seeded admin role and sign in again.
8. Show the admin dashboard and API success.
9. POST `/logout`, then show `/api/auth/me` returning 401.
10. Briefly show the middleware, Mongoose schemas, and password/session controller functions.

Do not show real passwords, session identifiers, database credentials, or `.env` values in the recording.
