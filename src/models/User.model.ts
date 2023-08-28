import mongoose, { model, Schema } from "mongoose";
import type { Model } from "mongoose";

export interface IUser {
    name: string;
    email: string;
    roles: string[];
    groups: Schema.Types.ObjectId[];
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
});

const User: Model<IUser> = mongoose.models.User || model("User", userSchema);

export default User;