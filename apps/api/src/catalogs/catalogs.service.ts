import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { slugify, uniqueSlug } from "../common/slug";
import { AppException } from "../common/errors/app.exception";
import type { CreateCatalogDto, UpdateCatalogDto } from "./dto/catalog.dto";
import { SeoRevalidateService } from "../seo/seo-revalidate.service";

type CatalogKind = "city" | "category" | "audience" | "amenity" | "musicGenre";

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seo: SeoRevalidateService,
  ) {}

  list(kind: CatalogKind, activeOnly = false) {
    const where = activeOnly ? { active: true } : {};
    const orderBy =
      kind === "city" ? { name: "asc" as const } : [{ sortOrder: "asc" as const }, { name: "asc" as const }];
    return this.delegate(kind).findMany({ where, orderBy });
  }

  async create(kind: CatalogKind, dto: CreateCatalogDto) {
    const slug = dto.slug
      ? slugify(dto.slug)
      : await uniqueSlug(dto.name, async (value) => Boolean(await this.delegate(kind).findUnique({ where: { slug: value } })));
    const created = await this.delegate(kind).create({
      data: {
        name: dto.name,
        slug,
        active: dto.active ?? true,
        ...(kind === "city" ? { state: dto.state ?? "SP" } : {}),
        ...(kind === "category" ? { icon: dto.icon ?? null, sortOrder: dto.sortOrder ?? 0 } : {}),
        ...(kind === "audience" || kind === "amenity" || kind === "musicGenre"
          ? { sortOrder: dto.sortOrder ?? 0 }
          : {}),
      },
    });
    if (kind === "city") {
      await this.seo.notifyCatalog();
    }
    return created;
  }

  async update(kind: CatalogKind, id: string, dto: UpdateCatalogDto) {
    await this.ensure(kind, id);
    const updated = await this.delegate(kind).update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: slugify(dto.slug) } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(kind !== "city" && dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(kind === "city" && dto.state !== undefined ? { state: dto.state } : {}),
        ...(kind === "category" && dto.icon !== undefined ? { icon: dto.icon } : {}),
      },
    });
    if (kind === "city") {
      await this.seo.notifyCatalog();
    }
    return updated;
  }

  private async ensure(kind: CatalogKind, id: string) {
    const found = await this.delegate(kind).findUnique({ where: { id } });
    if (!found) {
      throw new AppException("CATALOG_NOT_FOUND", "Registro não encontrado", HttpStatus.NOT_FOUND);
    }
  }

  private delegate(kind: CatalogKind) {
    return this.prisma[kind] as unknown as {
      findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
      findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
      create: (args: unknown) => Promise<Record<string, unknown>>;
      update: (args: unknown) => Promise<Record<string, unknown>>;
    };
  }
}
