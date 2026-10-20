# API Documentation

All room, review-read, dashboard, favourite, and visit routes require `Authorization: Bearer <token>`. Only the health check, registration, and login endpoints are public.

## Health check

`GET /api/health`

## Auth

- `POST /api/auth/register` — create a student or owner account.
- `POST /api/auth/login` — return a JWT and user profile.
- `GET /api/auth/me` — return the current authenticated profile.

## Rooms

- `GET /api/rooms` — authenticated approved, active listings. Optional query parameters: `location`, `minRent`, `maxRent`, `roomType`, `availability`, `page`, `limit` (maximum 50).
- `GET /api/rooms/:id` — authenticated detail for an approved, active listing.
- `GET /api/rooms/:roomId/reviews` — authenticated review list and average rating for an approved listing.
- `POST /api/rooms/:roomId/reviews` — student with an accepted visit submits a 1-5 rating and 5-1000 character comment.
- `DELETE /api/rooms/:roomId/reviews/:reviewId` — review author or admin deletes a review.
- `POST /api/rooms` — owner submits a listing for admin approval.
- `PATCH /api/rooms/:id` — owner updates their own listing.
- `PATCH /api/rooms/:id/availability` — owner changes availability without changing approval status.
- `DELETE /api/rooms/:id` — owner deactivates their own listing.
- `GET /api/owner/rooms` — owner’s own listings and review statuses.
- `GET /api/admin/rooms/pending` — admin review queue.
- `PATCH /api/admin/rooms/:id/review` — admin sets `{ "status": "approved" }` or `{ "status": "rejected" }`.

## Favourites

- `GET /api/favourites` — current user’s saved listings.
- `POST /api/favourites/:id` — toggle a listing in the current user’s favourites.

## Visit requests

- `GET /api/visit-requests` — requests where the current user is the student or owner.
- `POST /api/visit-requests/:id` — student requests a visit for an available listing.
- `PATCH /api/visit-requests/:id` — owner accepts/rejects a pending request; student may cancel a pending request.
