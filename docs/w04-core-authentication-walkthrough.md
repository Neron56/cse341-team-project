Video Walkthrough link:

1.Install dependencies and set MONGODB_URI and SESSION_SECRET in .env.

2.Run the seed script, then confirm two roles exist in the roles collection.

3.Register a new user, and check that the password is hashed in Atlas.

4.Log in, and check that the header shows Logout and no Admin link.

5.Visit /adminDashboard as a regular user, and expect the 403 page.

6.Promote the account to admin in Atlas by setting role to the admin role’s _id, then log out and back in.

7.Visit /adminDashboard again, and expect “Welcome to the Admin Dashboard”.

8.Log out, and confirm /adminDashboard redirects to the login page.

9.(Optional) Attach requireApiLogin() and requireApiRole('admin') to a temporary route to confirm the 401 and 403 JSON responses.