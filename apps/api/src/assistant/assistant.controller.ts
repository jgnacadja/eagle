import { Body, Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AssistantReply } from '@learnup/types'
import { AssistantService } from './assistant.service'
import { AssistantRequestDto } from './assistant.dto'

@ApiTags('Assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('message')
  @ApiOperation({ summary: 'Conversational assisted-search turn' })
  @ApiOkResponse({ description: 'Assistant reply (clarify, recommendations or fallback)' })
  async message(@Body() body: AssistantRequestDto): Promise<AssistantReply> {
    return this.assistant.reply(body)
  }
}
