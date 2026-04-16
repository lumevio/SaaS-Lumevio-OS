import { PrismaClient, RoleKey } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { key: RoleKey.OWNER, name: "Owner" },
  { key: RoleKey.ADMIN, name: "Admin" },
  { key: RoleKey.CLIENT_ADMIN, name: "Client Admin" },
  { key: RoleKey.MANAGER, name: "Manager" },
  { key: RoleKey.ANALYST, name: "Analyst" },
  { key: RoleKey.FIELD_OPERATOR, name: "Field Operator" },
  { key: RoleKey.VIEWER, name: "Viewer" },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: role,
    });
  }

  console.log("Roles seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });