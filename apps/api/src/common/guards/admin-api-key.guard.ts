import { timingSafeEqual } from 'node:crypto'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  private readonly expected: string

  constructor(config: ConfigService) {
    this.expected = config.getOrThrow<string>('ADMIN_API_KEY')
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { 'x-api-key'?: string } }>()
    const provided = request.headers['x-api-key']

    if (!provided) {
      throw new UnauthorizedException('Invalid admin API key')
    }

    const providedBuffer = Buffer.from(provided)
    const expectedBuffer = Buffer.from(this.expected)

    if (providedBuffer.length !== expectedBuffer.length) {
      throw new UnauthorizedException('Invalid admin API key')
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid admin API key')
    }

    return true
  }
}
