const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const initialUsers = [
    {
      name: "Root User",
      email: "root@example.com",
      password: "RootPass123!",
      role: "ROOT",
      status: true,
    },
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "AdminPass123!",
      role: "ADMIN",
      status: true,
    },
    {
      name: "Employee User",
      email: "employee@example.com",
      password: "EmployeePass123!",
      role: "EMPLOYEE",
      status: true,
    },
  ];

  for (const userData of initialUsers) {
    const existing = await prisma.users.findUnique({ where: { email: userData.email } });
    if (existing) {
      console.log(`Usuario existente ignorado: ${userData.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.users.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
      },
    });

    console.log(`Usuario creado: ${userData.email} (${userData.role})`);
  }

  console.log("Seed de roles principales completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
