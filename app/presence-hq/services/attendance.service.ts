import { AttendanceModel } from "../models/attendance.model";
import type { AttendanceStatus } from "../models/attendance.model";

export interface AttendanceRecord {
  id: string;
  userId: string;
  username: string;
  email: string;
  date: string;
  photoUrl: string | null;
  photoFilename: string | null;
  status: AttendanceStatus;
  checkedInAt: string | null;
  notes: string | null;
  createdAt: string;
}

function toRecord(doc: any): AttendanceRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    username: doc.username,
    email: doc.email,
    date: doc.date,
    photoUrl: doc.photoUrl ?? null,
    photoFilename: doc.photoFilename ?? null,
    status: doc.status,
    checkedInAt: doc.checkedInAt ? (doc.checkedInAt as Date).toISOString() : null,
    notes: doc.notes ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export class AttendanceService {
  /** Employee submits a face photo for today */
  static async checkIn(params: {
    userId: string;
    username: string;
    email: string;
    date: string;
    photoUrl: string;
    photoFilename: string;
  }): Promise<AttendanceRecord> {
    const existing = await AttendanceModel.findOne({ userId: params.userId, date: params.date });
    if (existing) {
      existing.photoUrl = params.photoUrl;
      existing.photoFilename = params.photoFilename;
      existing.status = "valid";
      existing.checkedInAt = new Date();
      await existing.save();
      return toRecord(existing);
    }

    const record = await AttendanceModel.create({
      userId: params.userId,
      username: params.username,
      email: params.email,
      date: params.date,
      photoUrl: params.photoUrl,
      photoFilename: params.photoFilename,
      status: "valid",
      checkedInAt: new Date(),
    });
    return toRecord(record);
  }

  /** Get a single employee's attendance for today */
  static async getTodayRecord(userId: string, date: string): Promise<AttendanceRecord | null> {
    const doc = await AttendanceModel.findOne({ userId, date });
    return doc ? toRecord(doc) : null;
  }

  /** Get all attendance records for an employee */
  static async getByUser(userId: string, limit = 60): Promise<AttendanceRecord[]> {
    const docs = await AttendanceModel.find({ userId }).sort({ date: -1 }).limit(limit);
    return docs.map(toRecord);
  }

  /** HR: get all records for a date range */
  static async getAll(params: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<AttendanceRecord[]> {
    const query: any = {};
    if (params.userId) query.userId = params.userId;
    if (params.startDate || params.endDate) {
      query.date = {};
      if (params.startDate) query.date.$gte = params.startDate;
      if (params.endDate) query.date.$lte = params.endDate;
    }
    const docs = await AttendanceModel.find(query).sort({ date: -1, createdAt: -1 }).limit(500);
    return docs.map(toRecord);
  }

  /** HR: compute SLA compliance per employee for a period */
  static async getSlaCompliance(params: {
    startDate: string;
    endDate: string;
    slaThresholdPercent: number;
  }): Promise<
    Array<{
      userId: string;
      username: string;
      email: string;
      totalWorkdays: number;
      validDays: number;
      compliancePercent: number;
      slaStatus: "valid" | "flagged";
    }>
  > {
    const docs = await AttendanceModel.find({
      date: { $gte: params.startDate, $lte: params.endDate },
    });

    const userMap = new Map<
      string,
      { username: string; email: string; days: Set<string>; validDays: Set<string> }
    >();

    for (const doc of docs) {
      if (!userMap.has(doc.userId)) {
        userMap.set(doc.userId, {
          username: doc.username,
          email: doc.email,
          days: new Set(),
          validDays: new Set(),
        });
      }
      const entry = userMap.get(doc.userId)!;
      entry.days.add(doc.date);
      if (doc.status === "valid") entry.validDays.add(doc.date);
    }

    const totalWorkdays = countWorkdays(params.startDate, params.endDate);

    return Array.from(userMap.entries()).map(([userId, data]) => {
      const validDays = data.validDays.size;
      const compliancePercent =
        totalWorkdays > 0 ? Math.round((validDays / totalWorkdays) * 100) : 0;
      return {
        userId,
        username: data.username,
        email: data.email,
        totalWorkdays,
        validDays,
        compliancePercent,
        slaStatus: compliancePercent >= params.slaThresholdPercent ? "valid" : "flagged",
      };
    });
  }
}

/** Count Mon-Fri weekdays between two ISO date strings (inclusive) */
function countWorkdays(startDate: string, endDate: string): number {
  let count = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
