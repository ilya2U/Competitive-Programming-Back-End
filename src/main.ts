import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });
  app.use(bodyParser.json());
  app.setGlobalPrefix('api');
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.APP_PORT);
}

bootstrap();
