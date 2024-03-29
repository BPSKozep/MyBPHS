import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IMenu {
    _id: Types.ObjectId;
    options: { [key: string]: string }[];
    week: number;
    year: number;
}

const menuSchema = new Schema<IMenu>({
    options: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true },
        },
    ],
    week: { type: Number, required: true },
    year: { type: Number, required: true },
});

const Menu: Model<IMenu> = mongoose.models.Menu || model("Menu", menuSchema);

export default Menu;
