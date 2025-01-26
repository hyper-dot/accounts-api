import { db } from "../db";
import fs from "fs";
import path from "path";

// Using Jest's globals directly without imports
beforeAll(async () => {
  // Read and execute schema.sql
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, "../db/schema.sql"),
    "utf8"
  );

  // Split the schema into individual statements
  const statements = schemaSQL
    .split(";")
    .filter((stmt) => stmt.trim())
    .map((stmt) => stmt + ";");

  // Execute each statement
  for (const statement of statements) {
    await db.run(statement);
  }

  // Enable foreign keys
  await db.run("PRAGMA foreign_keys = ON;");
});

afterAll(async () => {
  // Cleanup
  await db.run("DELETE FROM journal_entry");
  await db.run("DELETE FROM invoice");
  await db.run("DELETE FROM purchase_order");
  await db.run("DELETE FROM vendor");
});
