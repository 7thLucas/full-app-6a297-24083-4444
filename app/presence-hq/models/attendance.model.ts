import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export type AttendanceStatus = "valid" | "flagged" | "pending";

@modelOptions({
  schemaOptions: {
    collection: "tbl_attendance",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
})
export class Attendance extends CommonTypegooseEntity {
  @prop({ type: String, required: true, index: true })
  userId!: string;

  @prop({ type: String, required: true })
  username!: string;

  @prop({ type: String, required: true })
  email!: string;

  /** ISO date string: YYYY-MM-DD */
  @prop({ type: String, required: true, index: true })
  date!: string;

  /** Stored URL path returned from the uploader */
  @prop({ type: String, required: false, default: null })
  photoUrl!: string | null;

  /** Original filename */
  @prop({ type: String, required: false, default: null })
  photoFilename!: string | null;

  @prop({ type: String, enum: ["valid", "flagged", "pending"], default: "pending" })
  status!: AttendanceStatus;

  /** Timestamp when the check-in photo was submitted */
  @prop({ type: Date, required: false, default: null })
  checkedInAt!: Date | null;

  @prop({ type: String, required: false, default: null })
  notes!: string | null;
}

export const AttendanceModel = getModelForClass(Attendance);
