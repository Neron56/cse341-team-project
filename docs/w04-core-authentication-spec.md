Setup

Install express-session and a password hashing library (bcrypt).
Add a SESSION_SECRET to .env.
Register the session middleware in app.js before app.use('/', routes). Also expose the session user to templates through res.locals, so EJS can show role-based links.

Schemas

src/models/schemas/roles.js: a role has a unique name.
src/models/schemas/users.js: fields are displayName, username (unique), email (unique), passwordHash, and role (Stored as ObjectId reference).

Import script

Update the existing db import script to insert the standard roles(user and admin).
Run the script before testing.

Models

src/models/users.js:
createUser(data): creates a user with a hashed password.
findUserByEmail(email): used by login and for duplicate checks.

Controllers

src/controllers/users.js:
processUserRegistrationForm: validates input, checks for duplicates, hashes the password, creates the user, and redirects to login.
processLoginForm: finds the user, compares the password, stores { user } data in the session, and redirects.
processLogout: destroys the session and redirects.

Middleware

src/middleware/auth.js exports:
requireApiLogin(): 401 JSON if there is no session user.
requirePageLogin(): redirects to /login if there is no session user.
requireApiRole(role): 401 JSON if not logged in, 403 JSON if session.user.role doesn’t match.
requirePageRole(role): redirects to /login if not logged in, and to the 403 page if the role doesn’t match.

Routes

/register (GET shows the form, POST submits it)
/login (GET shows the form, POST submits it)
/logout (POST is safer than GET, since a GET link can be triggered accidentally or by another site)
/adminDashboard protected with requirePageRole('admin')

Views

src/views/register.ejs: form with display name, username, email, and password.
src/views/login.ejs: form with username or email, and password.
src/views/adminDashboard.ejs: “Welcome to the Admin Dashboard”.
src/views/errors/403.ejs: a forbidden page matching your existing 404 and 500 pages.

Testing checklist

Register a new user and confirm the password is stored hashed in Atlas.
Log in, then check that the session holds the user’s info and role.
Visit /admin logged out (redirect to login), as a regular user (403 page), and as an admin (dashboard).
Log out and confirm /admin redirects again.
Create a temporary route using each of the four middleware functions and confirm the status codes: 401 and 403 for the API versions, redirects for the page versions.