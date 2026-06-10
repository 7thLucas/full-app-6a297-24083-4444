import type { Request, Response } from "express";
import { SopService } from "../services/sop.service";
import { UserRole } from "~/modules/authentication/authentication.types";

/** GET /api/presence-hq/sops — HR: all SOPs; Employee: published only */
export async function listSops(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const isAdmin = user?.role === UserRole.Admin;
    const sops = isAdmin
      ? await SopService.getAll()
      : await SopService.getPublished();
    res.json({ success: true, data: sops });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/presence-hq/sops — HR: upload a new SOP */
export async function createSop(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.Admin) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }

    const { title, description, category, fileUrl, filename, mimeType, fileSize } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      fileUrl?: string;
      filename?: string;
      mimeType?: string;
      fileSize?: number;
    };

    if (!title || !fileUrl || !filename) {
      res.status(400).json({ success: false, message: "title, fileUrl, and filename are required" });
      return;
    }

    const sop = await SopService.create({
      title,
      description,
      category,
      fileUrl,
      filename,
      mimeType,
      fileSize,
      uploadedBy: user.id,
    });

    res.status(201).json({ success: true, data: sop });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
  }
}

/** POST /api/presence-hq/sops/:sopId/publish — HR: publish a SOP */
export async function publishSop(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.Admin) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    const sopId = String(req.params.sopId);
    const sop = await SopService.publish(sopId);
    res.json({ success: true, data: sop });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
  }
}

/** POST /api/presence-hq/sops/:sopId/unpublish — HR: unpublish a SOP */
export async function unpublishSop(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.Admin) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    const sopId = String(req.params.sopId);
    const sop = await SopService.unpublish(sopId);
    res.json({ success: true, data: sop });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
  }
}

/** DELETE /api/presence-hq/sops/:sopId — HR: delete a SOP */
export async function deleteSop(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user || user.role !== UserRole.Admin) {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }
    const sopId = String(req.params.sopId);
    await SopService.delete(sopId);
    res.json({ success: true, message: "SOP deleted" });
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ success: false, message: err.message });
  }
}

/** GET /api/presence-hq/sops/:sopId — Get a single SOP */
export async function getSop(req: Request, res: Response): Promise<void> {
  try {
    const sopId = String(req.params.sopId);
    const sop = await SopService.getById(sopId);
    if (!sop) {
      res.status(404).json({ success: false, message: "SOP not found" });
      return;
    }
    res.json({ success: true, data: sop });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
