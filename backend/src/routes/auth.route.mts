import { ExpressAuth } from "@auth/express";
import Google from "@auth/express/providers/google";
import express from "express";

const app = express();

// If app is served through a proxy
// trust the proxy to allow HTTPS protocol to be detected
app.use("trust proxy");
app.use("/auth/*", ExpressAuth({ providers: [Google] }));
