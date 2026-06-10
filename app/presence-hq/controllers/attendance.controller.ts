import type { Request, Response } from "express";
import { AttendanceService } from "../services/attendance.service";

/** POST /api/presence-hq/attendance/check-in — Employee checks in */
export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { photoUrl, photoFilename, date } = req.body as {
      photoUrl?: string;
      photoFilename?: string;
      date?: string;
    };

    if (!photoUrl) {
      res.status(400).json({ success: false, message: "photoUrl is required" });
      return;
    }

    const today = date ?? new Date().toISOString().split("T")[0];
    const record = await AttendanceService.checkIn({
      userId: user.id,
      username: user.username,
      email: user.email,
      date: today,
      photoUrl,
      photoFilename: photoFilename ?? "face-photo.jpg",
    });

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
  }
}

/** GET /api/presence-hq/attendance/today — Employee's own today status */
export async function getTodayStatus(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const record = await AttendanceService.getTodayRecord(user.id, today);
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** GET /api/presence-hq/attendance/my — Employee's own history */
export async function getMyAttendance(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    const records = await AttendanceService.getByUser(user.id);
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** GET /api/presence-hq/attendance — HR: get all attendance with optional filters */
export async function getAllAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, userId } = req.query as Record<string, string>;
    const records = await AttendanceService.getAll({ startDate, endDate, userId });
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** GET /api/presence-hq/attendance/sla — HR: SLA compliance dashboard */
export async function getSlaCompliance(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, threshold } = req.query as Record<string, string>;
    const today = new Date().toISOString().split("T")[0];
    const start30DaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

    const data = await AttendanceService.getSlaCompliance({
      startDate: startDate ?? start30DaysAgo,
      endDate: endDate ?? today,
      slaThresholdPercent: threshold ? parseInt(threshold) : 80,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
