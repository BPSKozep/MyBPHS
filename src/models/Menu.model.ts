import mongoose, { model, Schema } from "mongoose";
import type { Model } from "mongoose";

export interface IMenu {
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
    week: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true },
});

const Menu: Model<IMenu> = mongoose.models.Menu || model("Menu", menuSchema);

export default Menu;
