"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    text: String,
    date: Date,
    seen: Boolean,
    read: Boolean,
});
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
