const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ROLES ===");
  const roles = await prisma.role.findMany();
  console.log(JSON.stringify(roles, null, 2));

  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role?.name })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
