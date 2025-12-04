import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { json, urlencoded, Request, Response } from "express";
import {
  SERVER_CONFIG,
  BODY_PARSER_LIMIT,
  CORS_CONFIG,
} from "./constants/app.constants";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser so we can configure it ourselves
  });

  app.use(json({ limit: BODY_PARSER_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_PARSER_LIMIT }));

  app.enableCors(CORS_CONFIG);

  // Handle root route and favicon requests to avoid 404 errors in logs
  app.getHttpAdapter().get("/", (req: Request, res: Response) => {
    res.json({
      message: "Amori API",
      version: "1.0.0",
      endpoints: {
        moments: "/moments",
        dates: "/dates",
        milestones: "/milestones",
      },
    });
  });

  // Handle favicon requests (browsers automatically request this)
  app.getHttpAdapter().get("/favicon.ico", (req: Request, res: Response) => {
    res.status(204).send(); // No Content
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Listen on all interfaces so mobile devices can connect
  await app.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST);

  // Get local IP for mobile connection
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();
  let localIP = "localhost";
  for (const name of Object.keys(networkInterfaces)) {
    for (const iface of networkInterfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== "localhost") break;
  }

  console.log(
    `Backend is running on http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`
  );
  console.log(`Also accessible at http://${localIP}:${SERVER_CONFIG.PORT}`);
  console.log(
    `\n📱 For mobile connection, update frontend/src/services/api.ts with: http://${localIP}:${SERVER_CONFIG.PORT}`
  );
}
bootstrap();
