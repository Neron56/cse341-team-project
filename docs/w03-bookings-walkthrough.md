# Walkthrough and submission checklist

## Record the local feature

1. Configure `.env` with the team's database. With the app stopped, run
   `npm run db:migrate-bookings` to preserve existing booking data. Only use
   `npm run db:import` for a disposable database whose contents may be reset.
2. Start with `npm run dev`. Open `/trips/booking/1`, select a ticket and day,
   enter fictional passenger data, add a second passenger, and submit.
3. Show the resulting confirmation reference and both passengers. Refresh
   the confirmation URL to demonstrate database persistence.
4. Open `/api/bookings` and show the JSON record. Open `/bookings-admin` and
   use the browser Network panel to show the fetch to `/api/bookings`.
5. Show the dynamically populated cards. Block `/api/bookings` in browser
   developer tools and refresh to show the error state, then unblock it.
   Demonstrate the empty state only against a separate disposable database.
6. Run `npm test` and `npm run lint` and show the results.

## Explain the code

- `src/models/schemas/bookings.js`: embedded passengers, required fields,
  email validation, the 1–8 passenger rule, unique reference, and timestamps.
- `src/models/bookings.js`: creation selects fields, generates the reference,
  and uses Mongoose; list and lookup functions return plain objects.
- `src/models/booking-options.js`: reference-data reads and ticket pricing
  are outside controllers, ready for the team's other feature models.
- `src/controllers/bookings.js`: API success/failure responses, form
  validation, schedule-derived trip ID, redirect, and missing-record handling.
- `src/routes/api-routes.js` and `ejs-routes.js`: separate JSON and page routes;
  show the Swagger response and passenger documentation.
- `src/views/bookings.ejs` and `public/js/bookings.js`: EJS only provides the
  shell; fetch and DOM construction create cards. `textContent` displays user
  input literally rather than interpreting it as markup.
- `src/db/migrate-bookings.js`: rename without overwriting a target collection.

Decision to explain in your own words: generate booking IDs and timestamps on
the server and derive the trip from the schedule. The previous request-body
spread let clients replace server-owned values. Explain how the explicit
field selection and schedule lookup prevent that.

## Finish the team workflow

1. Confirm Feature Set 3 ownership with the team and announce the decision in
   Teams. No message has been sent on your behalf.
2. Feature issue: [#3](https://github.com/Neron56/cse341-team-project/issues/3),
   assigned to `IOneStarI`, contains `docs/w03-bookings-spec.md` as its body.
3. Review the changes on `feat/w03-bookings`, commit, and push that branch.
   Do not push directly to `main`.
4. Use a draft PR to `main` with `docs/w03-bookings-pr.md` as its body,
   which includes `Closes #3`. Add your video URL before marking it ready.
5. Share the PR in Teams and arrange teammate reviews by the start of Week 04.
6. Submit the PR link in Canvas. Download the W03 reflection template from
   the assignment, answer in your own words, and upload the completed file.

Video recording, Teams messages, and Canvas submission remain student tasks.
