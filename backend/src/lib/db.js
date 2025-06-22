import mongoose from "mongoose";
import * as dotenv from 'dotenv';

// Load .env file from the backend directory
dotenv.config();

export const connectDB = async () => {
  try {
    // Use environment variable with fallback
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sagarpandeyin:6372723182@video-chat.yz9bocz.mongodb.net/Streamify_db";
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error in connecting to MongoDB", error);
    process.exit(1); // 1 means failure
  }
};
