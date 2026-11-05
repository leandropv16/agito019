import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AccessService } from "../common/access.service";
import { AppException } from "../common/errors/app.exception";
import { slugify, uniqueSlug } from "../common/slug";
import { dayBounds } from "../common/timezone";
import type { AuthUser } from "../auth/auth.types";
import { assertCampaignXor, type CreateCampaignDto, type UpdateCampaignDto, type UpsertPlanDto } from "./dto/commercial.dto";

const campaignInclude = {
  plan: true,
  establishment: { select: { id: true, name: true, slug: true } },
  artist: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class CommercialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  listPlans() {
    return this.prisma.commercialPlan.findMany({ orderBy: { priority: "asc" } });
  }

  async createPlan(dto: UpsertPlanDto) {
    const slug = dto.slug
      ? slugify(dto.slug)
      : await uniqueSlug(dto.name, (value) => this.prisma.commercialPlan.findUnique({ where: { slug: value } }).then(Boolean));
    return this.prisma.commercialPlan.create({ data: { ...dto, slug } });
  }

  async updatePlan(id: string, dto: UpsertPlanDto) {
    await this.ensurePlan(id);
    return this.prisma.commercialPlan.update({
      where: { id },
      data: { ...dto, ...(dto.slug ? { slug: slugify(dto.slug) } : {}) },
    });
  }

  listCampaigns() {
    return this.prisma.commercialCampaign.findMany({
      include: campaignInclude,
      orderBy: { startsAt: "desc" },
    });
  }

  async createCampaign(dto: CreateCampaignDto) {
    this.validateXor(dto.establishmentId, dto.artistId);
    return this.prisma.commercialCampaign.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        paymentStatus: dto.paymentStatus ?? "PENDING",
      },
      include: campaignInclude,
    });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const current = await this.prisma.commercialCampaign.findUnique({ where: { id } });
    if (!current) {
      throw new AppException("CAMPAIGN_NOT_FOUND", "Campanha não encontrada", HttpStatus.NOT_FOUND);
    }
    const establishmentId = dto.establishmentId === undefined ? current.establishmentId : dto.establishmentId;
    const artistId = dto.artistId === undefined ? current.artistId : dto.artistId;
    this.validateXor(establishmentId, artistId);
    return this.prisma.commercialCampaign.update({
      where: { id },
      data: {
        ...dto,
        establishmentId,
        artistId,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: campaignInclude,
    });
  }

  async dashboard(user: AuthUser) {
    const now = new Date();
    const today = dayBounds();
    const isPartner = user.role === "PARTNER";
    const estScope = this.access.establishmentScope(user);

    if (isPartner) {
      const [
        publishedEstablishments,
        upcomingEvents,
        liveMusicToday,
        activePromotions,
        activeCampaigns,
        pendingPayments,
        partnerEstablishments,
      ] = await this.prisma.$transaction([
        this.prisma.establishment.count({
          where: { deletedAt: null, status: "PUBLISHED", ...estScope },
        }),
        this.prisma.event.count({
          where: {
            deletedAt: null,
            status: "PUBLISHED",
            startAt: { gte: now },
            establishment: estScope,
          },
        }),
        this.prisma.event.count({
          where: {
            deletedAt: null,
            status: "PUBLISHED",
            eventType: "LIVE_MUSIC",
            startAt: { gte: today.start, lt: today.end },
            establishment: estScope,
          },
        }),
        this.prisma.promotion.count({
          where: {
            deletedAt: null,
            active: true,
            startsAt: { lte: now },
            endsAt: { gte: now },
            establishment: estScope,
          },
        }),
        this.prisma.commercialCampaign.count({
          where: {
            paymentStatus: "PAID",
            startsAt: { lte: now },
            endsAt: { gte: now },
            establishment: estScope,
          },
        }),
        this.prisma.commercialCampaign.count({
          where: { paymentStatus: "PENDING", establishment: estScope },
        }),
        this.prisma.establishment.findMany({
          where: { deletedAt: null, ...estScope },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            _count: {
              select: {
                events: { where: { deletedAt: null } },
              },
            },
            campaigns: {
              where: {
                paymentStatus: "PAID",
                startsAt: { lte: now },
                endsAt: { gte: now },
              },
              include: { plan: true },
              take: 1,
            },
          },
        }),
      ]);

      return {
        role: "PARTNER" as const,
        publishedEstablishments,
        upcomingEvents,
        liveMusicToday,
        activePromotions,
        activeCampaigns,
        pendingPayments,
        partnerEstablishments: partnerEstablishments.map((est) => ({
          id: est.id,
          name: est.name,
          slug: est.slug,
          status: est.status,
          eventsCount: est._count.events,
          activePlan: est.campaigns[0]?.plan?.name ?? null,
        })),
      };
    }

    const [
      publishedEstablishments,
      upcomingEvents,
      liveMusicToday,
      activePromotions,
      activeCampaigns,
      pendingPayments,
    ] = await this.prisma.$transaction([
      this.prisma.establishment.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      this.prisma.event.count({
        where: { deletedAt: null, status: "PUBLISHED", startAt: { gte: now } },
      }),
      this.prisma.event.count({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          eventType: "LIVE_MUSIC",
          startAt: { gte: today.start, lt: today.end },
        },
      }),
      this.prisma.promotion.count({
        where: {
          deletedAt: null,
          active: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      }),
      this.prisma.commercialCampaign.count({
        where: { paymentStatus: "PAID", startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      this.prisma.commercialCampaign.count({ where: { paymentStatus: "PENDING" } }),
    ]);

    return {
      role: "ADMIN" as const,
      publishedEstablishments,
      upcomingEvents,
      liveMusicToday,
      activePromotions,
      activeCampaigns,
      pendingPayments,
    };
  }

  validateXor(establishmentId?: string | null, artistId?: string | null) {
    if (!assertCampaignXor(establishmentId, artistId)) {
      throw new AppException(
        "CAMPAIGN_TARGET_XOR",
        "A campanha deve estar ligada a um estabelecimento ou a um artista",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async ensurePlan(id: string) {
    const plan = await this.prisma.commercialPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new AppException("PLAN_NOT_FOUND", "Plano não encontrado", HttpStatus.NOT_FOUND);
    }
  }
}
