import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { AttendanceRecord } from '../src/models/AttendanceRecord.js';
import { Employee } from '../src/models/Employee.js';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

const SOURCE_ID = 'global-max';
const TARGET_ID = 'mariana-moura-max-felix-monteiro';
const TARGET_SUPERVISOR_ID = 'mariana-moura';
const TARGET_NAME = 'max-felix-monteiro';

function slugify(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function chooseValue(primary: string, secondary: string) {
  const p = String(primary || '').trim();
  const s = String(secondary || '').trim();
  return p || s || '';
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');

  const sourceRows = await AttendanceRecord.find({ employeeId: SOURCE_ID }).lean();

  let migrated = 0;
  let deleted = 0;
  let merged = 0;

  for (const source of sourceRows) {
    const existing = await AttendanceRecord.findOne({ employeeId: TARGET_ID, day: source.day }).lean();

    if (existing) {
      await AttendanceRecord.updateOne(
        { _id: existing._id },
        {
          $set: {
            apontador: chooseValue(existing.apontador, source.apontador),
            supervisor: chooseValue(existing.supervisor, source.supervisor),
            employeeName: TARGET_NAME,
            supervisorId: TARGET_SUPERVISOR_ID,
          },
        }
      );
      await AttendanceRecord.deleteOne({ _id: source._id });
      merged += 1;
      deleted += 1;
      continue;
    }

    await AttendanceRecord.updateOne(
      { _id: source._id },
      {
        $set: {
          employeeId: TARGET_ID,
          employeeName: TARGET_NAME,
          supervisorId: TARGET_SUPERVISOR_ID,
        },
      }
    );
    migrated += 1;
  }

  // Normalize all canonical rows metadata
  await AttendanceRecord.updateMany(
    { employeeId: TARGET_ID },
    { $set: { employeeName: TARGET_NAME, supervisorId: TARGET_SUPERVISOR_ID } }
  );

  // Remove legacy/global employee docs for max
  const deletedGlobal = await Employee.deleteMany({ supervisorId: 'global', slug: 'max' });
  const deletedLegacy = await Employee.deleteMany({ supervisorId: 'mariana', slug: 'moura-max-felix-monteiro' });

  // Ensure canonical employee doc exists
  await Employee.findOneAndUpdate(
    { supervisorId: TARGET_SUPERVISOR_ID, slug: slugify(TARGET_NAME) },
    { $set: { name: TARGET_NAME, displayName: TARGET_NAME } },
    { upsert: true }
  );

  console.log('cleanup-max-canonical result:', {
    sourceRows: sourceRows.length,
    migrated,
    merged,
    deleted,
    deletedGlobalEmployees: deletedGlobal.deletedCount || 0,
    deletedLegacyEmployees: deletedLegacy.deletedCount || 0,
  });

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
