import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("🔍 Environment Variables Debug:");
console.log("Current working directory:", process.cwd());
console.log("GOOGLE_SPREADSHEET_ID:", process.env.GOOGLE_SPREADSHEET_ID);
console.log(
  "GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Check if .env.local exists
import fs from "fs";
const envLocalPath = path.resolve(process.cwd(), ".env.local");
console.log("\n📁 File check:");
console.log(".env.local exists:", fs.existsSync(envLocalPath));
console.log(".env.local path:", envLocalPath);

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  console.log("\n📄 .env.local content:");
  console.log(content);
}
