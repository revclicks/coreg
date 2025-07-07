import { db } from "./db";
import { adminUsers } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

async function seedMasterAdmin() {
  try {
    console.log("Checking for existing master admin...");
    
    // Test database connection first
    try {
      await db.execute(sql`SELECT 1`);
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      throw new Error("database connection failed");
    }
    
    // First check if admin exists by email (more reliable than role check)
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, "admin@coreg.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Master admin already exists:", existingAdmin[0].email);
      return existingAdmin[0];
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
    // Handle duplicate key errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || 
          error.message.includes('unique constraint') ||
          error.message.includes('already exists')) {
        console.log("⚠️ Admin already exists (duplicate key), continuing...");
        
        // Try to fetch the existing admin
        try {
          const [existingAdmin] = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, "admin@coreg.com"))
            .limit(1);
          return existingAdmin;
        } catch (fetchError) {
          console.warn("Could not fetch existing admin, but continuing startup");
          return null;
        }
      }
    }
    
    // Log error but don't throw - allow server to continue starting
    console.warn("⚠️ Non-critical error during admin seeding:", error);
    console.log("Server will continue starting...");
    return null;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMasterAdmin()
    .then((result) => {
      if (result) {
        console.log("✅ Seeding complete - Admin available");
      } else {
        console.log("⚠️ Seeding completed with warnings - Check logs above");
      }
      process.exit(0);
    })
    .catch((error) => {
      // Only exit with error code for critical failures
      if (error.message && error.message.includes('database connection')) {
        console.error("❌ Critical database error - cannot continue:", error);
        process.exit(1);
      } else {
        console.warn("⚠️ Seeding completed with non-critical errors:", error);
        console.log("Application can continue running");
        process.exit(0);
      }
    });
}

export { seedMasterAdmin };