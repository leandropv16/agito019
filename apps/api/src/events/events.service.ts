import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccessService } from "../common/access.service";
import { AppException } from "../common/errors/app.exception";
import { uniqueSlug } from "../common/slug";
import { paginated, parsePagination } from "../common/pagination";
import { coverOf, mapMedia } from "../common/presenters";
import type { AuthUser } from "../auth/auth.types";
import type { CreateEventDto, UpdateEventDto } from "./dto/event.dto";
import { SeoRevalidateService } from "../seo/seo-revalidate.service";

const include = {
  establishment: { include: { city: true } },
  artists: { include: { artist: true }, orderBy: { sortOrder: "asc" as const } },
  genres: { include: { genre: true } },
  audiences: { include: { audience: true } },
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly seo: SeoRevalidateService,
  ) {}

  async list(user: AuthUser, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = {
      deletedAt: null,
      establishment: this.access.establishmentScope(user),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        include,
        orderBy: { startAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.event.count({ where }),
    ]);
    return paginated(rows.map((row) => this.serialize(row)), total, pagination.page, pagination.limit);
  }

  async get(user: AuthUser, id: string) {
    const row = await this.prisma.event.findFirst({
      where: { id, deletedAt: null, establishment: this.access.establishmentScope(user) },
      include,
    });
    if (!row) {
      throw new AppException("EVENT_NOT_FOUND", "Evento não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async create(user: AuthUser, dto: CreateEventDto) {
    await this.access.assertEstablishmentAccess(user, dto.establishmentId);
    const slug = await uniqueSlug(dto.title, (value) => this.prisma.event.findUnique({ where: { slug: value } }).then(Boolean));
    const id = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description ?? null,
          establishmentId: dto.establishmentId,
          eventType: dto.eventType,
          startAt: new Date(dto.startAt),
          endAt: dto.endAt ? new Date(dto.endAt) : null,
          status: dto.status ?? "DRAFT",
          agendaStatus: dto.agendaStatus ?? "PENDING",
          entryPriceType: dto.entryPriceType ?? null,
          entryPriceCents: dto.entryPriceType === "FREE" ? null : (dto.entryPriceCents ?? null),
          hasMusic: dto.hasMusic ?? null,
        },
      });
      await this.sync(tx, event.id, dto);
      return event.id;
    });
    const created = await this.get(user, id);
    await this.refreshSeo(null, created);
    return created;
  }

  async update(user: AuthUser, id: string, dto: UpdateEventDto) {
    const current = await this.prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!current) {
      throw new AppException("EVENT_NOT_FOUND", "Evento não encontrado", HttpStatus.NOT_FOUND);
    }
    await this.access.assertEstablishmentAccess(user, current.establishmentId);
    if (dto.establishmentId) {
      await this.access.assertEstablishmentAccess(user, dto.establishmentId);
    }
    const slug =
      dto.title && dto.title !== current.title
        ? await uniqueSlug(dto.title, async (value) => {
            const found = await this.prisma.event.findUnique({ where: { slug: value } });
            return Boolean(found && found.id !== id);
          })
        : current.slug;
    await this.prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title: dto.title ?? current.title,
          slug,
          description: dto.description ?? current.description,
          establishmentId: dto.establishmentId ?? current.establishmentId,
          eventType: dto.eventType ?? current.eventType,
          startAt: dto.startAt ? new Date(dto.startAt) : current.startAt,
          endAt: dto.endAt === undefined ? current.endAt : dto.endAt ? new Date(dto.endAt) : null,
          status: dto.status ?? current.status,
          agendaStatus: dto.agendaStatus ?? current.agendaStatus,
          entryPriceType: dto.entryPriceType === undefined ? current.entryPriceType : dto.entryPriceType,
          entryPriceCents:
            dto.entryPriceType === "FREE"
              ? null
              : dto.entryPriceCents === undefined
                ? current.entryPriceCents
                : dto.entryPriceCents,
          hasMusic: dto.hasMusic === undefined ? current.hasMusic : dto.hasMusic,
        },
      });
      await this.sync(tx, id, dto);
    });
    const updated = await this.get(user, id);
    await this.refreshSeo(current.status, updated);
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    const current = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: { establishment: { include: { city: true } } },
    });
    if (!current) {
      throw new AppException("EVENT_NOT_FOUND", "Evento não encontrado", HttpStatus.NOT_FOUND);
    }
    await this.access.assertEstablishmentAccess(user, current.establishmentId);
    await this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.seo.notifyEvent(current);
    return { ok: true };
  }

  private async refreshSeo(
    previousStatus: string | null,
    event: Awaited<ReturnType<EventsService["get"]>>,
  ) {
    if (previousStatus === "PUBLISHED" || event.status === "PUBLISHED") {
      await this.seo.notifyEvent(event);
    }
  }

  private async sync(tx: Prisma.TransactionClient, eventId: string, dto: Partial<CreateEventDto>) {
    if (dto.artists) {
      await tx.eventArtist.deleteMany({ where: { eventId } });
      if (dto.artists.length) {
        await tx.eventArtist.createMany({
          data: dto.artists.map((item, index) => ({
            eventId,
            artistId: item.artistId,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }
    if (dto.genreIds) {
      await tx.eventGenre.deleteMany({ where: { eventId } });
      if (dto.genreIds.length) {
        await tx.eventGenre.createMany({
          data: dto.genreIds.map((genreId) => ({ eventId, genreId })),
        });
      }
    }
    if (dto.audienceIds) {
      await tx.eventAudience.deleteMany({ where: { eventId } });
      if (dto.audienceIds.length) {
        await tx.eventAudience.createMany({
          data: dto.audienceIds.map((audienceId) => ({ eventId, audienceId })),
        });
      }
    }
    if (dto.media) {
      await tx.eventMedia.deleteMany({ where: { eventId } });
      if (dto.media.length) {
        await tx.eventMedia.createMany({
          data: dto.media.map((item, index) => ({
            eventId,
            mediaId: item.mediaId,
            isCover: item.isCover ?? index === 0,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }
  }

  private serialize(row: Prisma.EventGetPayload<{ include: typeof include }>) {
    return {
      ...row,
      artists: row.artists.map((item) => item.artist),
      genres: row.genres.map((item) => item.genre),
      audiences: row.audiences.map((item) => item.audience),
      media: mapMedia(row.media),
      cover: coverOf(row.media),
    };
  }
}
