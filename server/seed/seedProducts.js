import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import products from './productsData.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products to avoid duplicates
    await Product.deleteMany();
    console.log('Existing products cleared');

    // Insert seed data
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} products`);

    const count = await Product.countDocuments();
    console.log('Total products in DB:', count);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
  }
};

seed();
