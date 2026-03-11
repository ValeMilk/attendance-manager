const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const envFile = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
const dbUrl = envFile.split("\n").find(l => l.startsWith("DATABASE_URL"))?.split("=").slice(1).join("=")?.trim().replace(/['"]/g, "");

console.log("DB URL prefix:", dbUrl?.substring(0, 50));

const client = new MongoClient(dbUrl);
client.connect().then(async () => {
  const db = client.db();

  // Registros com supervisor preenchido
  const withSupervisor = await db.collection("attendancerecords").find({ supervisor: { $ne: "" } }).limit(10).toArray();
  console.log("\nRegistros com campo 'supervisor' preenchido:");
  withSupervisor.forEach(r => console.log(JSON.stringify({ employeeId: r.employeeId, day: r.day, supervisor: r.supervisor, apontador: r.apontador })));

  // Total de registros
  const total = await db.collection("attendancerecords").countDocuments();
  console.log("\nTotal de registros:", total);

  // Amostra de employeeId únicos
  const sample = await db.collection("attendancerecords").distinct("employeeId");
  console.log("\nSample employeeIds (first 10):", sample.slice(0, 10));

  await client.close();
}).catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
