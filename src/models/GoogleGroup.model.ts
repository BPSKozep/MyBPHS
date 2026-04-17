import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IGoogleGroupMember {
  name: string;
  email: string;
  joinDate?: string;
}

export interface IGoogleGroup {
  _id?: Types.ObjectId;
  group: string;
  receivedAt: Date;
  memberCount: number;
  members: IGoogleGroupMember[];
  appliedAt?: Date;
  appliedCount?: number;
  applyError?: string;
}

const googleGroupMemberSchema = new Schema<IGoogleGroupMember>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    joinDate: { type: String, required: false },
  },
  { _id: false },
);

const googleGroupSchema = new Schema<IGoogleGroup>({
  group: { type: String, required: true, index: true },
  receivedAt: { type: Date, required: true, default: () => new Date() },
  memberCount: { type: Number, required: true },
  members: { type: [googleGroupMemberSchema], required: true },
  appliedAt: { type: Date, required: false },
  appliedCount: { type: Number, required: false },
  applyError: { type: String, required: false },
});

const GoogleGroup: Model<IGoogleGroup> =
  mongoose.models.GoogleGroup ?? model("GoogleGroup", googleGroupSchema);

export default GoogleGroup;
