import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IOpenDayRegistration {
  _id?: Types.ObjectId;
  openDayId: Types.ObjectId;
  contactName: string;
  contactEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  selectedClassIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const OpenDayRegistrationSchema = new Schema<IOpenDayRegistration>(
  {
    openDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OpenDay",
      required: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    selectedClassIds: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    collection: "openday-registrations",
    timestamps: true,
  },
);

const OpenDayRegistration: Model<IOpenDayRegistration> =
  mongoose.models.OpenDayRegistration ??
  model<IOpenDayRegistration>("OpenDayRegistration", OpenDayRegistrationSchema);

export default OpenDayRegistration;
