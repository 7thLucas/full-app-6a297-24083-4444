import { Router } from "express";
import { requireAuth, requireAdmin } from "~/modules/authentication/authentication.middleware";
import {
  checkIn,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  getSlaCompliance,
} from "../controllers/attendance.controller";
import {
  listSops,
  createSop,
  publishSop,
  unpublishSop,
  deleteSop,
  getSop,
} from "../controllers/sop.controller";

const router = Router();

// ─── Attendance ────────────────────────────────────────────────────────────────
router.post("/presence-hq/attendance/check-in", requireAuth, checkIn);
router.get("/presence-hq/attendance/today", requireAuth, getTodayStatus);
router.get("/presence-hq/attendance/my", requireAuth, getMyAttendance);
router.get("/presence-hq/attendance/sla", requireAdmin, getSlaCompliance);
router.get("/presence-hq/attendance", requireAdmin, getAllAttendance);

// ─── SOPs ──────────────────────────────────────────────────────────────────────
router.get("/presence-hq/sops", requireAuth, listSops);
router.post("/presence-hq/sops", requireAdmin, createSop);
router.post("/presence-hq/sops/:sopId/publish", requireAdmin, publishSop);
router.post("/presence-hq/sops/:sopId/unpublish", requireAdmin, unpublishSop);
router.delete("/presence-hq/sops/:sopId", requireAdmin, deleteSop);
router.get("/presence-hq/sops/:sopId", requireAuth, getSop);

export default router;
