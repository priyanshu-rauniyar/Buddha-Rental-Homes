import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const favouriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  },
  { timestamps: true }
);

favouriteSchema.index({ user: 1, room: 1 }, { unique: true });

export type FavouriteDocument = InferSchemaType<typeof favouriteSchema> & { _id: mongoose.Types.ObjectId };

const Favourite: Model<FavouriteDocument> = mongoose.models.Favourite || mongoose.model('Favourite', favouriteSchema);

export default Favourite;
