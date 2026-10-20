import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const roomSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    college: { type: String, default: '' },
    rent: { type: Number, required: true, min: 0 },
    deposit: { type: Number, default: 0 },
    roomType: { type: String, enum: ['single', 'double', 'studio', 'shared'], required: true },
    facilities: [{ type: String }],
    rules: [{ type: String }],
    imageUrls: [{ type: String }],
    availability: { type: String, enum: ['available', 'occupied', 'booked'], default: 'available' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isActive: { type: Boolean, default: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type RoomDocument = InferSchemaType<typeof roomSchema> & { _id: mongoose.Types.ObjectId };

const Room: Model<RoomDocument> = mongoose.models.Room || mongoose.model('Room', roomSchema);

export default Room;
