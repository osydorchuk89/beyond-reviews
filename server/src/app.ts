import "dotenv/config";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { MulterError } from "multer";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import bodyParser from "body-parser";

import { moviesRouter } from "./routes/movies.js";
import { booksRouter } from "./routes/books.js";
import { usersRouter } from "./routes/users.js";
import { messagesRouter } from "./routes/messages.js";
import { authRouter } from "./routes/auth.js";
import { auth } from "./config/auth.js";
import { resolveAuthUser } from "./lib/auth-http.js";
import { BASE_CLIENT_URL } from "./config/constants.js";

const app = express();

const corsOptions = {
    origin: BASE_CLIENT_URL,
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Better Auth must receive the unconsumed request stream.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.set("trust proxy", 1);
app.use(resolveAuthUser(auth));

app.use("/api/movies", moviesRouter);
app.use("/api/books", booksRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", messagesRouter);
app.use("/auth", authRouter);

app.get("/", (_req, res) => {
    res.send("Hello World!!!");
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).send({
            message: "Photo size should not exceed 5MB",
        });
        return;
    }

    if (
        err instanceof Error &&
        err.message === "Only jpg, jpeg, png, or webp formats are accepted"
    ) {
        res.status(400).send({
            message: err.message,
        });
        return;
    }

    res.status(500).send({
        message: err instanceof Error ? err.message : "Internal server error",
    });
    return;
});

export { app };
