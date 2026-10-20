import { Router } from 'express';
import { createRoom, createVisitRequest, deleteRoom, getFavourites, getOwnerRooms, getPendingRooms, getRoomById, getRooms, getVisitRequests, reviewRoom, toggleFavourite, updateRoom, updateRoomAvailability, updateVisitRequest } from '../controllers/roomController.js';
import { createRoomReview, deleteReview, getRoomReviews } from '../controllers/reviewController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.get('/rooms', protect, asyncHandler(getRooms));
router.get('/rooms/:roomId/reviews', protect, asyncHandler(getRoomReviews));
router.post('/rooms/:roomId/reviews', protect, authorize('student'), asyncHandler(createRoomReview));
router.delete('/rooms/:roomId/reviews/:reviewId', protect, asyncHandler(deleteReview));
router.get('/owner/rooms', protect, authorize('owner'), asyncHandler(getOwnerRooms));
router.get('/admin/rooms/pending', protect, authorize('admin'), asyncHandler(getPendingRooms));
router.patch('/admin/rooms/:id/review', protect, authorize('admin'), asyncHandler(reviewRoom));
router.get('/rooms/:id', protect, asyncHandler(getRoomById));
router.post('/rooms', protect, authorize('owner'), asyncHandler(createRoom));
router.patch('/rooms/:id/availability', protect, authorize('owner'), asyncHandler(updateRoomAvailability));
router.patch('/rooms/:id', protect, authorize('owner'), asyncHandler(updateRoom));
router.delete('/rooms/:id', protect, authorize('owner'), asyncHandler(deleteRoom));

router.get('/favourites', protect, asyncHandler(getFavourites));
router.post('/favourites/:id', protect, asyncHandler(toggleFavourite));

router.get('/visit-requests', protect, asyncHandler(getVisitRequests));
router.post('/visit-requests/:id', protect, authorize('student'), asyncHandler(createVisitRequest));
router.patch('/visit-requests/:id', protect, asyncHandler(updateVisitRequest));

export default router;
