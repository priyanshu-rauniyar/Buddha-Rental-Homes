import { Request, Response } from 'express';
import z from 'zod';
import Room from '../models/Room.js';
import Favourite from '../models/Favourite.js';
import VisitRequest from '../models/VisitRequest.js';

const roomSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  address: z.string().min(3),
  city: z.string().optional().default(''),
  college: z.string().optional().default(''),
  rent: z.number().min(0),
  deposit: z.number().min(0).optional().default(0),
  roomType: z.enum(['single', 'double', 'studio', 'shared']),
  facilities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  availability: z.enum(['available', 'occupied', 'booked']).optional().default('available'),
});

const roomSearchSchema = z.object({
  location: z.string().trim().max(100).optional(),
  minRent: z.coerce.number().min(0).optional(),
  maxRent: z.coerce.number().min(0).optional(),
  roomType: z.enum(['single', 'double', 'studio', 'shared']).optional(),
  availability: z.enum(['available', 'occupied', 'booked']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
}).refine((query) => query.minRent === undefined || query.maxRent === undefined || query.minRent <= query.maxRent, {
  message: 'minRent cannot be greater than maxRent',
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getRooms(req: Request, res: Response) {
  const parsed = roomSearchSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid room search filters', details: parsed.error.flatten() });
  }
  const { location, minRent, maxRent, roomType, availability, page, limit } = parsed.data;

  const filter: Record<string, any> = {
    isActive: true,
    verificationStatus: 'approved',
  };

  if (location) {
    const pattern = new RegExp(escapeRegex(location), 'i');
    filter.$or = [{ location: pattern }, { city: pattern }];
  }

  if (roomType) filter.roomType = roomType;
  if (availability) filter.availability = availability;
  if (minRent !== undefined || maxRent !== undefined) {
    filter.rent = {};
    if (minRent !== undefined) filter.rent.$gte = minRent;
    if (maxRent !== undefined) filter.rent.$lte = maxRent;
  }

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Room.countDocuments(filter),
  ]);
  return res.json({ rooms, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function getOwnerRooms(req: Request, res: Response) {
  const rooms = await Room.find({ owner: (req as any).user.id }).sort({ createdAt: -1 });
  return res.json({ rooms });
}

export async function getPendingRooms(_req: Request, res: Response) {
  const rooms = await Room.find({ verificationStatus: 'pending', isActive: true })
    .populate('owner', 'name email')
    .sort({ createdAt: 1 });
  return res.json({ rooms });
}

export async function reviewRoom(req: Request, res: Response) {
  const parsed = z.object({ status: z.enum(['approved', 'rejected']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }

  const room = await Room.findOneAndUpdate(
    { _id: req.params.id, verificationStatus: 'pending', isActive: true },
    { verificationStatus: parsed.data.status },
    { new: true, runValidators: true }
  );
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  return res.json({ message: `Room ${parsed.data.status}`, room });
}

export async function getRoomById(req: Request, res: Response) {
  const room = await Room.findOne({
    _id: req.params.id,
    isActive: true,
    verificationStatus: 'approved',
  }).populate('owner', 'name email role');
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  return res.json({ room });
}

export async function createRoom(req: Request, res: Response) {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid room input', details: parsed.error.flatten() });
  }

  const user = (req as any).user;
  const room = await Room.create({
    ...parsed.data,
    owner: user.id,
    verificationStatus: 'pending',
  });

  return res.status(201).json({ message: 'Room submitted for approval', room });
}

export async function updateRoom(req: Request, res: Response) {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (room.owner.toString() !== (req as any).user.id) {
    return res.status(403).json({ message: 'You can only edit your own rooms' });
  }

  const parsed = roomSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid room update', details: parsed.error.flatten() });
  }

  const changedListingDetails = Object.keys(parsed.data).some((key) => key !== 'availability');
  const requiresReview = changedListingDetails && room.verificationStatus !== 'pending';
  Object.assign(room, parsed.data);
  if (requiresReview) {
    room.verificationStatus = 'pending';
  }
  await room.save();
  return res.json({
    message: requiresReview ? 'Listing updated and sent for admin review' : 'Room updated successfully',
    room,
  });
}

export async function updateRoomAvailability(req: Request, res: Response) {
  const parsed = z.object({ availability: z.enum(['available', 'occupied', 'booked']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Availability must be available, occupied, or booked' });
  }

  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (room.owner.toString() !== (req as any).user.id) {
    return res.status(403).json({ message: 'You can only update your own rooms' });
  }

  room.availability = parsed.data.availability;
  await room.save();
  return res.json({ message: 'Availability updated', room });
}

export async function deleteRoom(req: Request, res: Response) {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  if (room.owner.toString() !== (req as any).user.id) {
    return res.status(403).json({ message: 'You can only delete your own rooms' });
  }

  room.isActive = false;
  await room.save();
  return res.json({ message: 'Room deactivated successfully' });
}

export async function toggleFavourite(req: Request, res: Response) {
  const roomId = req.params.id;
  const userId = (req as any).user.id;

  const existing = await Favourite.findOne({ user: userId, room: roomId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ message: 'Favourite removed' });
  }

  const room = await Room.findOne({
    _id: roomId,
    isActive: true,
    verificationStatus: 'approved',
  }).select('_id');
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  await Favourite.create({ user: userId, room: roomId });
  return res.status(201).json({ message: 'Favourite added' });
}

export async function getFavourites(req: Request, res: Response) {
  const favourites = await Favourite.find({ user: (req as any).user.id }).populate({
    path: 'room',
    match: { isActive: true, verificationStatus: 'approved' },
  });
  return res.json({ favourites: favourites.filter((favourite) => favourite.room) });
}

export async function createVisitRequest(req: Request, res: Response) {
  const room = await Room.findById(req.params.id);
  if (!room || !room.isActive || room.verificationStatus !== 'approved') {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (room.availability !== 'available') {
    return res.status(409).json({ message: 'This room is not currently available' });
  }

  const alreadyRequested = await VisitRequest.findOne({
    user: (req as any).user.id,
    room: room._id,
    status: { $in: ['pending', 'accepted'] },
  });
  if (alreadyRequested) {
    return res.status(409).json({ message: 'You already requested a visit for this room' });
  }

  const request = await VisitRequest.create({
    user: (req as any).user.id,
    owner: room.owner,
    room: room._id,
    status: 'pending',
    note: req.body.note || '',
  });

  return res.status(201).json({ message: 'Visit request submitted', request });
}

export async function getVisitRequests(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const requests = await VisitRequest.find({
    $or: [{ user: userId }, { owner: userId }],
  })
    .populate('room')
    .populate('user', 'name email')
    .populate('owner', 'name email');

  return res.json({ requests });
}

export async function updateVisitRequest(req: Request, res: Response) {
  const parsed = z.object({ status: z.enum(['accepted', 'rejected', 'cancelled']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Status must be accepted, rejected, or cancelled' });
  }

  const request = await VisitRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Visit request not found' });
  }

  const userId = (req as any).user.id;
  const isOwner = request.owner.toString() === userId;
  const isStudent = request.user.toString() === userId;
  if (!isOwner && !isStudent) {
    return res.status(403).json({ message: 'Not allowed to manage this request' });
  }

  if (request.status !== 'pending') {
    return res.status(409).json({ message: 'This visit request has already been resolved' });
  }

  if ((isOwner && parsed.data.status === 'cancelled') || (isStudent && parsed.data.status !== 'cancelled')) {
    return res.status(403).json({ message: 'You cannot choose that visit request status' });
  }

  request.status = parsed.data.status;
  await request.save();
  return res.json({ message: 'Visit request updated', request });
}
