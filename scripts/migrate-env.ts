import fs from "fs";
import path from "path";

async function migrateEnvFiles() {
  console.log("🔄 Migrating environment files...\n");

  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env");
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envExamplePath = path.join(projectRoot, ".env.example");

  // Check if .env exists
  if (fs.existsSync(envPath)) {
    console.log("📁 Found .env file");

    // Read .env content
    const envContent = fs.readFileSync(envPath, "utf8");

    // Check if .env.local already exists
    if (fs.existsSync(envLocalPath)) {
      console.log("⚠️  .env.local already exists");
      console.log(
        "📋 Please manually merge sensitive variables from .env to .env.local"
      );
      console.log("🔒 Keep only public variables in .env");

      // Show what should be moved
      const sensitiveVars = [
        "GOOGLE_APPLICATION_CREDENTIALS",
        "GOOGLE_SPREADSHEET_ID",
        "DATABASE_URL",
        "POSTGRES_PRISMA_URL",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
      ];

      console.log("\n📝 Sensitive variables that should be in .env.local:");
      sensitiveVars.forEach((varName) => {
        if (envContent.includes(varName)) {
          console.log(`   - ${varName}`);
        }
      });
    } else {
      // Create .env.local with sensitive variables
      console.log("📝 Creating .env.local with sensitive variables...");

      const sensitiveVars = [
        "GOOGLE_APPLICATION_CREDENTIALS",
        "GOOGLE_SPREADSHEET_ID",
        "DATABASE_URL",
        "POSTGRES_PRISMA_URL",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
      ];

      const envLines = envContent.split("\n");
      const sensitiveLines = envLines.filter((line) => {
        const varName = line.split("=")[0];
        return sensitiveVars.some((sensitiveVar) =>
          line.trim().startsWith(sensitiveVar + "=")
        );
      });

      const publicLines = envLines.filter((line) => {
        const varName = line.split("=")[0];
        return !sensitiveVars.some((sensitiveVar) =>
          line.trim().startsWith(sensitiveVar + "=")
        );
      });

      // Write .env.local
      const envLocalContent = [
        "# Environment Variables for Better Planner",
        "# This file contains sensitive data and is NOT committed to git",
        "",
        ...sensitiveLines,
        "",
      ].join("\n");

      fs.writeFileSync(envLocalPath, envLocalContent);
      console.log("✅ Created .env.local with sensitive variables");

      // Update .env with only public variables
      const newEnvContent = [
        "# Public Environment Variables for Better Planner",
        "# This file is committed to git (no sensitive data)",
        "",
        ...publicLines,
        "",
      ].join("\n");

      fs.writeFileSync(envPath, newEnvContent);
      console.log("✅ Updated .env with only public variables");
    }
  } else {
    console.log("📁 No .env file found");
  }

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.log("📝 Creating .env.example template...");

    const exampleContent = `# Environment Variables for Better Planner
# Copy this file to .env.local (NOT .env) for security

# Google Sheets Configuration (REQUIRED for spreadsheet database)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here

# Database Configuration (if using PostgreSQL instead of Google Sheets)
DATABASE_URL="postgresql://username:password@localhost:5432/better_planner"
POSTGRES_PRISMA_URL="postgresql://username:password@localhost:5432/better_planner"

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Development Configuration
NODE_ENV=development
`;

    fs.writeFileSync(envExamplePath, exampleContent);
    console.log("✅ Created .env.example template");
  }

  console.log("\n📋 Summary:");
  console.log(
    "✅ .env.local - Contains sensitive variables (NOT committed to git)"
  );
  console.log("✅ .env - Contains public variables (committed to git)");
  console.log("✅ .env.example - Template for new developers");

  console.log("\n🔒 Security reminder:");
  console.log("- Never commit API keys, passwords, or credentials to git");
  console.log("- Use .env.local for all sensitive environment variables");
  console.log("- Keep .env for public configuration only");

  console.log("\n🚀 Next steps:");
  console.log("1. Verify your .env.local contains all necessary variables");
  console.log('2. Run "npm run setup-sheets" to configure Google Sheets');
  console.log('3. Start your application with "npm run dev"');
}

// Run the migration
migrateEnvFiles().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
