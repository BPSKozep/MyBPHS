import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export type TokenRequestStatus = "PENDING" | "COMPLETED";

export interface ITokenRequest {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  status: TokenRequestStatus;
  /** Price in HUF at the time of the request. */
  price: number;
  createdAt: Date;
  completedAt?: Date;
}

const tokenRequestSchema = new Schema<ITokenRequest>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED"],
    default: "PENDING",
    index: true,
    required: true,
  },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  completedAt: { type: Date, required: false },
});

const TokenRequest: Model<ITokenRequest> =
  mongoose.models.TokenRequest ??
  model<ITokenRequest>("TokenRequest", tokenRequestSchema);

export default TokenRequest;
