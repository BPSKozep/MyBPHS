import mongoose from "mongoose";
import { env } from "@/env/server";

export default function mongooseConnect() {
    return mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DATABASE,
    });
}
