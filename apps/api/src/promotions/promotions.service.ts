import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccessService } from "../common/access.service";
import { AppException } from "../common/errors/app.exception";
import { paginated, parsePagination } from "../common/pagination";
import { coverOf, mapMedia } from "../common/presenters";
import type { AuthUser } from "../auth/auth.types";
import type { CreatePromotionDto, UpdatePromotionDto } from "./dto/promotion.dto";
import { SeoRevalidateService } from "../seo/seo-revalidate.service";

const include = {
  establishment: { include: { city: true } },
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.PromotionInclude;

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly seo: SeoRevalidateService,
  ) {}

  async list(user: AuthUser, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = { deletedAt: null, establishment: this.access.establishmentScope(user) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.promotion.findMany({
        where,
        include,
        orderBy: { startsAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.promotion.count({ where }),
    ]);
    return paginated(rows.map((row) => this.serialize(row)), total, pagination.page, pagination.limit);
  }

  async create(user: AuthUser, dto: CreatePromotionDto) {
    await this.access.assertEstablishmentAccess(user, dto.establishmentId);
    const id = await this.prisma.$transaction(async (tx) => {
      const promo = await tx.promotion.create({
        data: {
          establishmentId: dto.establishmentId,
          title: dto.title,
          description: dto.description ?? null,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          active: dto.active ?? true,
        },
      });
      await this.syncMedia(tx, promo.id, dto.media);
      return promo.id;
    });
    const created = await this.get(user, id);
    if (created.active) {
      await this.seo.notifyPromotion(created);
    }
    return created;
  }

  async get(user: AuthUser, id: string) {
    const row = await this.prisma.promotion.findFirst({
      where: { id, deletedAt: null, establishment: this.access.establishmentScope(user) },
      include,
    });
    if (!row) {
      throw new AppException("PROMOTION_NOT_FOUND", "Promoção não encontrada", HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async update(user: AuthUser, id: string, dto: UpdatePromotionDto) {
    const current = await this.prisma.promotion.findFirst({ where: { id, deletedAt: null } });
    if (!current) {
      throw new AppException("PROMOTION_NOT_FOUND", "Promoção não encontrada", HttpStatus.NOT_FOUND);
    }
    await this.access.assertEstablishmentAccess(user, current.establishmentId);
    await this.prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: {
          establishmentId: dto.establishmentId ?? current.establishmentId,
          title: dto.title ?? current.title,
          description: dto.description ?? current.description,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : current.startsAt,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : current.endsAt,
          active: dto.active ?? current.active,
        },
      });
      await this.syncMedia(tx, id, dto.media);
    });
    const updated = await this.get(user, id);
    if (current.active || updated.active) {
      await this.seo.notifyPromotion(updated);
    }
    return updated;
  }

  private async syncMedia(
    tx: Prisma.TransactionClient,
    promotionId: string,
    media?: CreatePromotionDto["media"],
  ) {
    if (!media) {
      return;
    }
    await tx.promotionMedia.deleteMany({ where: { promotionId } });
    if (media.length) {
      await tx.promotionMedia.createMany({
        data: media.map((item, index) => ({
          promotionId,
          mediaId: item.mediaId,
          isCover: item.isCover ?? index === 0,
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }
  }

  private serialize(row: Prisma.PromotionGetPayload<{ include: typeof include }>) {
    return {
      ...row,
      media: mapMedia(row.media),
      cover: coverOf(row.media),
    };
  }
}
