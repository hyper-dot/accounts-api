import { db } from "../db";
import { promises as fs } from "fs";
import path from "path";

export async function clearTables() {
  await db.run("DROP TABLE IF EXISTS journal_entry");
  await db.run("DROP TABLE IF EXISTS invoice");
  await db.run("DROP TABLE IF EXISTS purchase_order");
  await db.run("DROP TABLE IF EXISTS vendor");
}

export async function createTables() {
  try {
    // Read the schema.sql file
    const schemaPath = path.join(__dirname, "../db/schema.sql");
    const schemaContent = await fs.readFile(schemaPath, "utf-8");

    // Split the schema into individual statements
    const statements = schemaContent
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement !== "");

    statements.forEach(async (statement) => {
      await db.run(statement);
    });
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

export async function seedDatabase() {
  try {
    // Read the seed.sql file
    const seedPath = path.join(__dirname, "../db/seed.sql");
    const seedContent = await fs.readFile(seedPath, "utf-8");

    // Split the seed into individual statements, removing comments
    const statements = seedContent
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement !== "");

    // Execute statements sequentially
    for (const statement of statements) {
      try {
        if (statement) {
          await db.run(statement);
        }
      } catch (err) {
        console.error("Error executing statement:", statement);
        console.error("Error details:", err);
        throw err;
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

async function main() {
  await createTables();
  await seedDatabase();
}

main();
