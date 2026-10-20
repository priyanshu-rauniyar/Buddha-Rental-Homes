import type { Request, Response } from 'express';
import z from 'zod';
import Review from '../models/Review.js';
import Room from '../models/Room.js';
import VisitRequest from '../models/VisitRequest.js';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});

export async function getRoomReviews(req: Request, res: Response) {
  const room = await Room.findOne({
    _id: req.params.roomId,
    isActive: true,
    verificationStatus: 'approved',
  }).select('_id');
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  const reviews = await Review.find({ room: room._id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;

  return res.json({ reviews, averageRating, reviewCount: reviews.length });
}

export async function createRoomReview(req: Request, res: Response) {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Rating must be 1-5 and comment must be 5-1000 characters' });
  }

  const user = (req as any).user;
  const room = await Room.findOne({
    _id: req.params.roomId,
    isActive: true,
    verificationStatus: 'approved',
  }).select('_id');
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  const completedVisit = await VisitRequest.exists({
    room: room._id,
    user: user.id,
    status: 'accepted',
  });
  if (!completedVisit) {
    return res.status(403).json({ message: 'An accepted visit request is required before reviewing this room' });
  }

  const review = await Review.create({
    user: user.id,
    room: room._id,
    ...parsed.data,
  });
  await review.populate('user', 'name');
  return res.status(201).json({ message: 'Review submitted', review });
}

export async function deleteReview(req: Request, res: Response) {
  const review = await Review.findOne({
    _id: req.params.reviewId,
    room: req.params.roomId,
  });
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  const user = (req as any).user;
  if (review.user.toString() !== user.id && user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own review' });
  }

  await review.deleteOne();
  return res.json({ message: 'Review deleted' });
}
