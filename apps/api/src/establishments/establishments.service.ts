import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccessService } from "../common/access.service";
import { AppException } from "../common/errors/app.exception";
import { uniqueSlug } from "../common/slug";
import { paginated, parsePagination } from "../common/pagination";
import { coverOf, mapMedia } from "../common/presenters";
import type { AuthUser } from "../auth/auth.types";
import type { CreateEstablishmentDto, UpdateEstablishmentDto } from "./dto/establishment.dto";
import { SeoRevalidateService } from "../seo/seo-revalidate.service";

function parseTime(value?: string | null) {
  if (!value) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

const adminInclude = {
  city: true,
  categories: { include: { category: true } },
  audiences: { include: { audience: true } },
  amenities: { include: { amenity: true } },
  genres: { include: { genre: true } },
  businessHours: true,
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.EstablishmentInclude;

@Injectable()
export class EstablishmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly seo: SeoRevalidateService,
  ) {}

  async list(user: AuthUser, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = { deletedAt: null, ...this.access.establishmentScope(user) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.establishment.findMany({
        where,
        include: adminInclude,
        orderBy: { updatedAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.establishment.count({ where }),
    ]);
    return paginated(
      rows.map((row) => this.serialize(row)),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async get(user: AuthUser, id: string) {
    const row = await this.prisma.establishment.findFirst({
      where: { id, deletedAt: null, ...this.access.establishmentScope(user) },
      include: adminInclude,
    });
    if (!row) {
      throw new AppException("ESTABLISHMENT_NOT_FOUND", "Estabelecimento não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async create(user: AuthUser, dto: CreateEstablishmentDto) {
    if (user.role !== "ADMIN") {
      throw new AppException(
        "ESTABLISHMENT_CREATE_FORBIDDEN",
        "Apenas administradores cadastram estabelecimentos",
        HttpStatus.FORBIDDEN,
      );
    }
    const slug = await uniqueSlug(dto.name, (value) =>
      this.prisma.establishment.findUnique({ where: { slug: value } }).then(Boolean),
    );
    const created = await this.prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: this.scalarData(dto, slug),
      });
      await this.syncRelations(tx, establishment.id, dto);
      return establishment.id;
    });
    const row = await this.get(user, created);
    await this.refreshSeo(null, row);
    return row;
  }

  async update(user: AuthUser, id: string, dto: UpdateEstablishmentDto) {
    await this.access.assertEstablishmentAccess(user, id);
    const current = await this.prisma.establishment.findFirst({ where: { id, deletedAt: null } });
    if (!current) {
      throw new AppException("ESTABLISHMENT_NOT_FOUND", "Estabelecimento não encontrado", HttpStatus.NOT_FOUND);
    }
    const slug =
      dto.name && dto.name !== current.name
        ? await uniqueSlug(dto.name, async (value) => {
            const found = await this.prisma.establishment.findUnique({ where: { slug: value } });
            return Boolean(found && found.id !== id);
          })
        : current.slug;

    await this.prisma.$transaction(async (tx) => {
      await tx.establishment.update({
        where: { id },
        data: this.scalarData(
          {
            name: dto.name ?? current.name,
            shortDescription: dto.shortDescription ?? current.shortDescription ?? undefined,
            description: dto.description ?? current.description ?? undefined,
            phone: dto.phone ?? current.phone ?? undefined,
            whatsapp: dto.whatsapp ?? current.whatsapp ?? undefined,
            instagramUrl: dto.instagramUrl ?? current.instagramUrl ?? undefined,
            websiteUrl: dto.websiteUrl ?? current.websiteUrl ?? undefined,
            addressStreet: dto.addressStreet ?? current.addressStreet ?? undefined,
            addressNumber: dto.addressNumber ?? current.addressNumber ?? undefined,
            addressComplement: dto.addressComplement ?? current.addressComplement ?? undefined,
            neighborhood: dto.neighborhood ?? current.neighborhood ?? undefined,
            postalCode: dto.postalCode ?? current.postalCode ?? undefined,
            cityId: dto.cityId ?? current.cityId,
            latitude: dto.latitude ?? Number(current.latitude),
            longitude: dto.longitude ?? Number(current.longitude),
            googleMapsUrl: dto.googleMapsUrl ?? current.googleMapsUrl ?? undefined,
            status: dto.status ?? current.status,
            hasMusic: dto.hasMusic === undefined ? current.hasMusic : dto.hasMusic,
          },
          slug,
        ),
      });
      await this.syncRelations(tx, id, dto);
    });
    const updated = await this.get(user, id);
    await this.refreshSeo(current.status, updated);
    return updated;
  }

  async remove(user: AuthUser, id: string) {
    if (user.role !== "ADMIN") {
      throw new AppException("FORBIDDEN", "Apenas administradores arquivam locais", HttpStatus.FORBIDDEN);
    }
    const current = await this.prisma.establishment.findFirst({
      where: { id },
      include: { city: true },
    });
    await this.prisma.establishment.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
    if (current) {
      await this.seo.notifyPlace({ slug: current.slug, status: "ARCHIVED", city: current.city });
    }
    return { ok: true };
  }

  async listUsers(user: AuthUser, id: string) {
    await this.access.assertEstablishmentAccess(user, id);
    const links = await this.prisma.userEstablishment.findMany({
      where: { establishmentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
          },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });
    return links.map((link) => link.user);
  }

  private async refreshSeo(
    previousStatus: string | null,
    place: Awaited<ReturnType<EstablishmentsService["get"]>>,
  ) {
    if (previousStatus === "PUBLISHED" || place.status === "PUBLISHED") {
      await this.seo.notifyPlace(place);
    }
  }

  private scalarData(
    dto: Partial<CreateEstablishmentDto> & { latitude?: unknown; longitude?: unknown },
    slug: string,
  ) {
    return {
      name: dto.name!,
      slug,
      shortDescription: dto.shortDescription ?? null,
      description: dto.description ?? null,
      phone: dto.phone ?? null,
      whatsapp: dto.whatsapp ?? null,
      instagramUrl: dto.instagramUrl ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      addressStreet: dto.addressStreet ?? null,
      addressNumber: dto.addressNumber ?? null,
      addressComplement: dto.addressComplement ?? null,
      neighborhood: dto.neighborhood ?? null,
      postalCode: dto.postalCode ?? null,
      cityId: dto.cityId!,
      latitude: dto.latitude as number,
      longitude: dto.longitude as number,
      googleMapsUrl: dto.googleMapsUrl ?? null,
      status: dto.status ?? "DRAFT",
      hasMusic: dto.hasMusic ?? null,
    };
  }

  private async syncRelations(
    tx: Prisma.TransactionClient,
    establishmentId: string,
    dto: Partial<CreateEstablishmentDto>,
  ) {
    if (dto.categoryIds) {
      await tx.establishmentCategory.deleteMany({ where: { establishmentId } });
      if (dto.categoryIds.length) {
        await tx.establishmentCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({ establishmentId, categoryId })),
        });
      }
    }
    if (dto.audienceIds) {
      await tx.establishmentAudience.deleteMany({ where: { establishmentId } });
      if (dto.audienceIds.length) {
        await tx.establishmentAudience.createMany({
          data: dto.audienceIds.map((audienceId) => ({ establishmentId, audienceId })),
        });
      }
    }
    if (dto.amenityIds) {
      await tx.establishmentAmenity.deleteMany({ where: { establishmentId } });
      if (dto.amenityIds.length) {
        await tx.establishmentAmenity.createMany({
          data: dto.amenityIds.map((amenityId) => ({ establishmentId, amenityId })),
        });
      }
    }
    if (dto.genreIds) {
      await tx.establishmentGenre.deleteMany({ where: { establishmentId } });
      if (dto.genreIds.length) {
        await tx.establishmentGenre.createMany({
          data: dto.genreIds.map((genreId) => ({ establishmentId, genreId })),
        });
      }
    }
    if (dto.businessHours) {
      await tx.businessHour.deleteMany({ where: { establishmentId } });
      if (dto.businessHours.length) {
        await tx.businessHour.createMany({
          data: dto.businessHours.map((hour) => ({
            establishmentId,
            dayOfWeek: hour.dayOfWeek,
            closed: hour.closed ?? false,
            opensAt: hour.closed ? null : parseTime(hour.opensAt),
            closesAt: hour.closed ? null : parseTime(hour.closesAt),
          })),
        });
      }
    }
    if (dto.media) {
      await tx.establishmentMedia.deleteMany({ where: { establishmentId } });
      if (dto.media.length) {
        await tx.establishmentMedia.createMany({
          data: dto.media.map((item, index) => ({
            establishmentId,
            mediaId: item.mediaId,
            isCover: item.isCover ?? index === 0,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }
  }

  private serialize(row: Prisma.EstablishmentGetPayload<{ include: typeof adminInclude }>) {
    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      categories: row.categories.map((item) => item.category),
      genres: row.genres.map((item) => item.genre),
      audiences: row.audiences.map((item) => item.audience),
      amenities: row.amenities.map((item) => item.amenity),
      media: mapMedia(row.media),
      cover: coverOf(row.media),
    };
  }
}
