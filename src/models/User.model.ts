import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    roles: string[];
    groups: Types.ObjectId[];
    nfcId: string;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    roles: {
        type: [String],
        required: true,
    },
    groups: {
        type: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    },
    nfcId: {
        type: String,
        required: true,
    },
});

const User: Model<IUser> = mongoose.models.User || model("User", userSchema);

export default User;
