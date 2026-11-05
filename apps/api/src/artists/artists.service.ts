import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccessService } from "../common/access.service";
import { AppException } from "../common/errors/app.exception";
import { uniqueSlug } from "../common/slug";
import { paginated, parsePagination } from "../common/pagination";
import { coverOf, mapMedia } from "../common/presenters";
import type { AuthUser } from "../auth/auth.types";
import type { CreateArtistDto, UpdateArtistDto } from "./dto/artist.dto";
import { SeoRevalidateService } from "../seo/seo-revalidate.service";

const include = {
  city: true,
  genres: { include: { genre: true } },
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ArtistInclude;

@Injectable()
export class ArtistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly seo: SeoRevalidateService,
  ) {}

  async list(user: AuthUser, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = { deletedAt: null, ...this.access.artistScope(user) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.artist.findMany({
        where,
        include,
        orderBy: { updatedAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.artist.count({ where }),
    ]);
    return paginated(rows.map((row) => this.serialize(row)), total, pagination.page, pagination.limit);
  }

  async get(user: AuthUser, id: string) {
    const row = await this.prisma.artist.findFirst({
      where: { id, deletedAt: null, ...this.access.artistScope(user) },
      include,
    });
    if (!row) {
      throw new AppException("ARTIST_NOT_FOUND", "Músico não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async create(user: AuthUser, dto: CreateArtistDto) {
    if (user.role !== "ADMIN") {
      throw new AppException("ARTIST_CREATE_FORBIDDEN", "Apenas administradores cadastram músicos", HttpStatus.FORBIDDEN);
    }
    const slug = await uniqueSlug(dto.name, (value) => this.prisma.artist.findUnique({ where: { slug: value } }).then(Boolean));
    const id = await this.prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: {
          name: dto.name,
          slug,
          type: dto.type,
          bio: dto.bio ?? null,
          instagramUrl: dto.instagramUrl ?? null,
          whatsapp: dto.whatsapp ?? null,
          videoUrl: dto.videoUrl ?? null,
          hireUrl: dto.hireUrl ?? null,
          cityId: dto.cityId ?? null,
          status: dto.status ?? "DRAFT",
        },
      });
      await this.sync(tx, artist.id, dto);
      return artist.id;
    });
    const created = await this.get(user, id);
    await this.refreshSeo(null, created);
    return created;
  }

  async update(user: AuthUser, id: string, dto: UpdateArtistDto) {
    await this.access.assertArtistAccess(user, id);
    const current = await this.prisma.artist.findFirst({ where: { id, deletedAt: null } });
    if (!current) {
      throw new AppException("ARTIST_NOT_FOUND", "Músico não encontrado", HttpStatus.NOT_FOUND);
    }
    const slug =
      dto.name && dto.name !== current.name
        ? await uniqueSlug(dto.name, async (value) => {
            const found = await this.prisma.artist.findUnique({ where: { slug: value } });
            return Boolean(found && found.id !== id);
          })
        : current.slug;
    await this.prisma.$transaction(async (tx) => {
      await tx.artist.update({
        where: { id },
        data: {
          name: dto.name ?? current.name,
          slug,
          type: dto.type ?? current.type,
          bio: dto.bio ?? current.bio,
          instagramUrl: dto.instagramUrl ?? current.instagramUrl,
          whatsapp: dto.whatsapp ?? current.whatsapp,
          videoUrl: dto.videoUrl === undefined ? current.videoUrl : dto.videoUrl,
          hireUrl: dto.hireUrl === undefined ? current.hireUrl : dto.hireUrl,
          cityId: dto.cityId === undefined ? current.cityId : dto.cityId,
          status: dto.status ?? current.status,
        },
      });
      await this.sync(tx, id, dto);
    });
    const updated = await this.get(user, id);
    await this.refreshSeo(current.status, updated);
    return updated;
  }

  private async sync(tx: Prisma.TransactionClient, artistId: string, dto: Partial<CreateArtistDto>) {
    if (dto.genreIds) {
      await tx.artistGenre.deleteMany({ where: { artistId } });
      if (dto.genreIds.length) {
        await tx.artistGenre.createMany({
          data: dto.genreIds.map((genreId) => ({ artistId, genreId })),
        });
      }
    }
    if (dto.media) {
      await tx.artistMedia.deleteMany({ where: { artistId } });
      if (dto.media.length) {
        await tx.artistMedia.createMany({
          data: dto.media.map((item, index) => ({
            artistId,
            mediaId: item.mediaId,
            isCover: item.isCover ?? index === 0,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }
  }

  private async refreshSeo(
    previousStatus: string | null,
    artist: Awaited<ReturnType<ArtistsService["get"]>>,
  ) {
    if (previousStatus === "PUBLISHED" || artist.status === "PUBLISHED") {
      await this.seo.notifyArtist(artist);
    }
  }

  private serialize(row: Prisma.ArtistGetPayload<{ include: typeof include }>) {
    return {
      ...row,
      genres: row.genres.map((item) => item.genre),
      media: mapMedia(row.media),
      cover: coverOf(row.media),
    };
  }
}
