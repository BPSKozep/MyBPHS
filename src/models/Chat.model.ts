import mongoose, { model, Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IMessage {
    role: string;
    content: string | object;
}

export interface IChat {
    _id?: Types.ObjectId;
    user: mongoose.Types.ObjectId;
    messages: { role: string; content: string | object }[];
}

const messageSchema = new Schema<IMessage>(
    {
        role: {
            type: String,
            required: true,
        },
        content: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    { _id: false },
);

const chatSchema = new Schema<IChat>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messages: [messageSchema],
    },
    { timestamps: true },
);

const Chat: Model<IChat> = mongoose.models.Chat ?? model("Chat", chatSchema);

export default Chat;
