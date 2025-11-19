import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser so we can configure it ourselves
  });

  // Increase body size limit to 20MB for image uploads
  // Default is 100KB which is too small for photos
  app.use(json({ limit: "20mb" }));
  app.use(urlencoded({ extended: true, limit: "20mb" }));

  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Length", "Content-Type"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Listen on all interfaces (0.0.0.0) so mobile devices can connect
  await app.listen(3000, "0.0.0.0");
  
  // Get local IP for mobile connection
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(networkInterfaces)) {
    for (const iface of networkInterfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log("Backend is running on http://0.0.0.0:3000");
  console.log(`Also accessible at http://${localIP}:3000`);
  console.log("Body size limit set to 20MB");
  console.log(`\n📱 For mobile connection, update frontend/src/services/api.ts with: http://${localIP}:3000`);
}
bootstrap();
