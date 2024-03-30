import mongoose, { model, Schema } from "mongoose";
import type { Model } from "mongoose";

export interface IGroup {
    name: string;
    timetable: (string | null)[][];
    priority: number;
    override: boolean;
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
    override: {
        type: Boolean,
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
