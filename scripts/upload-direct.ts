import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";
import { google } from "googleapis";
import { SHEET_NAMES } from "../configs/googleSheets";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface CSVData {
  [key: string]: any;
}

// Google Sheets API configuration
const auth = new google.auth.GoogleAuth({
  keyFile:
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

// Mapping CSV files to sheet names for the remaining 2 tables
const CSV_TO_SHEET_MAPPING: { [key: string]: string } = {
  "Week.csv": SHEET_NAMES.WEEKS,
  "HighFocusGoal.csv": SHEET_NAMES.HIGH_FOCUS_GOALS,
};

async function readCSVFile(filePath: string): Promise<CSVData[]> {
  return new Promise((resolve, reject) => {
    const results: CSVData[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: CSVData) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error: Error) => reject(error));
  });
}

async function uploadCSVDirectly(csvFileName: string, sheetName: string) {
  try {
    const csvPath = path.join(__dirname, "..", "databases", csvFileName);

    if (!fs.existsSync(csvPath)) {
      console.log(`❌ File ${csvFileName} tidak ditemukan`);
      return;
    }

    console.log(`📖 Membaca file ${csvFileName}...`);
    const csvData = await readCSVFile(csvPath);

    if (csvData.length === 0) {
      console.log(`⚠️  File ${csvFileName} kosong atau hanya berisi header`);
      return;
    }

    console.log(`📊 Ditemukan ${csvData.length} baris data di ${csvFileName}`);

    // Clear existing data in the sheet (except header)
    console.log(`🧹 Membersihkan data lama di sheet ${sheetName}...`);
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (rows && rows.length > 1) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A2:Z${rows.length}`,
        });
        console.log(
          `🧹 Cleared ${rows.length - 1} data rows from ${sheetName}`
        );
      }
    } catch (error) {
      console.log(`⚠️  Could not clear data from ${sheetName}, continuing...`);
    }

    // Prepare data for batch upload
    console.log(`📤 Menyiapkan data untuk upload ke sheet ${sheetName}...`);

    // Get headers first
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });

    const headers = headersResponse.data.values?.[0] || [];
    console.log(`📋 Headers: ${headers.join(", ")}`);

    // Prepare rows with auto-incrementing IDs
    const rowsToUpload = csvData.map((row, index) => {
      const newRow: any = {
        id: index + 1, // Simple auto-increment
        ...row,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert to array based on headers
      return headers.map((header: string) => newRow[header] || "");
    });

    // Upload all data at once
    console.log(
      `📤 Mengupload ${rowsToUpload.length} baris data ke sheet ${sheetName}...`
    );
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: rowsToUpload,
      },
    });

    console.log(
      `✅ Berhasil mengupload ${csvData.length} baris data ke sheet ${sheetName}`
    );
  } catch (error) {
    console.error(`❌ Error mengupload ${csvFileName} ke ${sheetName}:`, error);
  }
}

async function uploadRemainingTables() {
  try {
    console.log("🚀 Memulai upload data CSV untuk 2 tabel yang tersisa...\n");

    if (!SPREADSHEET_ID) {
      console.error("❌ GOOGLE_SPREADSHEET_ID tidak ditemukan di .env.local");
      return;
    }

    console.log(`📋 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

    // Upload each CSV file with longer delay
    for (const [csvFileName, sheetName] of Object.entries(
      CSV_TO_SHEET_MAPPING
    )) {
      console.log(`\n--- Processing ${csvFileName} ---`);
      await uploadCSVDirectly(csvFileName, sheetName);

      // Add a longer delay between files
      console.log("⏳ Menunggu 10 detik sebelum file berikutnya...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.log("\n🎉 Selesai mengupload data untuk 2 tabel yang tersisa!");
  } catch (error) {
    console.error("❌ Error dalam proses upload:", error);
  }
}

// Run the script
uploadRemainingTables().catch(console.error);
