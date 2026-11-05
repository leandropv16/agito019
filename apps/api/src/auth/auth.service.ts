import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { verify } from "argon2";
import type { Response } from "express";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "../common/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import type { AuthUser } from "./auth.types";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function parseDuration(value: string, fallbackMs: number) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * map[unit as keyof typeof map];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.active) {
      throw new AppException("INVALID_CREDENTIALS", "E-mail ou senha inválidos", HttpStatus.UNAUTHORIZED);
    }
    const ok = await verify(user.passwordHash, password);
    if (!ok) {
      throw new AppException("INVALID_CREDENTIALS", "E-mail ou senha inválidos", HttpStatus.UNAUTHORIZED);
    }
    return this.issueSession(user, response);
  }

  async refresh(refreshToken: string | undefined, response: Response) {
    if (!refreshToken) {
      throw new AppException("UNAUTHORIZED", "Refresh token ausente", HttpStatus.UNAUTHORIZED);
    }
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!session || !session.user.active) {
      throw new AppException("UNAUTHORIZED", "Sessão expirada", HttpStatus.UNAUTHORIZED);
    }
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(session.user, response);
  }

  async logout(refreshToken: string | undefined, response: Response) {
    if (refreshToken) {
      await this.prisma.authSession.updateMany({
        where: { refreshTokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearCookies(response);
    return { ok: true };
  }

  async me(user: AuthUser) {
    if (user.role === "PARTNER") {
      const userWithEst = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          establishments: {
            include: {
              establishment: {
                select: { id: true, name: true, slug: true, status: true },
              },
            },
          },
        },
      });
      return {
        ...user,
        establishments: userWithEst?.establishments.map((e) => e.establishment) ?? [],
      };
    }
    return { ...user, establishments: [] };
  }

  private async issueSession(
    user: { id: string; name: string; email: string; role: AuthUser["role"] },
    response: Response,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
    const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: accessSecret, expiresIn: Math.floor(parseDuration(accessExpires, 15 * 60_000) / 1000) },
    );
    const refreshToken = randomBytes(48).toString("hex");
    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDuration(refreshExpires, 7 * 86_400_000)),
      },
    });

    const secure = process.env.COOKIE_SECURE === "true";
    const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
    response.cookie(COOKIE_ACCESS, accessToken, {
      ...base,
      maxAge: parseDuration(accessExpires, 15 * 60_000),
    });
    response.cookie(COOKIE_REFRESH, refreshToken, {
      ...base,
      maxAge: parseDuration(refreshExpires, 7 * 86_400_000),
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private clearCookies(response: Response) {
    const secure = process.env.COOKIE_SECURE === "true";
    const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
    response.clearCookie(COOKIE_ACCESS, base);
    response.clearCookie(COOKIE_REFRESH, base);
  }
}
