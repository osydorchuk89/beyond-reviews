import { Router } from "express";

import {
    getUserMessages,
    markMessageAsRead,
    postMessage,
} from "../controllers/messagesController.js";

export const messagesRouter = Router();

// get all user messages
messagesRouter.get("/", getUserMessages);

// post a message
messagesRouter.post("/", postMessage);

// mark a message as read
messagesRouter.put("/:messageId", markMessageAsRead);
