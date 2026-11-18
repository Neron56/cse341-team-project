# Week 04 Core Authentication Walk-through

**Published recording:** [Loom — narrated explanation](https://www.loom.com/share/9fbbe83b25504c30b0351efc933f5509).

**Recording note:** The published video is narration-only because technical difficulties prevented screen capture. It does not show the running application, browser, or code; no visual demonstration is claimed. The prepared narration and optional screen sequence below are planning notes, not a transcript or evidence of what appears in the published video.

## English script (approximately 3–4 minutes)

“Hello. This is my proposed implementation of CSE 341 Week 04 Feature Set 1, Core Authentication. The Feature Set is listed in the official assignment, but I have not confirmed a formal team assignment.

This demonstration uses `npm run demo:auth`. That command starts MongoDB Memory Server, initializes the normal application data and roles, creates one temporary admin account with a randomly generated password, and generates a temporary session secret. Nothing is written to the configured MongoDB database. I am keeping the terminal out of the recording because it displays the one-time admin credential. The browser will show only masked password input.

First, I open the registration page and create a fictional customer account. The registration handler is `register` in `src/controllers/auth.js`. It validates the fields and never accepts a role from the request. The `createUser` function in `src/models/users.js` assigns the seeded customer role and hashes the password with bcrypt. The Mongoose schemas in `src/models/schemas/users.js` and `roles.js` define the required profile fields, unique identifiers, password hash, and role reference. The hash is excluded from normal user queries.

Next, I log in with the customer account and open `/api/auth/me`. The response contains only the safe identity and role. Authentication means the server has established who this user is. Authorization is a separate decision about what that authenticated user may access.

I’ll open `/admin` as the customer. The page returns 403, and the admin API also rejects this role. In `src/middleware/auth.js`, `loadSessionUser` loads the session identity; `requirePageLogin` and `requireApiLogin` handle signed-out requests differently; `requirePageRole` and `requireApiRole` enforce the admin role and return 403 for an authenticated customer.

The session is managed by `express-session` in `app.js`, before the routes. `connect-mongo` stores sessions in MongoDB. The cookie contains a signed session identifier, is HttpOnly and SameSite=Lax, and is Secure in production. The login controller regenerates the session ID after credentials are verified. The logout handler destroys the server-side session.

I’ll submit the logout form and call `/api/auth/me` again. It now returns 401, confirming that the session was revoked. Then I’ll log in with the temporary admin account created by the demo runner and show the protected `/admin` page and `/api/admin/dashboard`. This admin identity exists only in the temporary database.

The main technical decision was to use Mongo-backed sessions instead of JWTs. This application renders EJS pages and makes same-origin API calls, so the browser sends the session cookie automatically. This follows the official Week 04 learning activity and keeps authorization checks on the server.

`npm run lint` passed. `npm test -- --reporter=verbose` passed with two test files and seven tests, including the existing trains API regression. The import script was also run against an isolated in-memory database to confirm both standard roles. The GitHub Issue is [Issue 1](https://github.com/kennethduron/cse341-kizuna-rail-w04/issues/1), and the proposed contribution is [Draft PR 6](https://github.com/Neron56/cse341-team-project/pull/6). GitHub currently reports it mergeable against `main`, but it is still a draft, unreviewed, and not team-approved. The shared integration files still need review alongside the open W03 PRs. Thank you.”

## Optional visual sequence for a separate recording

This sequence is not shown in the published Loom video.

| Time | Show |
|---|---|
| Before recording | Run `npm run demo:auth`; keep the terminal displaying the temporary password outside the recording. Open `http://127.0.0.1:3300/register`. |
| 0:00–0:25 | Briefly show the registration page and introduce Feature Set 1 as a proposed contribution, not a confirmed team assignment. |
| 0:25–0:55 | Register a fictional customer. Show the post-registration login notice. |
| 0:55–1:20 | Log in successfully; open `/api/auth/me` and point out the safe identity and `customer` role. |
| 1:20–1:45 | Open `/admin` and `/api/admin/dashboard`; show the customer's 403 responses. |
| 1:45–2:25 | Show `src/controllers/auth.js`, `src/models/users.js`, `src/models/schemas/users.js`, and `src/models/schemas/roles.js`. Explain validation, bcrypt, and the server-assigned customer role. |
| 2:25–2:55 | Show `src/middleware/auth.js` and `app.js`. Explain authentication vs. authorization, page/API responses, middleware order, Mongo session store, and cookie settings. |
| 2:55–3:20 | Open the navigation menu if needed, click **Log out**, then request `/api/auth/me` and show 401. |
| 3:20–3:40 | Log in using the temporary admin credential without showing the terminal; show `/admin` and `/api/admin/dashboard`. |
| 3:40–4:00 | Show the test summary and links to Issue 1 and Draft PR 6; state the integration and assignment limitations. |

Use only fictional customer data. Do not record the demo terminal, temporary admin password, session cookie, environment variables, or any real credentials. Stop the process with Ctrl+C after recording.
