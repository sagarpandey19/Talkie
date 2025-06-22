import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Current directory:", __dirname);

// Check if .env file exists
const envPath = join(__dirname, '.env');
console.log(".env path:", envPath);
console.log(".env file exists:", fs.existsSync(envPath));

// Try to read .env file content
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(".env file content:", envContent);
} catch (error) {
  console.error("Error reading .env file:", error.message);
}

// Load .env file
dotenv.config();

// Check environment variables
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("STREAM_API_KEY:", process.env.STREAM_API_KEY);
console.log("STREAM_API_SECRET:", process.env.STREAM_API_SECRET); 