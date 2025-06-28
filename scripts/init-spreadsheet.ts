import { googleSheetsService, SHEET_NAMES } from "../configs/googleSheets";

async function initializeSpreadsheet() {
  try {
    console.log("🚀 Initializing Google Sheets for Better Planner...");

    // Initialize headers for all sheets
    await googleSheetsService.initializeSpreadsheet();

    // Add sample data for testing
    await addSampleData();

    console.log("✅ Spreadsheet initialization completed!");
  } catch (error) {
    console.error("❌ Error initializing spreadsheet:", error);
  }
}

async function addSampleData() {
  try {
    console.log("📝 Adding sample data...");

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
      await googleSheetsService.create(SHEET_NAMES.PERIODS, period);
    }

    // Add sample client
    const client = await googleSheetsService.create(SHEET_NAMES.CLIENTS, {
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
      await googleSheetsService.create(SHEET_NAMES.VISION_CATEGORIES, category);
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
      await googleSheetsService.create(SHEET_NAMES.HIGH_FOCUS_GOALS, goal);
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
      await googleSheetsService.create(SHEET_NAMES.TASKS, task);
    }

    console.log("✅ Sample data added successfully!");
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  }
}

// Run the initialization
initializeSpreadsheet();
