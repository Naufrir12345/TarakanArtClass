import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: process.env.JWT_SECRET || 'manufindo-secret-key-2026',
      secretOrKey: 'manufindo-secret-key-2026',
    });
  }

  async validate(payload: any) {
    const roleValue = typeof payload.role === 'object' ? payload.role.name : payload.role;
    console.log("DEBUG - Validasi JWT berhasil, payload:", payload);
    return { sub: payload.sub, email: payload.email, role: roleValue };
  }
}
