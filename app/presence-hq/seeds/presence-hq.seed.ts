import bcrypt from "bcryptjs";
import { createLogger } from "~/lib/logger";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";
import { AttendanceModel } from "../models/attendance.model";
import { SopModel } from "../models/sop.model";

const logger = createLogger("PresenceHQSeed");

/**
 * Seeds demo employee accounts and sample attendance/SOP data.
 * Idempotent: skips if data already exists.
 */
export async function seedPresenceHQ(): Promise<void> {
  try {
    const existingEmployee = await UserModel.findOne({ email: "alice@example.com" });
    if (existingEmployee) {
      logger.info("PresenceHQ demo data already exists, skipping.");
      return;
    }

    // Create demo employees
    const demoEmployees = [
      { username: "alice_hr_emp", email: "alice@example.com", displayName: "Alice Johnson" },
      { username: "bob_hr_emp", email: "bob@example.com", displayName: "Bob Smith" },
      { username: "carol_hr_emp", email: "carol@example.com", displayName: "Carol White" },
    ];

    const password_hash = await bcrypt.hash("Employee123!", 12);
    const createdUsers = [];

    for (const emp of demoEmployees) {
      const user = await UserModel.create({
        username: emp.username,
        email: emp.email,
        password_hash,
        role: UserRole.Authenticated,
        is_active: true,
        email_verified: true,
        profile: { displayName: emp.displayName, department: "Operations" },
      });
      createdUsers.push(user);
    }

    // Seed attendance records for the past 20 weekdays
    const today = new Date();
    const weekdays: string[] = [];
    const d = new Date(today);
    while (weekdays.length < 20) {
      d.setDate(d.getDate() - 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        weekdays.push(d.toISOString().split("T")[0]);
      }
    }

    for (const user of createdUsers) {
      // Simulate ~85% attendance
      for (const date of weekdays) {
        const attended = Math.random() > 0.15;
        if (attended) {
          await AttendanceModel.create({
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            date,
            photoUrl: null,
            photoFilename: null,
            status: "valid",
            checkedInAt: new Date(`${date}T09:00:00.000Z`),
          });
        }
      }
    }

    // Seed a sample SOP document
    const existingSop = await SopModel.findOne({ title: "Employee Code of Conduct" });
    if (!existingSop) {
      const adminUser = await UserModel.findOne({ role: UserRole.Admin });
      if (adminUser) {
        await SopModel.create({
          title: "Employee Code of Conduct",
          description: "This document outlines the expected behavior and standards for all employees.",
          category: "HR Policy",
          fileUrl: "#",
          filename: "employee-code-of-conduct.pdf",
          mimeType: "application/pdf",
          fileSize: 0,
          status: "published",
          uploadedBy: adminUser._id.toString(),
          publishedAt: new Date().toISOString(),
        });
        await SopModel.create({
          title: "Attendance & Leave Policy",
          description: "Rules and guidelines for attendance, check-in procedures, and leave requests.",
          category: "HR Policy",
          fileUrl: "#",
          filename: "attendance-leave-policy.pdf",
          mimeType: "application/pdf",
          fileSize: 0,
          status: "published",
          uploadedBy: adminUser._id.toString(),
          publishedAt: new Date().toISOString(),
        });
        await SopModel.create({
          title: "Remote Work Guidelines",
          description: "Best practices and requirements for employees working remotely.",
          category: "Operations",
          fileUrl: "#",
          filename: "remote-work-guidelines.pdf",
          mimeType: "application/pdf",
          fileSize: 0,
          status: "draft",
          uploadedBy: adminUser._id.toString(),
          publishedAt: null,
        });
      }
    }

    logger.info("PresenceHQ demo data seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed PresenceHQ demo data:", error);
  }
}
