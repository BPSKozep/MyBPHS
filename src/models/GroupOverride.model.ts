import mongoose, { model, Schema, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IGroupOverride {
    _id: Types.ObjectId;
    group: Types.ObjectId;
    timetable: string[][];
    priority: number;
    override: boolean;
}

const groupOverrideSchema = new Schema<IGroupOverride>({
    group: {
        type: Schema.Types.ObjectId,
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
    override: {
        type: Boolean,
        required: true,
    },
});

const GroupOverride: Model<IGroupOverride> =
    mongoose.models.GroupOverride ||
    model("GroupOverride", groupOverrideSchema);

export default GroupOverride;
