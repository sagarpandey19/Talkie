import jwt from "jsonwebtoken";
import User from "../models/User.js";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config();

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    console.log("JWT Secret:", process.env.JWT_SECRET);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    // Use JWT_SECRET from environment variable with fallback
    const secret = process.env.JWT_SECRET || "f0e355240e83fc74b87dc019b9969b95a8429d7eed3c82012044b73643b62cb7";
    
    const decoded = jwt.verify(token, secret);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    console.log("Error details:", error.message);
    console.log("Error name:", error.name);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token: " + error.message });
    }
    
    res.status(500).json({ message: "Internal Server Error: " + error.message });
  }
};
