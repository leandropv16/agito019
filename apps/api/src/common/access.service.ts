import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "./errors/app.exception";
import { HttpStatus } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertEstablishmentAccess(user: AuthUser, establishmentId: string) {
    if (user.role === "ADMIN") {
      return;
    }
    const link = await this.prisma.userEstablishment.findUnique({
      where: { userId_establishmentId: { userId: user.id, establishmentId } },
    });
    if (!link) {
      throw new AppException(
        "ESTABLISHMENT_FORBIDDEN",
        "Você não gerencia este estabelecimento",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async assertArtistAccess(user: AuthUser, artistId: string) {
    if (user.role === "ADMIN") {
      return;
    }
    const link = await this.prisma.userArtist.findUnique({
      where: { userId_artistId: { userId: user.id, artistId } },
    });
    if (!link) {
      throw new AppException("ARTIST_FORBIDDEN", "Você não gerencia este músico", HttpStatus.FORBIDDEN);
    }
  }

  establishmentScope(user: AuthUser) {
    if (user.role === "ADMIN") {
      return {};
    }
    return { users: { some: { userId: user.id } } };
  }

  artistScope(user: AuthUser) {
    if (user.role === "ADMIN") {
      return {};
    }
    return { users: { some: { userId: user.id } } };
  }
}
