import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";
import { API_SCOPE_IDS, type ApiScope } from "@/lib/apiKeys/scopes";

export interface IApiKey {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  keyId: string;
  secretHash: string;
  scopes: ApiScope[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
  lastUsedAt?: Date;
  lastUsedIp?: string;
}

const apiKeySchema = new Schema<IApiKey>({
  name: { type: String, required: true },
  description: { type: String, required: false },
  keyId: { type: String, required: true, unique: true },
  secretHash: { type: String, required: true },
  scopes: { type: [String], enum: API_SCOPE_IDS, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: false },
  revokedAt: { type: Date, required: false },
  revokedBy: { type: String, required: false },
  lastUsedAt: { type: Date, required: false },
  lastUsedIp: { type: String, required: false },
});

const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey ?? model<IApiKey>("ApiKey", apiKeySchema);

export default ApiKey;
