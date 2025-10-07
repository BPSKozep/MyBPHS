import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface ILaptopLogin {
    _id?: Types.ObjectId;
    date: Date;
    user: string;
    number: number;
}

const laptopLoginSchema = new Schema<ILaptopLogin>({
    date: { type: Date, required: true, index: true },
    user: { type: String, required: true },
    number: { type: Number, required: true },
});

const LaptopLogin: Model<ILaptopLogin> =
    mongoose.models.LaptopLogin ?? model("LaptopLogin", laptopLoginSchema);

export default LaptopLogin;
