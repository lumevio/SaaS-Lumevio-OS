import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@lumevio.pl";

  const user = await prisma.user.update({
    where: { email },
    data: {
      isPlatformAdmin: true,
    },
  });

  console.log("Ustawiono platform admin:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });