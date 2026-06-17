const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const dbPath = path.join(dataDir, "database.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA journal_mode = WAL");

function runSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}

runSchema();

module.exports = db;
