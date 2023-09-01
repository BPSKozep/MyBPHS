import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IGroup {
    _id: Types.ObjectId;
    name: string;
    timetable: (string | null)[][];
    priority: number;
}

const groupSchema = new Schema<IGroup>({
    name: {
        type: String,
        required: true,
    },
    timetable: {
        type: [[String]],
        required: true,
    },
    priority: {
        type: Number,
        required: true,
    },
});

groupSchema.virtual("overrides", {
    ref: "GroupOverride",
    localField: "_id",
    foreignField: "group",
});

const Group: Model<IGroup> =
    mongoose.models.Group || model("Group", groupSchema);

export default Group;
