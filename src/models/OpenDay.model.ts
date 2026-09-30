import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IOpenDayClass {
  id: string;
  startTime: Date;
  endTime: Date;
  title: string;
  capacity: number;
  description: string;
}

export interface IOpenDay {
  _id?: Types.ObjectId;
  date: Date;
  isPublished?: boolean;
  classes: IOpenDayClass[];
}

const OpenDayClassSchema = new Schema<IOpenDayClass>(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    title: { type: String, required: true },
    capacity: { type: Number, required: true },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const OpenDaySchema = new Schema<IOpenDay>(
  {
    date: { type: Date, required: true, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    classes: [OpenDayClassSchema],
  },
  {
    timestamps: true,
  },
);

const OpenDay: Model<IOpenDay> =
  mongoose.models.OpenDay ?? model<IOpenDay>("OpenDay", OpenDaySchema);

export default OpenDay;
