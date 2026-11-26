# Feature Set 2, PR 1: Paginated User List

## Summary
Adds a paginated, admin-only user list. The `/users` page loads users from
`GET /api/users` with client-side JavaScript and steps through them 10 at a time,
sorted by username by default.

## What changed
- `src/models/users.js`: `getPaginatedUsers` returns one page of users plus the total count (password hash excluded, role name populated)
- `src/controllers/users.js`: `createUsersList` validates `page`, `limit`, `sort`, and `order`, and returns the users with pagination info
- `src/routes/api-routes.js`: `GET /api/users` with Swagger docs, protected by `requireApiRole('admin')`
- `src/routes/router.js`: `GET /users`, protected by `requirePageRole('admin')`
- `src/views/users/list.ejs`: user table and pagination controls
- `public/js/users.js`: fetches the API, renders rows, and handles Previous/Next
- `Header`: "Users" link shown to admins
- `swagger.json`: regenerated

## Notable decisions
- Page and limit are validated on the server (limit capped at 50), and bad values return a 400
- Sorting adds `_id` as a tie-breaker so users with matching values never repeat or disappear between pages
- Rows are built with DOM nodes and `textContent`, not `innerHTML`, so user-supplied values can't inject markup
- The API never returns `passwordHash`

## How to test
See `walkthrough.md`.

## Notes for reviewers
- You need more than 10 users to see paging; the walkthrough includes test accounts
- Run `npm run` the Swagger generator script after pulling, then restart, to see the docs at `/api-docs`
- PR 2 (role filter and search) builds on the `filter` argument already passed to `getPaginatedUsers`