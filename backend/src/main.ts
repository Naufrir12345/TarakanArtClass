import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { execSync } from 'child_process';

async function bootstrap() {
  try {
    console.log('Syncing database schema via Prisma...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Database schema synced successfully.');
  } catch (err: any) {
    console.error('Prisma db push warning:', err?.message || err);
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tarakan-art-class-5012ersix-adhis-projects-8be2924d.vercel.app',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Match localhost, 127.0.0.1, and local private network subnets (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
      const isLocal = allowedOrigins.includes(origin) ||
                      /\.vercel\.app$/.test(origin) ||
                      origin.startsWith('http://localhost:') ||
                      origin.startsWith('http://127.0.0.1:') ||
                      /^http:\/\/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?$/.test(origin);
      
      if (isLocal) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();