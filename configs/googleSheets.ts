import { google } from "googleapis";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Google Sheets API configuration
const auth = new google.auth.GoogleAuth({
  keyFile:
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Spreadsheet ID - you'll need to create this spreadsheet
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

// Validate SPREADSHEET_ID
if (!SPREADSHEET_ID) {
  console.error(
    "❌ GOOGLE_SPREADSHEET_ID is not set in environment variables!"
  );
  console.error("Please set GOOGLE_SPREADSHEET_ID in your .env.local file");
  console.error(
    "Example: GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  );
}

// Sheet names mapping to your database tables
export const SHEET_NAMES = {
  CLIENTS: "Clients",
  PERIODS: "Periods",
  VISION_CATEGORIES: "VisionCategories",
  VISIONS: "Visions",
  HIGH_FOCUS_GOALS: "HighFocusGoals",
  STATUS_HIGH_FOCUS_GOALS: "StatusHighFocusGoals",
  SELF_DEVELOPMENT_CURRICULUM: "SelfDevelopmentCurriculum",
  KNOWLEDGE: "Knowledge",
  TASKS: "Tasks",
  TIME_LOGS: "TimeLogs",
  TO_DONT_LIST: "ToDontList",
  BRAIN_DUMP: "BrainDump",
  DAYS: "Days",
  WEEKS: "Weeks",
  TASK_WEEKS: "TaskWeeks",
  TASK_DAYS: "TaskDays",
} as const;

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private sheets: any;

  private constructor() {
    this.sheets = sheets;
  }

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  // Validate spreadsheet access
  async validateSpreadsheet(): Promise<boolean> {
    if (!SPREADSHEET_ID) {
      throw new Error(
        "SPREADSHEET_ID is not configured. Please set GOOGLE_SPREADSHEET_ID in your environment variables."
      );
    }

    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Spreadsheet with ID "${SPREADSHEET_ID}" not found. Please check your spreadsheet ID and ensure the service account has access.`
        );
      }
      throw new Error(`Failed to access spreadsheet: ${error.message}`);
    }
  }

  // Create spreadsheet if it doesn't exist
  async createSpreadsheetIfNotExists(): Promise<string> {
    if (!SPREADSHEET_ID) {
      console.log("📝 Creating new Google Spreadsheet...");

      const spreadsheet = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: "Better Planner Database",
          },
          sheets: Object.values(SHEET_NAMES).map((sheetName) => ({
            properties: {
              title: sheetName,
            },
          })),
        },
      });

      const newSpreadsheetId = spreadsheet.data.spreadsheetId;
      console.log(`✅ Created new spreadsheet with ID: ${newSpreadsheetId}`);
      console.log(
        `📋 Please update your .env.local file with: GOOGLE_SPREADSHEET_ID=${newSpreadsheetId}`
      );

      return newSpreadsheetId;
    }

    return SPREADSHEET_ID;
  }

  // Generic methods for CRUD operations
  async getAll(sheetName: string): Promise<any[]> {
    try {
      await this.validateSpreadsheet();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Convert rows to objects using first row as headers
      const headers = rows[0];
      const data = rows.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || null;
        });
        return obj;
      });

      return data;
    } catch (error) {
      console.error(`Error fetching data from ${sheetName}:`, error);
      throw error;
    }
  }

  async getById(sheetName: string, id: number): Promise<any | null> {
    try {
      const allData = await this.getAll(sheetName);
      return allData.find((item: any) => parseInt(item.id) === id) || null;
    } catch (error) {
      console.error(`Error fetching item by ID from ${sheetName}:`, error);
      throw error;
    }
  }

  async create(sheetName: string, data: any): Promise<any> {
    try {
      // Get existing data to determine new ID
      const existingData = await this.getAll(sheetName);
      const newId =
        existingData.length > 0
          ? Math.max(
              ...existingData.map((item: any) => parseInt(item.id) || 0)
            ) + 1
          : 1;

      const newRow = {
        id: newId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert object to array based on headers
      const headers = await this.getHeaders(sheetName);
      const rowArray = headers.map((header: string) => newRow[header] || "");

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [rowArray],
        },
      });

      return newRow;
    } catch (error) {
      console.error(`Error creating item in ${sheetName}:`, error);
      throw error;
    }
  }

  async update(sheetName: string, id: number, data: any): Promise<any> {
    try {
      const allData = await this.getAll(sheetName);
      const rowIndex = allData.findIndex(
        (item: any) => parseInt(item.id) === id
      );

      if (rowIndex === -1) {
        throw new Error(`Item with ID ${id} not found in ${sheetName}`);
      }

      const updatedRow = {
        ...allData[rowIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const headers = await this.getHeaders(sheetName);
      const rowArray = headers.map(
        (header: string) => updatedRow[header] || ""
      );

      // Update the specific row (add 2 because sheets are 1-indexed and we have headers)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${rowIndex + 2}:Z${rowIndex + 2}`,
        valueInputOption: "RAW",
        resource: {
          values: [rowArray],
        },
      });

      return updatedRow;
    } catch (error) {
      console.error(`Error updating item in ${sheetName}:`, error);
      throw error;
    }
  }

  async delete(sheetName: string, id: number): Promise<void> {
    try {
      const allData = await this.getAll(sheetName);
      const rowIndex = allData.findIndex(
        (item: any) => parseInt(item.id) === id
      );

      if (rowIndex === -1) {
        throw new Error(`Item with ID ${id} not found in ${sheetName}`);
      }

      // Delete the specific row (add 2 because sheets are 1-indexed and we have headers)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await this.getSheetId(sheetName),
                  dimension: "ROWS",
                  startIndex: rowIndex + 1,
                  endIndex: rowIndex + 2,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error(`Error deleting item from ${sheetName}:`, error);
      throw error;
    }
  }

  async getHeaders(sheetName: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z1`,
      });

      return response.data.values?.[0] || [];
    } catch (error) {
      console.error(`Error fetching headers from ${sheetName}:`, error);
      throw error;
    }
  }

  async getSheetId(sheetName: string): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      const sheet = response.data.sheets?.find(
        (s: any) => s.properties?.title === sheetName
      );

      return sheet?.properties?.sheetId || 0;
    } catch (error) {
      console.error(`Error getting sheet ID for ${sheetName}:`, error);
      throw error;
    }
  }

  // Helper method to initialize spreadsheet with headers
  async initializeSpreadsheet(): Promise<void> {
    try {
      await this.validateSpreadsheet();

      const headers = {
        [SHEET_NAMES.CLIENTS]: ["id", "email", "name", "periodName"],
        [SHEET_NAMES.PERIODS]: [
          "id",
          "name",
          "year",
          "quarter",
          "startDate",
          "endDate",
        ],
        [SHEET_NAMES.VISION_CATEGORIES]: ["id", "name"],
        [SHEET_NAMES.VISIONS]: [
          "id",
          "clientId",
          "name",
          "category",
          "startDate",
          "endDate",
        ],
        [SHEET_NAMES.HIGH_FOCUS_GOALS]: [
          "id",
          "clientId",
          "name",
          "motivation",
        ],
        [SHEET_NAMES.STATUS_HIGH_FOCUS_GOALS]: [
          "id",
          "highFocusGoalId",
          "periodName",
          "order",
          "point",
          "priority",
          "completed",
        ],
        [SHEET_NAMES.SELF_DEVELOPMENT_CURRICULUM]: [
          "id",
          "clientId",
          "skill",
          "order",
          "completed",
          "highFocusGoalId",
        ],
        [SHEET_NAMES.KNOWLEDGE]: [
          "id",
          "name",
          "type",
          "SelfDevelopmentCurriculumId",
        ],
        [SHEET_NAMES.TASKS]: [
          "id",
          "clientId",
          "name",
          "indent",
          "order",
          "completed",
          "milestoneId",
          "highFocusGoalId",
          "createdAt",
          "updatedAt",
        ],
        [SHEET_NAMES.TIME_LOGS]: [
          "id",
          "taskId",
          "journal",
          "startTime",
          "endTime",
          "duration",
        ],
        [SHEET_NAMES.TO_DONT_LIST]: [
          "id",
          "clientId",
          "name",
          "order",
          "weekId",
        ],
        [SHEET_NAMES.BRAIN_DUMP]: ["id", "clientId", "text", "day"],
        [SHEET_NAMES.DAYS]: ["id", "taskId", "date"],
        [SHEET_NAMES.WEEKS]: [
          "id",
          "periodName",
          "week",
          "startDate",
          "endDate",
        ],
        [SHEET_NAMES.TASK_WEEKS]: ["id", "taskId", "weekId"],
        [SHEET_NAMES.TASK_DAYS]: ["id", "taskId", "date"],
      };

      for (const [sheetName, sheetHeaders] of Object.entries(headers)) {
        try {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1:Z1`,
            valueInputOption: "RAW",
            resource: {
              values: [sheetHeaders],
            },
          });
          console.log(`✅ Initialized headers for ${sheetName}`);
        } catch (error) {
          console.error(`❌ Error initializing ${sheetName}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error validating spreadsheet:", error);
      throw error;
    }
  }

  // Clear all data in a sheet except header row
  async clearData(sheetName: string): Promise<void> {
    try {
      await this.validateSpreadsheet();

      // Get all data to determine the range to clear
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        // Only header row exists, nothing to clear
        return;
      }

      // Clear all data rows (from row 2 onwards)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:Z${rows.length}`,
      });

      console.log(`🧹 Cleared ${rows.length - 1} data rows from ${sheetName}`);
    } catch (error) {
      console.error(`Error clearing data from ${sheetName}:`, error);
      throw error;
    }
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();
