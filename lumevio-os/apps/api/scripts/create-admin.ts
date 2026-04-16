import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@lumevio.pl";
  const password = "Admin123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isPlatformAdmin: true,
      firstName: "LUMEVIO",
      lastName: "Admin",
    },
    create: {
      email,
      passwordHash,
      isPlatformAdmin: true,
      firstName: "LUMEVIO",
      lastName: "Admin",
    },
  });

  console.log("Superadmin ready:");
  console.log("email:", email);
  console.log("password:", password);
  console.log("id:", user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });