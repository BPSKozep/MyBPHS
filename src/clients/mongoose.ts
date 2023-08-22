import mongoose from "mongoose";

export default function mongooseConnect() {
    return mongoose.connect(process.env.MONGODB_URI as string, {
        dbName: process.env.MONGODB_DATABASE,
    });
}
