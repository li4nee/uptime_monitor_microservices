import { createLogger, format } from "winston";
import LokiTransport from "winston-loki";
import winston from "winston";

function getCallerFileInfo() {
  const originalFunc = Error.prepareStackTrace;

  Error.prepareStackTrace = (_, stack) => stack;

  const err = new Error();
  const stack = err.stack as unknown as NodeJS.CallSite[];

  Error.prepareStackTrace = originalFunc;

  // Skip first few frames: current function, winston internals
  const caller = stack?.[10];

  const fileName = caller?.getFileName();
  const lineNumber = caller?.getLineNumber();

  return `${fileName}:${lineNumber}`;
}

const callerFormat = format((info) => {
  info.caller = getCallerFileInfo();
  return info;
});

const options = {
  defaultMeta: { service: "USER_SERVICE" },
  format: winston.format.combine(
    callerFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100",
      json: true,
      labels: { app: "USER_SERVICE" },
      interval: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        callerFormat(),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.prettyPrint(),
      ),
    }),
  ],
};
export const logger = createLogger(options);
