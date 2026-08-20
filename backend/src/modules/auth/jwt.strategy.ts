import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('jwt.secret') ||
        'ruankao-jwt-secret-key-2024-secure',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.id) {
      throw new UnauthorizedException('无效的凭证');
    }
    return {
      id: Number(payload.id),
      username: payload.username,
      role: payload.role,
      roles: payload.role ? [payload.role] : [],
      vipLevel: payload.vipLevel || 0,
    };
  }
}
