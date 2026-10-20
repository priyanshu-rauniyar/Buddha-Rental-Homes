import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const visitRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export type VisitRequestDocument = InferSchemaType<typeof visitRequestSchema> & { _id: mongoose.Types.ObjectId };

const VisitRequest: Model<VisitRequestDocument> = mongoose.models.VisitRequest || mongoose.model('VisitRequest', visitRequestSchema);

export default VisitRequest;
