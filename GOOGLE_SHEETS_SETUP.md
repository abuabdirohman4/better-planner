# Google Sheets Setup Guide

## Overview

This guide will help you migrate your Better Planner application from PostgreSQL to Google Sheets as the database.

## Prerequisites

- Google Cloud Platform account
- Node.js and npm installed
- Basic understanding of Google Sheets API

## Step 1: Set Up Google Cloud Project

1. **Create a new Google Cloud Project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sheets API**

   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details:
     - Name: `better-planner-sheets`
     - Description: `Service account for Better Planner Google Sheets integration`
   - Click "Create and Continue"
   - Skip role assignment (click "Continue")
   - Click "Done"

4. **Generate Service Account Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file
   - Rename it to `google-credentials.json`
   - Place it in your project root directory

## Step 2: Create Google Spreadsheet

1. **Create a new Google Spreadsheet**

   - Go to [Google Sheets](https://sheets.google.com/)
   - Create a new spreadsheet
   - Name it "Better Planner Database"

2. **Get Spreadsheet ID**

   - Copy the spreadsheet ID from the URL
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - The ID is the long string between `/d/` and `/edit`

3. **Share with Service Account**
   - Click "Share" button
   - Add the service account email (found in the JSON file)
   - Give it "Editor" permissions
   - Click "Send"

## Step 3: Configure Environment Variables

**IMPORTANT**: Use `.env.local` for security (NOT `.env`)!

1. **Copy environment example**

   ```bash
   cp .env.example .env.local
   ```

2. **Update .env.local**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   GOOGLE_SPREADSHEET_ID=your-actual-spreadsheet-id
   ```

**Why .env.local?**

- `.env.local` is NOT committed to git (secure for API keys)
- `.env` is committed to git (not secure for secrets)

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Initialize Spreadsheet

```bash
npm run setup-sheets
```

This will:

- Create all necessary sheets with proper headers
- Add sample data for testing
- Set up the basic structure

## Step 6: Update API Routes

The application now uses Google Sheets instead of PostgreSQL. All API routes have been updated to use the new `GoogleSheetsService`.

### Key Changes:

- `configs/googleSheets.ts` - Main service for Google Sheets operations
- `app/api/clients/controller.ts` - Updated to use Google Sheets
- All other controllers follow the same pattern

## Step 7: Test the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application.

## File Structure

```
├── configs/
│   └── googleSheets.ts          # Google Sheets service
├── scripts/
│   └── setup-google-sheets.ts   # Setup script
├── app/api/
│   └── clients/
│       └── controller.ts        # Updated to use Google Sheets
├── google-credentials.json      # Service account credentials
└── .env.local                   # Environment variables (SECURE)
```

## Environment Files Explained

| File           | Purpose        | Git Status | Use For             |
| -------------- | -------------- | ---------- | ------------------- |
| `.env`         | Public config  | Committed  | Public settings     |
| `.env.local`   | Private config | Ignored    | API keys, passwords |
| `.env.example` | Template       | Committed  | Documentation       |

## Advantages of Google Sheets

1. **Easy Setup**: No database server required
2. **Visual Data**: View and edit data directly in Google Sheets
3. **Backup & Sharing**: Built-in version control and sharing
4. **Cost Effective**: Free for most use cases
5. **Real-time Collaboration**: Multiple users can view/edit simultaneously

## Limitations

1. **Rate Limits**: Google Sheets API has rate limits
2. **Performance**: Slower than traditional databases for large datasets
3. **Complex Queries**: Limited query capabilities compared to SQL
4. **Concurrent Writes**: Potential conflicts with simultaneous updates

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error**

   - Check that `google-credentials.json` is in the project root
   - Verify the service account has access to the spreadsheet

2. **"Spreadsheet not found" error**

   - Verify the spreadsheet ID in `.env.local`
   - Ensure the service account has been shared with the spreadsheet

3. **"Permission denied" error**

   - Check that the service account has "Editor" permissions
   - Verify the Google Sheets API is enabled

4. **"Environment variables not loaded"**
   - Make sure you're using `.env.local` (not `.env`)
   - Restart your development server after changing environment variables

### Debug Mode:

Add this to your `.env.local` for detailed logging:

```env
DEBUG=true
```

## Migration from PostgreSQL

If you have existing data in PostgreSQL:

1. **Export data from PostgreSQL**

   ```sql
   COPY (SELECT * FROM "Client") TO '/tmp/clients.csv' CSV HEADER;
   ```

2. **Import to Google Sheets**

   - Open your Google Spreadsheet
   - Go to File > Import
   - Upload the CSV file
   - Select the appropriate sheet

3. **Update data format**
   - Ensure dates are in ISO format
   - Convert boolean values to proper format
   - Update foreign key references

## Security Considerations

1. **Keep credentials secure**

   - Never commit `google-credentials.json` to version control
   - Use `.env.local` for sensitive environment variables
   - Add sensitive files to `.gitignore`

2. **Limit access**

   - Only share the spreadsheet with necessary users
   - Use service account with minimal required permissions

3. **Regular backups**
   - Google Sheets has built-in version history
   - Consider additional backup strategies for critical data

## Performance Optimization

1. **Batch operations**

   - Use batch updates when possible
   - Minimize API calls

2. **Caching**

   - Implement client-side caching for frequently accessed data
   - Use session storage for temporary data

3. **Pagination**
   - Implement pagination for large datasets
   - Load data on-demand

## Support

For issues or questions:

1. Check the Google Sheets API documentation
2. Review the error logs in the console
3. Verify your setup against this guide
