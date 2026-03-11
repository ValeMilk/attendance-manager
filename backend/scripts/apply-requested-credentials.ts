import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User } from '../src/models/User.js';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

type AccountRule = {
  key: string;
  canonicalEmail: string;
  legacyEmail?: string;
  password: string;
  expectedRole?: 'admin' | 'supervisor' | 'expectador';
};

const RULES: AccountRule[] = [
  {
    key: 'admin',
    canonicalEmail: 'admin@attendance.com',
    password: 'admin123',
    expectedRole: 'admin',
  },
  {
    key: 'mariana',
    canonicalEmail: 'mariana-moura@attendance.com',
    legacyEmail: 'mariana@attendance.com',
    password: 'mariana123',
    expectedRole: 'supervisor',
  },
  {
    key: 'paulo',
    canonicalEmail: 'paulo-oliveira@attendance.com',
    legacyEmail: 'paulo@attendance.com',
    password: 'paulo123',
    expectedRole: 'supervisor',
  },
  {
    key: 'paulinho',
    canonicalEmail: 'paulinho-de-paula@attendance.com',
    legacyEmail: 'paulinho@attendance.com',
    password: 'paulinho123',
    expectedRole: 'supervisor',
  },
  {
    key: 'rodney',
    canonicalEmail: 'rodney-de-macedo@attendance.com',
    legacyEmail: 'rodney@attendance.com',
    password: 'rodney123',
    expectedRole: 'supervisor',
  },
  {
    key: 'expectador',
    canonicalEmail: 'expectador@attendance.com',
    password: 'expectador123',
    expectedRole: 'expectador',
  },
];

async function findTargetUser(rule: AccountRule) {
  const byCanonical = await User.findOne({ email: rule.canonicalEmail });
  if (byCanonical) {
    return byCanonical;
  }

  if (rule.legacyEmail) {
    const byLegacy = await User.findOne({ email: rule.legacyEmail });
    if (byLegacy) {
      return byLegacy;
    }
  }

  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');

  const report: Array<Record<string, unknown>> = [];

  for (const rule of RULES) {
    const user = await findTargetUser(rule);
    if (!user) {
      report.push({ key: rule.key, status: 'missing' });
      continue;
    }

    user.password = await bcryptjs.hash(rule.password, 10);
    user.isActive = true;

    if (rule.expectedRole && user.role !== rule.expectedRole) {
      user.role = rule.expectedRole;
    }

    await user.save();

    report.push({
      key: rule.key,
      status: 'updated',
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  }

  console.table(report);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
