import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { 'x-api-key'?: string } }>()
    const provided = request.headers['x-api-key']
    const expected = this.config.getOrThrow<string>('ADMIN_API_KEY')

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid admin API key')
    }

    return true
  }
}
