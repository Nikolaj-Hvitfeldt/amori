import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
  });

  // Listen on all interfaces (0.0.0.0) so mobile devices can connect
  await app.listen(3000, "0.0.0.0");
  console.log("Backend is running on http://0.0.0.0:3000");
  console.log("Also accessible at http://172.20.10.3:3000");
}
bootstrap();
