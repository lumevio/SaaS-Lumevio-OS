import { PrismaClient, RoleKey } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles: Array<{ key: RoleKey; name: string }> = [
    { key: "OWNER", name: "Owner" },
    { key: "ADMIN", name: "Admin" },
    { key: "CLIENT_ADMIN", name: "Client Admin" },
    { key: "MANAGER", name: "Manager" },
    { key: "ANALYST", name: "Analyst" },
    { key: "FIELD_OPERATOR", name: "Field Operator" },
    { key: "VIEWER", name: "Viewer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: {
        key: role.key,
        name: role.name,
      },
    });
  }

  console.log("✅ Role gotowe");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });