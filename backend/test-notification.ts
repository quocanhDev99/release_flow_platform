import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NotificationsService } from './src/notifications/notifications.service';
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  console.log('Sending test deployment alert...');

  try {
    await notificationsService.sendDeploymentAlert({
      repoName: 'Test Repo',
      ticketId: 'TEST-123',
      summary: 'Test summary',
      changeType: 'Bugfix',
      releaseVersion: 'v1.0.0',
      sourceBranch: 'test-branch',
      developer: 'testuser',
    });
    console.log('Test sent successfully!');
  } catch (err) {
    console.error('Error in sendDeploymentAlert:', err);
  }

  await app.close();
}

bootstrap();
