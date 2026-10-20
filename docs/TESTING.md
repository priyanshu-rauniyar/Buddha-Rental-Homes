# Manual Test Flow

## Start the application

1. Start MongoDB Community Server.
2. Install dependencies in `server/` and `client/` using the commands in the project README.
3. Start the API with `npm.cmd run dev` from `server/`.
4. Seed demo data with `npm.cmd run seed` from another terminal in `server/`.
5. Start Angular with `npm.cmd start` from `client/` and open http://localhost:4200.
6. Check http://localhost:5000/api/health returns `{ "status": "ok" }`.

## Student flow

Sign in with `student@buddharental.com` / `Student@123`.

1. Search rooms by location, rent ceiling, and room type; test next/previous when multiple pages exist.
2. Save a listing, confirm it appears under Saved rooms, then unsave it.
3. Open a room and request a visit.
4. Sign in as the owner in a separate browser session and accept the pending request.
5. Sign back in as the student. The accepted request should appear in Visit requests and the room review form should be enabled.
6. Submit a rating and comment; confirm it appears in the room details and updates the average.
7. Cancel a different pending request and confirm its status changes to Cancelled.

## Owner flow

Sign in with `owner@buddharental.com` / `Owner@123`.

1. Submit a room listing. It should appear in Submitted listings with Pending status and stay hidden from public search.
2. Sign in as admin and approve the listing.
3. Sign back in as owner. Change availability and confirm the public search reflects the new status.
4. Edit a listing detail. It should return to Pending until admin approves it again.
5. Deactivate a listing and confirm it is removed from public search.
6. Accept or decline a student's visit request. Confirm a declined request allows the student to request another visit.

## Admin flow

Sign in with `admin@buddharental.com` / `Admin@123`.

1. Review a pending room and approve it; confirm it appears in public search.
2. Reject another pending room; confirm it remains unavailable publicly.
3. Confirm admin can delete a review.

## API authorization checks

- With no saved session, opening `/` or `/rooms/:id` redirects to `/login` and preserves the requested destination.
- After successful sign-in, the user returns to the preserved destination; sign out clears the session and opens `/login`.
- `GET /api/rooms` without a token should return `401`.
- `POST /api/rooms` without a token should return `401`.
- A student token posting to `POST /api/rooms` should return `403`.
- A student may not accept or reject a visit request; the API should return `403`.
- A student cannot review a room without an accepted visit; the API should return `403`.
- Search with `minRent` greater than `maxRent` should return `400`.
