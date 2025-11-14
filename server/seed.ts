import { db } from "./db";
import { users, employees, departments } from "@shared/schema1";

async function seed() {
  console.log("Seeding database...");

  // Create a test department
  const [department] = await db.insert(departments).values({
    name: "Human Resources",
    code: "HR",
  }).returning();

  console.log("Created department:", department);

  // Create test users
  const testUsers = [
    {
      id: "officer-1",
      email: "officer@example.com",
      firstName: "John",
      surname: "Doe",
      nationalId: "12345678901",
      phoneNumber: "+254712345678",
      passwordHash: "hashed_password",
      role: "officer" as const,
    },
    {
      id: "reviewer-1",
      email: "reviewer@example.com",
      firstName: "Jane",
      surname: "Smith",
      nationalId: "12345678902",
      phoneNumber: "+254712345679",
      passwordHash: "hashed_password",
      role: "reviewer" as const,
    },
    {
      id: "admin-1",
      email: "admin@example.com",
      firstName: "Admin",
      surname: "User",
      nationalId: "12345678903",
      phoneNumber: "+254712345680",
      passwordHash: "hashed_password",
      role: "admin" as const,
    },
  ];

  for (const user of testUsers) {
    const [createdUser] = await db.insert(users).values(user).onConflictDoNothing().returning();
    console.log("Created user:", createdUser?.email || "skipped (already exists)");

    // Create employee record for officers
    if (user.role === "officer" && createdUser) {
      const [employee] = await db.insert(employees).values({
        userId: createdUser.id,
        personalNumber: `EMP-${Date.now()}`,
        designation: "Senior Officer",
        dutyStation: "Nairobi Headquarters",
        jg: "M",
        departmentId: department.id,
      }).onConflictDoNothing().returning();
      
      console.log("Created employee:", employee?.personalNumber || "skipped (already exists)");
    }
  }

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
