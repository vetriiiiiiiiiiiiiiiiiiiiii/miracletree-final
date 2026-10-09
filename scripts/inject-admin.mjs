import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@miracletree.in";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: "Miracle",
      lastName: "Tree",
      role: "admin",
      emailVerified: new Date(),
    },
    update: { 
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin" 
    },
  });
  
  for (const adminEmail of adminEmails) {
    if (!adminEmail) continue;
    
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "admin" }
      });
    }
  }

  console.log("Admin users injected/updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
