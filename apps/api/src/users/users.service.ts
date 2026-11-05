import { HttpStatus, Injectable } from "@nestjs/common";
import { hash } from "argon2";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import type { CreateUserDto, InvitePartnerDto, UpdateUserDto } from "./dto/user.dto";

function generateTemporaryPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Agito#${digits}!`;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  establishments: {
    select: {
      establishment: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
  artists: {
    select: {
      artist: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      createdAt: row.createdAt,
      establishments: row.establishments.map((e) => e.establishment),
      artists: row.artists.map((a) => a.artist),
    }));
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) {
      throw new AppException("EMAIL_TAKEN", "E-mail já cadastrado", HttpStatus.CONFLICT);
    }
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash: await hash(dto.password),
          role: dto.role,
          active: dto.active ?? true,
        },
      });
      await this.syncLinks(tx as Prisma.TransactionClient, user.id, dto.establishmentIds ?? [], dto.artistIds ?? []);
      const row = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: userSelect });
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        active: row.active,
        createdAt: row.createdAt,
        establishments: row.establishments.map((e) => e.establishment),
        artists: row.artists.map((a) => a.artist),
      };
    });
  }

  async invitePartner(dto: InvitePartnerDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) {
      throw new AppException("EMAIL_TAKEN", "E-mail já cadastrado", HttpStatus.CONFLICT);
    }
    const plainPassword = dto.password?.trim() || generateTemporaryPassword();
    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash: await hash(plainPassword),
          role: "PARTNER",
          active: true,
        },
      });
      await this.syncLinks(tx as Prisma.TransactionClient, user.id, dto.establishmentIds, []);
      return user;
    });

    const establishments = await this.prisma.establishment.findMany({
      where: { id: { in: dto.establishmentIds } },
      select: { id: true, name: true, slug: true },
    });

    return {
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        active: createdUser.active,
        createdAt: createdUser.createdAt,
      },
      plainPassword,
      establishments,
    };
  }

  async resetPassword(id: string, customPassword?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        establishments: {
          include: {
            establishment: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new AppException("USER_NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND);
    }
    const plainPassword = customPassword?.trim() || generateTemporaryPassword();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash: await hash(plainPassword) },
      });
      await tx.authSession.deleteMany({ where: { userId: id } });
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      plainPassword,
      establishments: user.establishments.map((item) => item.establishment),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppException("USER_NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.password ? { passwordHash: await hash(dto.password) } : {}),
        },
      });
      if (dto.establishmentIds || dto.artistIds) {
        await this.syncLinks(tx as Prisma.TransactionClient, id, dto.establishmentIds ?? [], dto.artistIds ?? []);
      }
      const row = await tx.user.findUniqueOrThrow({ where: { id }, select: userSelect });
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        active: row.active,
        createdAt: row.createdAt,
        establishments: row.establishments.map((e) => e.establishment),
        artists: row.artists.map((a) => a.artist),
      };
    });
  }

  private async syncLinks(
    tx: Prisma.TransactionClient,
    userId: string,
    establishmentIds: string[],
    artistIds: string[],
  ) {
    await tx.userEstablishment.deleteMany({ where: { userId } });
    await tx.userArtist.deleteMany({ where: { userId } });
    if (establishmentIds.length) {
      await tx.userEstablishment.createMany({
        data: establishmentIds.map((establishmentId) => ({ userId, establishmentId })),
      });
    }
    if (artistIds.length) {
      await tx.userArtist.createMany({
        data: artistIds.map((artistId) => ({ userId, artistId })),
      });
    }
  }
}
