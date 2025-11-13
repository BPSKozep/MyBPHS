import type { Model, Types } from "mongoose";
import mongoose, { model, Schema } from "mongoose";

export interface IMenu {
  _id?: Types.ObjectId;
  options: Record<string, string>[];
  week: number;
  year: number;
  isOpenForOrders: boolean;
}

const menuSchema = new Schema<IMenu>({
  options: [{ type: Object, of: String, required: true }],
  week: { type: Number, required: true, index: true },
  year: { type: Number, required: true, index: true },
  isOpenForOrders: { type: Boolean, default: true },
});

const Menu: Model<IMenu> = mongoose.models.Menu ?? model("Menu", menuSchema);

export default Menu;
