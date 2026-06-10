import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export type SopStatus = "draft" | "published";

@modelOptions({
  schemaOptions: {
    collection: "tbl_sops",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Sop extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  title!: string;

  @prop({ type: String, required: false, default: "" })
  description!: string;

  @prop({ type: String, required: false, default: "" })
  category!: string;

  /** URL path to the uploaded document */
  @prop({ type: String, required: true })
  fileUrl!: string;

  @prop({ type: String, required: true })
  filename!: string;

  @prop({ type: String, required: false, default: null })
  mimeType!: string | null;

  @prop({ type: Number, required: false, default: 0 })
  fileSize!: number;

  @prop({ type: String, enum: ["draft", "published"], default: "draft" })
  status!: SopStatus;

  /** User ID of the HR who uploaded */
  @prop({ type: String, required: true })
  uploadedBy!: string;

  @prop({ type: String, required: false, default: null })
  publishedAt!: string | null;
}

export const SopModel = getModelForClass(Sop);
