import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Coupon from '../models/Coupon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sampleCoupons = [
  {
    code: "WELCOME10",
    discount: 10,
    discountType: "percentage",
    expiry: new Date("2028-12-31"),
    minimumOrder: 500,
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    description: "10% OFF on orders above ₹500"
  },
  {
    code: "SAVE20",
    discount: 20,
    discountType: "percentage",
    expiry: new Date("2028-12-31"),
    minimumOrder: 1000,
    usageLimit: 50,
    usedCount: 0,
    isActive: true,
    description: "20% OFF on orders above ₹1000"
  },
  {
    code: "FLAT500",
    discount: 500,
    discountType: "fixed",
    expiry: new Date("2028-12-31"),
    minimumOrder: 2000,
    usageLimit: 50,
    usedCount: 0,
    isActive: true,
    description: "Flat ₹500 OFF on orders above ₹2000"
  },
  {
    code: "EXPIRED50",
    discount: 50,
    discountType: "percentage",
    expiry: new Date("2024-01-01"),
    minimumOrder: 0,
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    description: "50% OFF (Expired Test Coupon)"
  },
  {
    code: "MAXEDOUT",
    discount: 30,
    discountType: "percentage",
    expiry: new Date("2028-12-31"),
    minimumOrder: 0,
    usageLimit: 5,
    usedCount: 5,
    isActive: true,
    description: "30% OFF (Max Usage Reached Test Coupon)"
  }
];

const seedCoupons = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding coupons");

    await Coupon.deleteMany();
    console.log("Existing coupons cleared");

    await Coupon.insertMany(sampleCoupons);
    console.log(`Successfully seeded ${sampleCoupons.length} coupons!`);
  } catch (err) {
    console.error("Error seeding coupons:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

seedCoupons();
