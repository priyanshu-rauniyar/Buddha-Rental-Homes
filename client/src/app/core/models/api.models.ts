export type UserRole = 'student' | 'owner' | 'admin';
export type RoomType = 'single' | 'double' | 'studio' | 'shared';
export type RoomAvailability = 'available' | 'occupied' | 'booked';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type VisitStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RoomOwner {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  role?: UserRole;
}

export interface Room {
  _id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  city: string;
  college: string;
  rent: number;
  deposit: number;
  roomType: RoomType;
  facilities: string[];
  rules: string[];
  imageUrls: string[];
  availability: RoomAvailability;
  verificationStatus: ReviewStatus;
  isActive: boolean;
  owner?: RoomOwner | string;
  createdAt?: string;
}

export interface VisitRequest {
  _id: string;
  status: VisitStatus;
  note?: string;
  room?: Pick<Room, '_id' | 'title' | 'location' | 'rent'> | string;
  user?: Pick<User, '_id' | 'id' | 'name' | 'email'> | string;
  owner?: Pick<User, '_id' | 'id' | 'name' | 'email'> | string;
  createdAt?: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: Pick<User, '_id' | 'id' | 'name'> | string;
}

export interface RoomSearch {
  location?: string;
  minRent?: number | null;
  maxRent?: number | null;
  roomType?: RoomType | 'all';
  availability?: RoomAvailability;
  page?: number;
  limit?: number;
}

export type RoomInput = Pick<Room,
  'title' | 'description' | 'location' | 'address' | 'city' | 'college' |
  'rent' | 'deposit' | 'roomType' | 'facilities' | 'rules' | 'imageUrls'
> & { availability?: RoomAvailability };

export interface PageResponse<T> {
  rooms: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiMessage {
  message: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ReviewListResponse {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}
