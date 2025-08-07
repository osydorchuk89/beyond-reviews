"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRouter = void 0;
const express_1 = require("express");
const messagesController_1 = require("../controllers/messagesController");
exports.messagesRouter = (0, express_1.Router)();
// get all user messages
exports.messagesRouter.get("/", messagesController_1.getUserMessages);
// post a message
exports.messagesRouter.post("/", messagesController_1.postMessage);
// mark a message as read
exports.messagesRouter.put("/:messageId", messagesController_1.markMessageAsRead);
