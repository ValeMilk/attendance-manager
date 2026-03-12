import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(path.join(__dirname, "../.env"), "utf8");
const dbUrl = envFile.split("\n").find(l => l.startsWith("MONGODB_URI"))?.split("=").slice(1).join("=")?.trim().replace(/['"]/g, "");
console.log("DB URL prefix:", dbUrl?.substring(0, 50));
const client = new MongoClient(dbUrl);
await client.connect();
const db = client.db();
// Registros com supervisor preenchido
const withSupervisor = await db.collection("attendancerecords").find({ supervisor: { $ne: "" } }).limit(10).toArray();
console.log("\nRegistros com campo 'supervisor' preenchido:");
withSupervisor.forEach(r => console.log(JSON.stringify({ employeeId: r.employeeId, day: r.day, supervisor: r.supervisor, apontador: r.apontador })));
// Total de registros
const total = await db.collection("attendancerecords").countDocuments();
console.log("\nTotal de registros:", total);
// Amostra de employeeIds únicos
const sample = await db.collection("attendancerecords").distinct("employeeId");
console.log("\nSample employeeIds (first 15):", sample.slice(0, 15));
await client.close();
