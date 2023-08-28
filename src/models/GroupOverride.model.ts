import mongoose, { model, Schema, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IGroupOverride {
    group: Schema.Types.ObjectId;
    timetable: string[][];
    priority: number;
}

const groupOverrideSchema = new Schema<IGroupOverride>({
    group: {
        type: Types.ObjectId,
        ref: "Group",
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

const GroupOverride: Model<IGroupOverride> =
    mongoose.models.GroupOverride ||
    model("GroupOverride", groupOverrideSchema);

export default GroupOverride;
