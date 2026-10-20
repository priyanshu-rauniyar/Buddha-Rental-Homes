import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${env.mongoUri}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}
