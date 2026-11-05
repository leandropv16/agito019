import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import type { CreateClickMetricDto, CreateEventReportDto } from "./dto/engagement.dto";

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async reportEvent(dto: CreateEventReportDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: dto.eventId, deletedAt: null, status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
    });
    if (!event) {
      throw new AppException("EVENT_NOT_FOUND", "Evento não encontrado", HttpStatus.NOT_FOUND);
    }
    const report = await this.prisma.eventReport.create({
      data: {
        eventId: dto.eventId,
        problemType: dto.problemType,
        comment: dto.comment?.trim() ? dto.comment.trim() : null,
      },
    });
    return {
      id: report.id,
      eventId: report.eventId,
      problemType: report.problemType,
      createdAt: report.createdAt,
      message: "Obrigado. Vamos conferir a agenda.",
    };
  }

  async trackClick(dto: CreateClickMetricDto) {
    const row = await this.prisma.clickMetric.create({
      data: {
        target: dto.target,
        entityType: dto.entityType,
        entityId: dto.entityId,
        path: dto.path?.trim() ? dto.path.trim() : null,
      },
    });
    return { id: row.id, ok: true };
  }

  async listReports() {
    const rows = await this.prisma.eventReport.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
            agendaStatus: true,
            establishment: { select: { name: true, city: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      problemType: row.problemType,
      comment: row.comment,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
      event: {
        id: row.event.id,
        title: row.event.title,
        slug: row.event.slug,
        startAt: row.event.startAt,
        agendaStatus: row.event.agendaStatus,
        establishment: row.event.establishment.name,
        city: row.event.establishment.city.name,
      },
    }));
  }

  async resolveReport(id: string) {
    const existing = await this.prisma.eventReport.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException("REPORT_NOT_FOUND", "Denúncia não encontrada", HttpStatus.NOT_FOUND);
    }
    return this.prisma.eventReport.update({
      where: { id },
      data: { resolvedAt: existing.resolvedAt ?? new Date() },
    });
  }

  async clickSummary() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.clickMetric.groupBy({
      by: ["target"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    const total = rows.reduce((sum, row) => sum + row._count._all, 0);
    const byTarget = Object.fromEntries(rows.map((row) => [row.target, row._count._all])) as Record<
      string,
      number
    >;
    const recent = await this.prisma.clickMetric.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return {
      since,
      total,
      byTarget: {
        ROUTE: byTarget.ROUTE ?? 0,
        WHATSAPP: byTarget.WHATSAPP ?? 0,
        PHONE: byTarget.PHONE ?? 0,
        INSTAGRAM: byTarget.INSTAGRAM ?? 0,
      },
      recent,
    };
  }
}
