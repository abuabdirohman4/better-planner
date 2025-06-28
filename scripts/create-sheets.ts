import dotenv from "dotenv";
import path from "path";
import { google } from "googleapis";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const auth = new google.auth.GoogleAuth({
  keyFile:
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

async function createSheets() {
  console.log("📝 Creating sheets in Google Spreadsheet...\n");

  if (!SPREADSHEET_ID) {
    console.error("❌ GOOGLE_SPREADSHEET_ID not found in .env.local");
    process.exit(1);
  }

  const requiredSheets = [
    "Clients",
    "Periods",
    "VisionCategories",
    "Visions",
    "HighFocusGoals",
    "StatusHighFocusGoal",
    "SelfDevelopmentCurriculum",
    "Knowledge",
    "Tasks",
    "TimeLogs",
    "ToDontList",
    "BrainDump",
    "Days",
    "Weeks",
    "TaskWeeks",
    "TaskDays",
  ];

  try {
    // Get existing sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets =
      response.data.sheets?.map((sheet) => sheet.properties?.title) || [];
    console.log("📋 Existing sheets:", existingSheets);

    // Find missing sheets
    const missingSheets = requiredSheets.filter(
      (sheetName) => !existingSheets.includes(sheetName)
    );

    if (missingSheets.length === 0) {
      console.log("✅ All required sheets already exist!");
      return;
    }

    console.log("📝 Missing sheets:", missingSheets);

    // Create missing sheets
    const requests = missingSheets.map((sheetName) => ({
      addSheet: {
        properties: {
          title: sheetName,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    console.log("✅ Successfully created sheets:", missingSheets);
    console.log("\n🎉 All required sheets are now available!");
  } catch (error: any) {
    console.error("❌ Error creating sheets:", error.message);
    if (error.response?.data?.error) {
      console.error("Details:", error.response.data.error);
    }
    process.exit(1);
  }
}

// Run the script
createSheets().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
