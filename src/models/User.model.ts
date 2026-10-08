import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IUserScim {
  /** Entra ID object id (SCIM `externalId`). */
  externalId?: string;
  /** `userName` as sent by Entra (usually the UPN). */
  userName?: string;
  givenName?: string;
  familyName?: string;
  displayName?: string;
  lastSyncedAt?: Date;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  roles: string[];
  groups: Types.ObjectId[];
  nfcId?: string;
  joinDate?: Date;
  laptopPasswordChanged?: Date;
  disabled?: boolean;
  scim?: IUserScim;
}

const userScimSchema = new Schema<IUserScim>(
  {
    externalId: { type: String, required: false },
    userName: { type: String, required: false },
    givenName: { type: String, required: false },
    familyName: { type: String, required: false },
    displayName: { type: String, required: false },
    lastSyncedAt: { type: Date, required: false },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  roles: {
    type: [String],
    required: true,
  },
  groups: {
    type: [{ type: Schema.Types.ObjectId, ref: "Group" }],
  },
  nfcId: {
    type: String,
    required: false,
    index: true,
    sparse: true,
  },
  joinDate: {
    type: Date,
    required: false,
  },
  laptopPasswordChanged: {
    type: Date,
    required: false,
  },
  disabled: {
    type: Boolean,
    required: false,
  },
  scim: {
    type: userScimSchema,
    required: false,
  },
});

// Unique only among users that actually have a string externalId, so existing
// users without one (or with a null value) never collide.
userSchema.index(
  { "scim.externalId": 1 },
  {
    unique: true,
    partialFilterExpression: { "scim.externalId": { $type: "string" } },
  },
);

const User: Model<IUser> = mongoose.models.User ?? model("User", userSchema);

export default User;
