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
  });

  // Listen on all interfaces (0.0.0.0) so mobile devices can connect
  await app.listen(3000, "0.0.0.0");
  console.log("Backend is running on http://0.0.0.0:3000");
  console.log("Also accessible at http://172.20.10.3:3000");
  console.log("Body size limit set to 20MB");
}
bootstrap();
