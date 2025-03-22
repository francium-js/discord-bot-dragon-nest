import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'

import { join } from 'path'

import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['access-token', 'x-refresh-vip'],
  })

  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public/' })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  )

  await app.listen(process.env.PORT ?? 8080)
}

bootstrap().catch(err => {
  console.error('❌ Error while starting the app:', err)
})
