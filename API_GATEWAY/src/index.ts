import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import morgan from "morgan";
import { IncomingMessage } from "http";
import { GlobalSettings } from "./globalSettings";
import { authenticate } from "./middleware/authenticate";
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
app.use(cookieParser());
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });

morgan.token("client-ip", (req: IncomingMessage): string => {
  const expressReq = req as Request;
  const ip = expressReq.header?.("x-forwarded-for") || expressReq.socket?.remoteAddress;
  return ip || "";
});

app.use(
  morgan(':client-ip ":method :url" :status :response-time ms - UA: :user-agent', {
    stream: accessLogStream,
  }),
);

app.use((req:Request,res:Response,next:NextFunction)=>{
  console.log("HIT")
  next()
})

app.use(
  "/user",
  createProxyMiddleware({
    target: "http://user-service:3001",
    changeOrigin: true,
    pathRewrite: { "^/user": "" },
  }),
);

app.use(
  "/monitor",
  authenticate,
  createProxyMiddleware({
    target: "http://monitor-service:3002",
    changeOrigin: true,
    pathRewrite: { "^/monitor": "" },
  }),
);

app.listen(GlobalSettings.port, () => {
  console.log("API Gateway listening on port", GlobalSettings.port);
});
