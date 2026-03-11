import prisma from '../src/prisma';
import bcrypt from 'bcryptjs';
async function main() {
    const count = await prisma.user.count();
    if (count === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.create({ data: { username: 'admin', password: hash, role: 'admin' } });
        console.log('Created initial admin:', user.username);
    }
    else {
        console.log('Users exist, skipping seed');
    }
}
main().catch(console.error).finally(() => process.exit(0));
