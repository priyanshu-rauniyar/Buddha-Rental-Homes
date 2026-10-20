import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/database.js';
import User from './models/User.js';
import Room from './models/Room.js';

async function seed() {
  await connectDatabase();

  const adminExists = await User.findOne({ email: 'admin@buddharental.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin User',
      email: 'admin@buddharental.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'admin',
      isVerified: true,
    });
  }

  let owner = await User.findOne({ email: 'owner@buddharental.com' });
  if (!owner) {
    owner = await User.create({
      name: 'Owner One',
      email: 'owner@buddharental.com',
      password: await bcrypt.hash('Owner@123', 10),
      role: 'owner',
      isVerified: true,
    });
  }

  const sampleRoomExists = await Room.exists({ owner: owner._id, title: 'Sunrise Girls PG' });
  if (!sampleRoomExists) {
    await Room.create({
      owner: owner._id,
      title: 'Sunrise Girls PG',
      description: 'Clean and secure student accommodation near the city college campus with Wi-Fi and meals.',
      location: 'Nashik',
      address: 'Near College Road, Nashik',
      city: 'Nashik',
      college: 'MVP Campus',
      rent: 6500,
      deposit: 12000,
      roomType: 'double',
      facilities: ['Wi-Fi', 'Meals', 'Laundry', 'Security'],
      rules: ['No smoking', 'Curfew 10 PM'],
      imageUrls: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
      availability: 'available',
      verificationStatus: 'approved',
      isActive: true,
    });
  }

  const studentExists = await User.findOne({ email: 'student@buddharental.com' });
  if (!studentExists) {
    await User.create({
      name: 'Student One',
      email: 'student@buddharental.com',
      password: await bcrypt.hash('Student@123', 10),
      role: 'student',
      isVerified: true,
    });
  }

  console.log('Seed data ready.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
