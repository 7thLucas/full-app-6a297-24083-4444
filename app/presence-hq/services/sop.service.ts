import { SopModel } from "../models/sop.model";
import type { SopStatus } from "../models/sop.model";

export interface SopRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  filename: string;
  mimeType: string | null;
  fileSize: number;
  status: SopStatus;
  uploadedBy: string;
  publishedAt: string | null;
  createdAt: string;
}

function toRecord(doc: any): SopRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? "",
    category: doc.category ?? "",
    fileUrl: doc.fileUrl,
    filename: doc.filename,
    mimeType: doc.mimeType ?? null,
    fileSize: doc.fileSize ?? 0,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    publishedAt: doc.publishedAt ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export class SopService {
  static async create(params: {
    title: string;
    description?: string;
    category?: string;
    fileUrl: string;
    filename: string;
    mimeType?: string;
    fileSize?: number;
    uploadedBy: string;
  }): Promise<SopRecord> {
    const doc = await SopModel.create({
      title: params.title,
      description: params.description ?? "",
      category: params.category ?? "",
      fileUrl: params.fileUrl,
      filename: params.filename,
      mimeType: params.mimeType ?? null,
      fileSize: params.fileSize ?? 0,
      status: "draft",
      uploadedBy: params.uploadedBy,
    });
    return toRecord(doc);
  }

  static async publish(sopId: string): Promise<SopRecord> {
    const doc = await SopModel.findByIdAndUpdate(
      sopId,
      { status: "published", publishedAt: new Date().toISOString() },
      { new: true }
    );
    if (!doc) throw Object.assign(new Error("SOP not found"), { statusCode: 404 });
    return toRecord(doc);
  }

  static async unpublish(sopId: string): Promise<SopRecord> {
    const doc = await SopModel.findByIdAndUpdate(
      sopId,
      { status: "draft", publishedAt: null },
      { new: true }
    );
    if (!doc) throw Object.assign(new Error("SOP not found"), { statusCode: 404 });
    return toRecord(doc);
  }

  static async delete(sopId: string): Promise<void> {
    await SopModel.findByIdAndDelete(sopId);
  }

  static async getAll(): Promise<SopRecord[]> {
    const docs = await SopModel.find().sort({ createdAt: -1 });
    return docs.map(toRecord);
  }

  static async getPublished(): Promise<SopRecord[]> {
    const docs = await SopModel.find({ status: "published" }).sort({ createdAt: -1 });
    return docs.map(toRecord);
  }

  static async getById(sopId: string): Promise<SopRecord | null> {
    const doc = await SopModel.findById(sopId);
    return doc ? toRecord(doc) : null;
  }
}
