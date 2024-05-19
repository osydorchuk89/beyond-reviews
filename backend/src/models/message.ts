import { Schema, model, Types } from "mongoose";

export interface IMessage {
    sender: Types.ObjectId;
    recipient: Types.ObjectId;
    text: string;
    date: Date;
    seen: boolean;
    read: boolean;
}

const messageSchema = new Schema<IMessage>({
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
    text: String,
    date: Date,
    seen: Boolean,
    read: Boolean,
});

export const Message = model<IMessage>("Message", messageSchema);
