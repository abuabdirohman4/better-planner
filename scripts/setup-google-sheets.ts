import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { googleSheetsService } from "../configs/googleSheets";
import fs from "fs";

async function setupGoogleSheets() {
  console.log("🚀 Setting up Google Sheets for Better Planner...\n");

  // Check if credentials file exists
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json";
  if (!fs.existsSync(credentialsPath)) {
    console.error("❌ Google credentials file not found!");
    console.error(`Expected location: ${path.resolve(credentialsPath)}`);
    console.error("\n📋 Please follow these steps:");
    console.error(
      "1. Go to Google Cloud Console: https://console.cloud.google.com/"
    );
    console.error("2. Create a new project or select existing one");
    console.error("3. Enable Google Sheets API");
    console.error("4. Create a Service Account");
    console.error("5. Download the JSON key file");
    console.error('6. Rename it to "google-credentials.json"');
    console.error("7. Place it in your project root directory");
    console.error("\n📖 See GOOGLE_SHEETS_SETUP.md for detailed instructions");
    process.exit(1);
  }

  console.log("✅ Google credentials file found");

  // Check if spreadsheet ID is set
  let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  console.log("🔍 Current GOOGLE_SPREADSHEET_ID:", spreadsheetId);

  if (!spreadsheetId) {
    console.log("\n📝 No spreadsheet ID found. Creating new spreadsheet...");

    try {
      const newSpreadsheetId =
        await googleSheetsService.createSpreadsheetIfNotExists();
      spreadsheetId = newSpreadsheetId;

      console.log(`✅ Created new spreadsheet with ID: ${spreadsheetId}`);
      console.log("\n📋 Please update your .env.local file with:");
      console.log(`GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);

      // Continue with the new spreadsheet ID
      console.log("\n🔄 Continuing setup with new spreadsheet...");
    } catch (error) {
      console.error("❌ Failed to create spreadsheet:", error);
      process.exit(1);
    }
  } else {
    console.log("✅ Spreadsheet ID found");
  }

  // Validate spreadsheet access
  try {
    console.log("\n🔍 Validating spreadsheet access...");
    await googleSheetsService.validateSpreadsheet();
    console.log("✅ Spreadsheet access validated");
  } catch (error: any) {
    console.error("❌ Spreadsheet validation failed:", error.message);
    console.error("\n📋 Please check:");
    console.error("1. Spreadsheet ID is correct");
    console.error("2. Service account has access to the spreadsheet");
    console.error("3. Google Sheets API is enabled");
    process.exit(1);
  }

  // Initialize spreadsheet
  try {
    console.log("\n📝 Initializing spreadsheet with headers...");
    await googleSheetsService.initializeSpreadsheet();
    console.log("✅ Spreadsheet headers initialized");
  } catch (error) {
    console.error("❌ Failed to initialize spreadsheet:", error);
    process.exit(1);
  }

  // Add sample data
  try {
    console.log("\n📝 Adding sample data...");
    await addSampleData();
    console.log("✅ Sample data added successfully");
  } catch (error) {
    console.error("❌ Failed to add sample data:", error);
    process.exit(1);
  }

  console.log("\n🎉 Google Sheets setup completed successfully!");
  console.log("\n📋 You can now:");
  console.log('1. Run "npm run dev" to start the application');
  console.log("2. View your data in Google Sheets");
  console.log("3. Start using Better Planner with Google Sheets as database");

  if (!process.env.GOOGLE_SPREADSHEET_ID) {
    console.log(
      "\n⚠️  IMPORTANT: Don't forget to update your .env.local file with:"
    );
    console.log(`GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);
  }
}

async function addSampleData() {
  try {
    // Add sample periods
    const periods = [
      {
        name: "Q1-2024",
        year: 2024,
        quarter: 1,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-03-31T23:59:59.999Z",
      },
      {
        name: "Q2-2024",
        year: 2024,
        quarter: 2,
        startDate: "2024-04-01T00:00:00.000Z",
        endDate: "2024-06-30T23:59:59.999Z",
      },
      {
        name: "Q3-2024",
        year: 2024,
        quarter: 3,
        startDate: "2024-07-01T00:00:00.000Z",
        endDate: "2024-09-30T23:59:59.999Z",
      },
      {
        name: "Q4-2024",
        year: 2024,
        quarter: 4,
        startDate: "2024-10-01T00:00:00.000Z",
        endDate: "2024-12-31T23:59:59.999Z",
      },
    ];

    for (const period of periods) {
      await googleSheetsService.create("Periods", period);
    }

    // Add sample client
    const client = await googleSheetsService.create("Clients", {
      email: "user@example.com",
      name: "Sample User",
      periodName: "Q1-2024",
    });

    // Add sample vision categories
    const visionCategories = [
      { name: "Career" },
      { name: "Health" },
      { name: "Relationships" },
      { name: "Personal Development" },
      { name: "Finance" },
    ];

    for (const category of visionCategories) {
      await googleSheetsService.create("VisionCategories", category);
    }

    // Add sample high focus goals
    const highFocusGoals = [
      {
        clientId: client.id,
        name: "Improve Technical Skills",
        motivation:
          "To advance in my career and take on more challenging projects",
      },
      {
        clientId: client.id,
        name: "Build Healthy Habits",
        motivation: "To improve overall well-being and energy levels",
      },
    ];

    for (const goal of highFocusGoals) {
      await googleSheetsService.create("HighFocusGoals", goal);
    }

    // Add sample tasks
    const tasks = [
      {
        clientId: client.id,
        name: "Learn React Advanced Patterns",
        indent: 0,
        order: 1,
        completed: false,
        highFocusGoalId: 1,
      },
      {
        clientId: client.id,
        name: "Complete Online Course",
        indent: 1,
        order: 2,
        completed: false,
        highFocusGoalId: 1,
      },
      {
        clientId: client.id,
        name: "Exercise 3 times per week",
        indent: 0,
        order: 1,
        completed: false,
        highFocusGoalId: 2,
      },
    ];

    for (const task of tasks) {
      await googleSheetsService.create("Tasks", task);
    }

    console.log("✅ Sample data added successfully!");
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
    throw error;
  }
}

// Run the setup
setupGoogleSheets().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
