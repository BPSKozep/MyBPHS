import mongoose from "mongoose";

export default async function mongooseConnect() {
    return await mongoose.connect(process.env.MONGODB_URI as string, {
        dbName: process.env.MONGODB_DATABASE,
    });
}
