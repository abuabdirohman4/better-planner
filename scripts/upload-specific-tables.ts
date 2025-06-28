import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";
import { googleSheetsService, SHEET_NAMES } from "../configs/googleSheets";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface CSVData {
  [key: string]: any;
}

// Mapping CSV files to sheet names for the 3 specific tables
const CSV_TO_SHEET_MAPPING: { [key: string]: string } = {
  "Week.csv": SHEET_NAMES.WEEKS,
  "HighFocusGoal.csv": SHEET_NAMES.HIGH_FOCUS_GOALS,
  "StatusHighFocusGoal.csv": SHEET_NAMES.STATUS_HIGH_FOCUS_GOALS,
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

async function uploadCSVToSheet(csvFileName: string, sheetName: string) {
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
    await googleSheetsService.clearData(sheetName);

    // Upload data row by row with delay to avoid rate limiting
    console.log(`📤 Mengupload data ke sheet ${sheetName}...`);
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      await googleSheetsService.create(sheetName, row);

      // Add delay every 5 rows to avoid rate limiting
      if ((i + 1) % 5 === 0) {
        console.log(`   Progress: ${i + 1}/${csvData.length} rows uploaded`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(
      `✅ Berhasil mengupload ${csvData.length} baris data ke sheet ${sheetName}`
    );
  } catch (error) {
    console.error(`❌ Error mengupload ${csvFileName} ke ${sheetName}:`, error);
  }
}

async function uploadSpecificTables() {
  try {
    console.log("🚀 Memulai upload data CSV untuk 3 tabel spesifik...\n");

    // Check if spreadsheet ID is set
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      console.error("❌ GOOGLE_SPREADSHEET_ID tidak ditemukan di .env.local");
      return;
    }

    console.log(`📋 Spreadsheet ID: ${process.env.GOOGLE_SPREADSHEET_ID}\n`);

    // Upload each CSV file with longer delay
    for (const [csvFileName, sheetName] of Object.entries(
      CSV_TO_SHEET_MAPPING
    )) {
      console.log(`\n--- Processing ${csvFileName} ---`);
      await uploadCSVToSheet(csvFileName, sheetName);
      // Add a longer delay between files to avoid rate limiting
      console.log("⏳ Menunggu 5 detik sebelum file berikutnya...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("\n🎉 Selesai mengupload data untuk 3 tabel spesifik!");
  } catch (error) {
    console.error("❌ Error dalam proses upload:", error);
  }
}

// Run the script
uploadSpecificTables().catch(console.error);
