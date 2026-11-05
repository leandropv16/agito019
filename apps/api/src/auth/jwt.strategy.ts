import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { COOKIE_ACCESS } from "../common/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import { HttpStatus } from "@nestjs/common";
import type { AuthUser } from "./auth.types";

type AccessPayload = {
  sub: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.[COOKIE_ACCESS] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    });
  }

  async validate(payload: AccessPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    if (!user || !user.active) {
      throw new AppException("UNAUTHORIZED", "Sessão inválida", HttpStatus.UNAUTHORIZED);
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
