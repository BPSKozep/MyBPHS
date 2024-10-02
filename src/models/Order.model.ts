import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IOrder {
    _id?: Types.ObjectId;
    user: mongoose.Types.ObjectId;
    menu: mongoose.Types.ObjectId;
    order: { chosen: string; completed: boolean }[];
}

const OrderSchema = new Schema<IOrder>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
        required: true,
    },
    menu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        index: true,
        required: true,
    },
    order: [
        {
            chosen: {
                type: String,
                required: true,
            },
            completed: {
                type: Boolean,
                required: true,
            },
        },
    ],
});

const Order: Model<IOrder> =
    mongoose.models.Order || model<IOrder>("Order", OrderSchema);

export default Order;
