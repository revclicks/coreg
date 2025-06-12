import { db } from "./db";
import { adminUsers } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedMasterAdmin() {
  try {
    console.log("Checking for existing master admin...");
    
    const existingMaster = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.role, "master_admin"))
      .limit(1);

    if (existingMaster.length > 0) {
      console.log("Master admin already exists:", existingMaster[0].email);
      return existingMaster[0];
    }

    console.log("Creating master admin account...");
    
    const masterEmail = "admin@coreg.com";
    const masterPassword = "CoReg2024!";
    const hashedPassword = await bcrypt.hash(masterPassword, 12);

    const [masterAdmin] = await db
      .insert(adminUsers)
      .values({
        email: masterEmail,
        passwordHash: hashedPassword,
        firstName: "Master",
        lastName: "Admin",
        role: "master_admin",
        active: true,
      })
      .returning();

    console.log("✅ Master admin created successfully!");
    console.log("📧 Email:", masterEmail);
    console.log("🔐 Password:", masterPassword);
    console.log("⚠️  Please change the password after first login");
    
    return masterAdmin;
  } catch (error) {
    console.error("❌ Error creating master admin:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMasterAdmin()
    .then(() => {
      console.log("Seeding complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export { seedMasterAdmin };