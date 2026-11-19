# Feature Set 1: Core Authentication

## Summary
Adds user registration, login, and logout with session-based authentication,
role-based access control, and an admin-only dashboard.

## What changed
- User and role Mongoose schemas (`src/models/schemas/users.js`, `roles.js`)
- Role seeding in the db initialize script (upsert by name, so role `_id`s stay stable)
- Register, login, and logout pages, controllers, and routes
- `express-session` setup in `app.js`, with `isLoggedIn`, `user`, and `isAdmin` exposed to templates
- Middleware: `requireApiLogin`, `requireApiRole`, `requirePageLogin`, `requirePageRole`
- Admin Dashboard page and 403 error page
- Header links that change based on login state and role

## Notable decisions
- Passwords are hashed with bcrypt; the session stores only id, display name, and role name
- Roles are seeded with an upsert instead of delete-and-insert, because users reference the role `_id`
- New registrations always get the `user` role; admins are promoted manually in Atlas

## How to test
See `walkthrough.md`.

## Notes for reviewers
- Run the seed script before testing so the roles exist
- `SESSION_SECRET` must be set in `.env`
- Sessions use the default memory store, so a server restart logs everyone out