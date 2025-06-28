# Spreadsheet Database Options for Better Planner

## Overview

This document outlines different options for using spreadsheets as a database for your Better Planner application, replacing PostgreSQL.

## Option 1: Google Sheets API (Recommended) ✅

### Pros:

- **Easy Setup**: No server required, cloud-based
- **Visual Interface**: View/edit data directly in Google Sheets
- **Real-time Collaboration**: Multiple users can work simultaneously
- **Built-in Backup**: Automatic version control and backup
- **Free Tier**: Generous free limits for most use cases
- **Integration**: Works well with Google ecosystem

### Cons:

- **Rate Limits**: 300 requests per minute per user
- **Performance**: Slower than traditional databases
- **Complex Queries**: Limited compared to SQL
- **Dependencies**: Requires Google Cloud setup

### Implementation Status: ✅ Complete

- Service layer created (`configs/googleSheets.ts`)
- Controllers updated (`app/api/clients/controller.ts`, etc.)
- Setup script available (`scripts/init-spreadsheet.ts`)
- Documentation provided (`GOOGLE_SHEETS_SETUP.md`)

## Option 2: Airtable API

### Pros:

- **Rich Features**: Advanced filtering, sorting, and views
- **User-Friendly**: Excellent UI for data management
- **Automations**: Built-in workflow automation
- **Integrations**: Extensive third-party integrations
- **Relational Data**: Better support for relationships

### Cons:

- **Cost**: Limited free tier, paid plans required for heavy usage
- **Rate Limits**: Stricter limits than Google Sheets
- **Vendor Lock-in**: Proprietary platform
- **Complex Setup**: More complex API than Google Sheets

### Implementation:

```typescript
// Example Airtable implementation
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

export class AirtableService {
  async getAll(tableName: string) {
    return new Promise((resolve, reject) => {
      base(tableName)
        .select()
        .all((err, records) => {
          if (err) reject(err);
          resolve(records.map((record) => record.fields));
        });
    });
  }
}
```

## Option 3: Excel Online (Microsoft Graph API)

### Pros:

- **Familiar Interface**: Excel is widely used
- **Advanced Features**: Powerful spreadsheet capabilities
- **Integration**: Works with Microsoft 365 ecosystem
- **Offline Access**: Can work offline with sync

### Cons:

- **Complex Setup**: Requires Microsoft Graph API setup
- **Cost**: Requires Microsoft 365 subscription
- **Rate Limits**: Strict API limits
- **Less Developer-Friendly**: More complex than Google Sheets

### Implementation:

```typescript
// Example Microsoft Graph implementation
import { Client } from "@microsoft/microsoft-graph-client";

const graphClient = Client.init({
  authProvider: (done) => {
    done(null, accessToken);
  },
});

export class ExcelService {
  async readRange(workbookId: string, worksheetId: string, range: string) {
    const response = await graphClient
      .api(
        `/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`
      )
      .get();
    return response.values;
  }
}
```

## Option 4: CSV Files with Local Storage

### Pros:

- **Simple**: No external dependencies
- **Fast**: Local file system access
- **Portable**: Easy to backup and move
- **Free**: No costs involved

### Cons:

- **No Real-time Sync**: Manual file management
- **Limited Features**: No built-in relationships
- **Concurrency Issues**: Multiple users can cause conflicts
- **No Cloud Access**: Requires file sharing solutions

### Implementation:

```typescript
import fs from "fs";
import csv from "csv-parser";

export class CSVService {
  async readFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  async writeFile(filePath: string, data: any[]): Promise<void> {
    const csvContent = this.convertToCSV(data);
    await fs.promises.writeFile(filePath, csvContent);
  }
}
```

## Option 5: Notion API

### Pros:

- **Rich Content**: Supports rich text, databases, and pages
- **User-Friendly**: Excellent interface for content management
- **Flexible**: Can create custom databases and views
- **Integration**: Good API and webhook support

### Cons:

- **Rate Limits**: Strict API limits
- **Cost**: Limited free tier
- **Learning Curve**: Different paradigm from traditional databases
- **Vendor Lock-in**: Proprietary platform

### Implementation:

```typescript
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export class NotionService {
  async queryDatabase(databaseId: string) {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    return response.results;
  }

  async createPage(databaseId: string, properties: any) {
    return await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  }
}
```

## Comparison Table

| Feature              | Google Sheets | Airtable | Excel Online | CSV Files | Notion   |
| -------------------- | ------------- | -------- | ------------ | --------- | -------- |
| **Setup Difficulty** | Easy          | Medium   | Hard         | Very Easy | Medium   |
| **Cost**             | Free          | Paid     | Paid         | Free      | Paid     |
| **Real-time Sync**   | ✅            | ✅       | ✅           | ❌        | ✅       |
| **API Limits**       | 300/min       | 5/sec    | 1000/hour    | None      | 3/sec    |
| **Visual Interface** | ✅            | ✅       | ✅           | ❌        | ✅       |
| **Relationships**    | Basic         | Advanced | Basic        | None      | Advanced |
| **Offline Access**   | ❌            | ❌       | ✅           | ✅        | ❌       |
| **Backup**           | Auto          | Auto     | Auto         | Manual    | Auto     |

## Recommendation

**For Better Planner, I recommend Google Sheets API** because:

1. **Perfect for Personal Use**: Free tier is sufficient for individual planning
2. **Easy Migration**: Simple setup and familiar interface
3. **Visual Data Management**: Can view and edit data directly
4. **Reliable**: Google's infrastructure is very stable
5. **Future-Proof**: Easy to migrate to other solutions later

## Migration Path

If you want to try different options later:

1. **Start with Google Sheets** (current implementation)
2. **Evaluate usage patterns** and performance needs
3. **Consider Airtable** if you need more advanced features
4. **Move to traditional database** if you outgrow spreadsheet limitations

## Next Steps

1. **Follow the Google Sheets setup guide** (`GOOGLE_SHEETS_SETUP.md`)
2. **Test the implementation** with sample data
3. **Monitor performance** and usage patterns
4. **Consider other options** if needed based on usage

## Support

For implementation help:

- Google Sheets: Check `GOOGLE_SHEETS_SETUP.md`
- Other options: Create specific setup guides as needed
- General questions: Review the implementation code in `configs/` and `app/api/`
