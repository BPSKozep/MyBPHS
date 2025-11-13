import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IKiosk {
  _id?: Types.ObjectId;
  date: Date;
  options: Map<string, number>;
}

const kioskSchema = new Schema<IKiosk>({
  date: { type: Date, required: true, index: true },
  options: { type: Map, of: Number, required: true },
});

const Kiosk: Model<IKiosk> =
  mongoose.models.Kiosk ?? model("Kiosk", kioskSchema);

export default Kiosk;
