import { Database } from "sqlite3";
import { config } from "dotenv";
config();

const dbPath = process.env.NODE_ENV === "test" ? ":memory:" : "./database.db";
const database = new Database(dbPath);

// Enable foreign key constraints
database.run("PRAGMA foreign_keys = ON;", (err) => {
  if (err) {
    console.error("Failed to enable foreign key constraints:", err);
  } else {
    console.log("Foreign key constraints enabled.");
  }
});

export const db = {
  get: (query: string, params: any[] = []) => {
    return new Promise<any>((resolve, reject) => {
      database.get(query, params, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },
  all: (query: string, params: any[] = []) => {
    return new Promise<any[]>((resolve, reject) => {
      database.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },
  run: (query: string, params: any[] = []) => {
    return new Promise<number>((resolve, reject) => {
      database.run(query, params, function (this: any, err: Error | null) {
        if (err) reject(err);
        resolve(this?.lastID || 0);
      });
    });
  },
};
