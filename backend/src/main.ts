import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Tambahkan baris ini tepat sebelum app.listen()
  app.enableCors({
    origin: ['https://tarakan-art-class-5012ersix-adhis-projects-8be2924d.vercel.app', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();