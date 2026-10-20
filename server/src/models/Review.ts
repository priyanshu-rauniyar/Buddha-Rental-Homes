import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

reviewSchema.index({ room: 1, user: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof reviewSchema> & { _id: mongoose.Types.ObjectId };

const Review: Model<ReviewDocument> = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
