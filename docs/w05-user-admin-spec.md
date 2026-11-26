# Spec: Paginated User List

## Requirements checklist
| Requirement | Where it's met |
|---|---|
| Paginated list, 10 per page | `getPaginatedUsers`, `createUsersList`, `public/js/users.js` |
| Default sort by username | `createUsersList` (`sort` defaults to `username`) |
| Pagination controls on the page | `list.ejs` and `public/js/users.js` |
| Client-side JS populates the list from `/api/users` | `public/js/users.js` |

## API: `GET /api/users`
Admin only (`requireApiRole('admin')`).

| Query param | Default | Rules |
|---|---|---|
| `page` | 1 | positive integer |
| `limit` | 10 | positive integer, max 50 |
| `sort` | `username` | one of `displayName`, `username`, `email` |
| `order` | `asc` | `asc` or `desc` |

**Success (200)**
{ "data": [ { "_id", "displayName", "username", "email", "role": { "_id", "name" } } ],
  "pagination": { "page", "limit", "totalUsers", "totalPages", "hasNextPage", "hasPreviousPage" } }

**Errors:** 400 for invalid pagination or sort values, 401 if not logged in, 403 if not an admin.

## Files
- Model: `getPaginatedUsers({ filter, page, limit, sort, order })` uses `find`, `sort`, `skip`, `limit`, and `countDocuments`, and excludes `passwordHash`
- Controller: `createUsersList` plus the `parsePositiveInteger` helper and the `allowedSortedFields` list
- Routes: `/api/users` (API) and `/users` (page)
- View: `src/views/users/list.ejs`
- Client script: `public/js/users.js`

## Behavior
- Previous is disabled on page 1, and Next on the last page
- Empty results show "No users found."
- A failed request shows an error message instead of a blank table
- Logged-out visitors to `/users` go to login, and non-admins see the 403 page