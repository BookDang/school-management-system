import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Healthcheck' })
  @ApiOkResponse({ description: 'The API is up.', schema: { example: { status: 'ok' } } })
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @ApiOperation({ summary: 'Root greeting' })
  @ApiOkResponse({ type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
