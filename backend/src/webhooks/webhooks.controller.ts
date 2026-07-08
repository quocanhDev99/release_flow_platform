import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGitHub(@Headers() headers: any, @Body() payload: any) {
    return this.webhooksService.handleGitHubWebhook(headers, payload);
  }

  @Post('bitbucket')
  @HttpCode(HttpStatus.OK)
  async handleBitbucket(@Headers() headers: any, @Body() payload: any) {
    return this.webhooksService.handleBitbucketWebhook(headers, payload);
  }
}
