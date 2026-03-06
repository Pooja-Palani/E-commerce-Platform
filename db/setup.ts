/**
 * One-shot DB setup script for new environments.
 *
 * Run from project root:
 *   npx tsx db/setup.ts
 *
 * This will:
 * - Create any missing core tables and enums
 * - Add any missing columns needed by the app
 *
 * It is safe to run multiple times.
 */

// These scripts perform the actual work when imported.
// They use `dotenv/config` and manage their own pg connections.
import "../script/create-missing-tables";
import "../script/add-missing-columns";

