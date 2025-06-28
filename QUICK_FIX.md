# Quick Fix for Google Sheets Setup

## Problem

You're getting "Requested entity was not found" errors when running `npm run init-sheets`.

## Root Cause

The `GOOGLE_SPREADSHEET_ID` environment variable is not set or the spreadsheet doesn't exist.

## Solution

### Option 1: Use the New Setup Script (Recommended)

```bash
npm run setup-sheets
```

This script will:

1. ✅ Check if credentials file exists
2. ✅ Create a new spreadsheet if needed
3. ✅ Validate access permissions
4. ✅ Initialize all sheets with headers
5. ✅ Add sample data

### Option 2: Manual Setup

#### Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "Better Planner Database"
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

#### Step 2: Update Environment Variables

**IMPORTANT**: Use `.env.local` (NOT `.env`) for security!

Create or update `.env.local`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_SPREADSHEET_ID=your-actual-spreadsheet-id-here
```

**Why .env.local?**

- `.env.local` is NOT committed to git (secure for secrets)
- `.env` is committed to git (not secure for API keys)

#### Step 3: Share Spreadsheet

1. Click "Share" in Google Sheets
2. Add your service account email (from `google-credentials.json`)
3. Give "Editor" permissions

#### Step 4: Run Setup

```bash
npm run setup-sheets
```

## Common Issues

### ❌ "Google credentials file not found"

**Solution**: Download service account JSON key and rename to `google-credentials.json`

### ❌ "Spreadsheet not found"

**Solution**: Check spreadsheet ID and ensure service account has access

### ❌ "Permission denied"

**Solution**: Share spreadsheet with service account email

### ❌ "API not enabled"

**Solution**: Enable Google Sheets API in Google Cloud Console

### ❌ "Environment variables not loaded"

**Solution**: Make sure you're using `.env.local` (not `.env`)

## Verification

After setup, you should see:

```
✅ Google credentials file found
✅ Spreadsheet ID found
✅ Spreadsheet access validated
✅ Spreadsheet headers initialized
✅ Sample data added successfully
🎉 Google Sheets setup completed successfully!
```

## Next Steps

1. Run `npm run dev` to start the application
2. Visit `http://localhost:3000`
3. Check your Google Sheets to see the data

## Environment Files Explained

| File           | Purpose        | Git Status | Use For             |
| -------------- | -------------- | ---------- | ------------------- |
| `.env`         | Public config  | Committed  | Public settings     |
| `.env.local`   | Private config | Ignored    | API keys, passwords |
| `.env.example` | Template       | Committed  | Documentation       |

## Need Help?

1. Check `GOOGLE_SHEETS_SETUP.md` for detailed instructions
2. Verify your Google Cloud project setup
3. Ensure all environment variables are set correctly in `.env.local`
