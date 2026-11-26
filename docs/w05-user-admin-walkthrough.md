# Walkthrough: Paginated User List

## Setup
1. Pull the branch and run `npm install`.
2. Make sure `.env` has `MONGODB_URI` and `SESSION_SECRET`.
3. Run the seed script so the `user` and `admin` roles exist.
4. Start the server.

## Add test users
Insert the 15 test users (`testuser1` to `testuser15`) from the PR's test data, with the
`user` role's `_id`. All use the password `test`. Set `role` to the `admin` role's `_id`
on one account so you can log in as an admin.

## Test the page
1. Log in as the admin and click **Users** in the header.
2. Confirm 10 users appear, sorted by username, and that Previous is disabled.
3. Click Next. Confirm the remaining users appear and Next is disabled.
4. Click Previous and confirm you return to page 1 without a page reload.

## Test the API
1. Open `/api/users?page=2&limit=5` while logged in as an admin and check the JSON and pagination values.
2. Confirm `passwordHash` never appears.
3. Try `?page=0`, `?limit=100`, and `?sort=banana`. Each should return a 400.
4. Try `?sort=email&order=desc` and confirm the order reverses.

## Test access control
1. Log out and open `/users`. You should be redirected to login.
2. Log out and open `/api/users`. You should get a 401 JSON response.
3. Log in as a regular user. `/users` should show the 403 page and `/api/users` should return 403 JSON.

## Swagger
Run the Swagger generator script, restart the server, and open `/api-docs`. Find
`GET /api/users` and try it with different `page` and `limit` values.