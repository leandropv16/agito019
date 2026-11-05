import "dotenv/config";
import { hash } from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../apps/api/src/generated/prisma/client";
import { upcomingHolidayYmds } from "../packages/shared/src/search-flow.ts";

const TIMEZONE = "America/Sao_Paulo";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function createPrisma() {
  const url = requireEnv("DATABASE_URL");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
  };
}

function saoPauloDateTime(year: number, month: number, day: number, hour: number, minute = 0) {
  const utcGuess = Date.UTC(year, month - 1, day, hour + 3, minute, 0);
  const asZone = zonedParts(new Date(utcGuess));
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actual = Date.UTC(asZone.year, asZone.month - 1, asZone.day, asZone.hour, asZone.minute, 0);
  return new Date(utcGuess + (desired - actual));
}

function addDays(base: { year: number; month: number; day: number }, amount: number) {
  const utc = new Date(Date.UTC(base.year, base.month - 1, base.day + amount));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  };
}

function todayInSaoPaulo() {
  const now = zonedParts(new Date());
  return { year: now.year, month: now.month, day: now.day };
}

function weekdayInSaoPaulo(year: number, month: number, day: number) {
  return addDays({ year, month, day }, 0).weekday;
}

function nextWeekday(from: { year: number; month: number; day: number }, weekday: number) {
  const current = weekdayInSaoPaulo(from.year, from.month, from.day);
  const delta = (weekday - current + 7) % 7;
  return addDays(from, delta);
}

function timeOn(date: Date, hours: number, minutes = 0) {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

async function upsertNamed(
  prisma: PrismaClient,
  model: "city" | "category" | "audience" | "amenity" | "musicGenre",
  items: Array<Record<string, unknown> & { slug: string }>,
) {
  for (const item of items) {
    const delegate = prisma[model] as unknown as {
      upsert: (args: unknown) => Promise<unknown>;
    };
    await delegate.upsert({
      where: { slug: item.slug },
      create: item,
      update: item,
    });
  }
}

async function main() {
  const prisma = createPrisma();

  const cities = [
    { name: "Campinas", slug: "campinas", state: "SP", active: true },
    { name: "Valinhos", slug: "valinhos", state: "SP", active: true },
    { name: "Vinhedo", slug: "vinhedo", state: "SP", active: true },
    { name: "Paulínia", slug: "paulinia", state: "SP", active: true },
    { name: "Sumaré", slug: "sumare", state: "SP", active: true },
    { name: "Hortolândia", slug: "hortolandia", state: "SP", active: true },
    { name: "Americana", slug: "americana", state: "SP", active: true },
    { name: "Indaiatuba", slug: "indaiatuba", state: "SP", active: true },
    { name: "Limeira", slug: "limeira", state: "SP", active: true },
    { name: "Piracicaba", slug: "piracicaba", state: "SP", active: true },
    { name: "Louveira", slug: "louveira", state: "SP", active: true },
    { name: "Jundiaí", slug: "jundiai", state: "SP", active: true },
    { name: "Cosmópolis", slug: "cosmopolis", state: "SP", active: true },
  ];

  await upsertNamed(prisma, "city", cities);

  await upsertNamed(prisma, "category", [
    { name: "Bar", slug: "bar", icon: "beer", active: true, sortOrder: 1 },
    { name: "Boteco", slug: "boteco", icon: "utensils", active: true, sortOrder: 2 },
    { name: "Pub", slug: "pub", icon: "wine", active: true, sortOrder: 3 },
    { name: "Restaurante", slug: "restaurante", icon: "chef-hat", active: true, sortOrder: 4 },
    { name: "Balada", slug: "balada", icon: "disco", active: true, sortOrder: 5 },
    { name: "Casa de Shows", slug: "casa-de-shows", icon: "music", active: true, sortOrder: 6 },
    { name: "Outros", slug: "outros", icon: "sparkles", active: true, sortOrder: 99 },
    { name: "Bares", slug: "bares", icon: "beer", active: true, sortOrder: 10 },
    { name: "Restaurantes", slug: "restaurantes", icon: "chef-hat", active: true, sortOrder: 11 },
    { name: "Baladas", slug: "baladas", icon: "disco", active: true, sortOrder: 12 },
    { name: "Eventos", slug: "eventos", icon: "sparkles", active: true, sortOrder: 13 },
    { name: "Festival", slug: "festival", icon: "music", active: true, sortOrder: 14 },
    { name: "Shows", slug: "shows", icon: "music", active: true, sortOrder: 15 },
    { name: "Encontros", slug: "encontros", icon: "car", active: true, sortOrder: 16 },
    { name: "Carros antigos", slug: "carros-antigos", icon: "car", active: true, sortOrder: 17 },
    { name: "Rebaixados", slug: "rebaixados", icon: "car", active: true, sortOrder: 18 },
    { name: "Som", slug: "som", icon: "music", active: true, sortOrder: 19 },
    { name: "Motos", slug: "motos", icon: "bike", active: true, sortOrder: 20 },
  ]);

  await upsertNamed(prisma, "audience", [
    { name: "Casal", slug: "casal", active: true, sortOrder: 1 },
    { name: "Família", slug: "familia", active: true, sortOrder: 2 },
    { name: "Amigos", slug: "amigos", active: true, sortOrder: 3 },
    { name: "Elegante, Sofisticado", slug: "elegante-sofisticado", active: true, sortOrder: 10 },
    { name: "Casuais e Família", slug: "casuais-e-familia", active: true, sortOrder: 11 },
  ]);

  await upsertNamed(prisma, "amenity", [
    { name: "Estacionamento", slug: "estacionamento", active: true, sortOrder: 1 },
    { name: "Área externa", slug: "area-externa", active: true, sortOrder: 2 },
    { name: "Espaço infantil", slug: "espaco-infantil", active: true, sortOrder: 3 },
    { name: "Pet friendly", slug: "pet-friendly", active: true, sortOrder: 4 },
    { name: "Acessibilidade", slug: "acessibilidade", active: true, sortOrder: 5 },
    { name: "Área coberta", slug: "area-coberta", active: true, sortOrder: 6 },
    { name: "Ar-condicionado", slug: "ar-condicionado", active: true, sortOrder: 7 },
  ]);

  await upsertNamed(prisma, "musicGenre", [
    { name: "Sertanejo", slug: "sertanejo", active: true, sortOrder: 1 },
    { name: "Rock", slug: "rock", active: true, sortOrder: 2 },
    { name: "Pop Rock", slug: "pop-rock", active: true, sortOrder: 3 },
    { name: "Pagode", slug: "pagode", active: true, sortOrder: 4 },
    { name: "Samba", slug: "samba", active: true, sortOrder: 5 },
    { name: "MPB", slug: "mpb", active: true, sortOrder: 6 },
    { name: "Forró", slug: "forro", active: true, sortOrder: 7 },
    { name: "Eletrônica", slug: "eletronica", active: true, sortOrder: 8 },
    { name: "Outros", slug: "outros", active: true, sortOrder: 99 },
    { name: "Pop Rock Clássicos / Internacional", slug: "pop-rock-classicos-internacional", active: true, sortOrder: 10 },
    { name: "Pagode/Samba", slug: "pagode-samba", active: true, sortOrder: 11 },
    { name: "Jazz", slug: "jazz", active: true, sortOrder: 12 },
    { name: "Bossa nova", slug: "bossa-nova", active: true, sortOrder: 13 },
    { name: "Clássicas", slug: "classicas", active: true, sortOrder: 14 },
    { name: "Lounge", slug: "lounge", active: true, sortOrder: 15 },
    { name: "Eletrônicas", slug: "eletronicas", active: true, sortOrder: 16 },
    { name: "Bandas/Grupo", slug: "bandas-grupo", active: true, sortOrder: 17 },
    { name: "Anos 80", slug: "anos-80", active: true, sortOrder: 18 },
    { name: "Acústico", slug: "acustico", active: true, sortOrder: 19 },
    { name: "Misto", slug: "misto", active: true, sortOrder: 20 },
  ]);

  const plans = [
    {
      slug: "normal-basic",
      name: "Normal Basic",
      dailyPriceCents: 500,
      showPhoto: true,
      showInstagram: false,
      showWebsite: false,
      showMap: false,
      showArtist: false,
      showArtistInstagram: false,
      highlighted: false,
      priority: 0,
      active: true,
    },
    {
      slug: "normal-plus",
      name: "Normal Plus",
      dailyPriceCents: 700,
      showPhoto: true,
      showInstagram: true,
      showWebsite: true,
      showMap: true,
      showArtist: true,
      showArtistInstagram: false,
      highlighted: false,
      priority: 10,
      active: true,
    },
    {
      slug: "destaque",
      name: "Destaque",
      dailyPriceCents: 1500,
      showPhoto: true,
      showInstagram: true,
      showWebsite: true,
      showMap: true,
      showArtist: true,
      showArtistInstagram: true,
      highlighted: true,
      priority: 50,
      active: true,
    },
    {
      slug: "patrocinado",
      name: "Patrocinado",
      dailyPriceCents: null,
      showPhoto: true,
      showInstagram: true,
      showWebsite: true,
      showMap: true,
      showArtist: true,
      showArtistInstagram: true,
      highlighted: true,
      priority: 100,
      active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.commercialPlan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
  }

  const cityMap = Object.fromEntries(
    (await prisma.city.findMany()).map((city) => [city.slug, city]),
  );
  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((item) => [item.slug, item]),
  );
  const audienceMap = Object.fromEntries(
    (await prisma.audience.findMany()).map((item) => [item.slug, item]),
  );
  const amenityMap = Object.fromEntries(
    (await prisma.amenity.findMany()).map((item) => [item.slug, item]),
  );
  const genreMap = Object.fromEntries(
    (await prisma.musicGenre.findMany()).map((item) => [item.slug, item]),
  );
  const planMap = Object.fromEntries(
    (await prisma.commercialPlan.findMany()).map((item) => [item.slug, item]),
  );

  const adminEmail = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const partnerEmail = (process.env.SEED_PARTNER_EMAIL ?? "carol.w@example.org").toLowerCase();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      email: adminEmail,
      passwordHash: await hash(requireEnv("SEED_ADMIN_PASSWORD")),
      role: "ADMIN",
      active: true,
    },
    update: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      passwordHash: await hash(requireEnv("SEED_ADMIN_PASSWORD")),
      active: true,
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: partnerEmail },
    create: {
      name: process.env.SEED_PARTNER_NAME ?? "Parceiro 019",
      email: partnerEmail,
      passwordHash: await hash(process.env.SEED_PARTNER_PASSWORD ?? "Agito019!partner"),
      role: "PARTNER",
      active: true,
    },
    update: {
      name: process.env.SEED_PARTNER_NAME ?? "Parceiro 019",
      passwordHash: await hash(process.env.SEED_PARTNER_PASSWORD ?? "Agito019!partner"),
      role: "PARTNER",
      active: true,
    },
  });

  async function upsertDemoMedia(path: string, altText: string) {
    const existing = await prisma.media.findFirst({ where: { path } });
    if (existing) {
      return existing;
    }
    const landscape = path.includes("banner") || path.includes("venue");
    return prisma.media.create({
      data: {
        path,
        thumbnailPath: path,
        mimeType: "image/png",
        width: 1024,
        height: landscape ? 576 : 1024,
        fileSize: 250000,
        altText,
      },
    });
  }

  const establishmentsSeed = [
    {
      name: "Boteco 019",
      slug: "boteco-019",
      shortDescription: "Boteco de esquina com chopp gelado e palco no fundo.",
      description:
        "O Boteco 019 é o clássico ponto de encontro do Cambuí. Mesa de plástico, petisco caprichado e música ao vivo no fim de semana.",
      phone: "1932510190",
      whatsapp: "5519991002019",
      instagramUrl: "https://instagram.com/boteco019",
      websiteUrl: null,
      addressStreet: "Rua das Palmeiras",
      addressNumber: "190",
      neighborhood: "Cambuí",
      postalCode: "13025-190",
      cityId: cityMap.campinas!.id,
      latitude: -22.8925,
      longitude: -47.0573,
      status: "PUBLISHED" as const,
      hasMusic: true,
      categorySlugs: ["boteco", "bar", "bares"],
      audienceSlugs: ["casal", "amigos"],
      amenitySlugs: ["area-externa", "pet-friendly"],
      coverPath: "demo/venue-boteco-019.png",
    },
    {
      name: "Estação Campinas",
      slug: "estacao-campinas",
      shortDescription: "Casa de shows no centro, com palco grande e bar completo.",
      description:
        "A Estação Campinas recebe bandas, DJs e festivais menores. Pista, mezanino e uma programação que muda toda semana.",
      phone: "1932548800",
      whatsapp: "5519988000190",
      instagramUrl: "https://instagram.com/estacaocampinas",
      websiteUrl: "https://estacaocampinas.example",
      addressStreet: "Avenida Francisco Glicério",
      addressNumber: "900",
      neighborhood: "Centro",
      postalCode: "13012-000",
      cityId: cityMap.campinas!.id,
      latitude: -22.9058,
      longitude: -47.0608,
      status: "PUBLISHED" as const,
      hasMusic: true,
      categorySlugs: ["casa-de-shows", "balada", "baladas", "shows"],
      audienceSlugs: ["amigos"],
      amenitySlugs: ["estacionamento", "acessibilidade", "ar-condicionado"],
      coverPath: "demo/venue-estacao-campinas.png",
    },
    {
      name: "Sunset Pub",
      slug: "sunset-pub",
      shortDescription: "Pub com craft beer e palco intimista em Valinhos.",
      description:
        "O Sunset Pub mistura cerveja artesanal, burger e pop rock. Ideal para casal e happy hour estendido.",
      phone: "1938442211",
      whatsapp: "5519977000190",
      instagramUrl: "https://instagram.com/sunsetpub019",
      websiteUrl: null,
      addressStreet: "Rua Antonio Carlos",
      addressNumber: "45",
      neighborhood: "Vila Santana",
      postalCode: "13270-000",
      cityId: cityMap.valinhos!.id,
      latitude: -22.9706,
      longitude: -46.9958,
      status: "PUBLISHED" as const,
      hasMusic: true,
      categorySlugs: ["pub", "bar", "bares"],
      audienceSlugs: ["casal", "amigos"],
      amenitySlugs: ["area-coberta", "ar-condicionado"],
      coverPath: "demo/venue-sunset-pub.png",
    },
    {
      name: "Arena 019",
      slug: "arena-019",
      shortDescription: "Espaço aberto para festas, food trucks e encontros.",
      description:
        "A Arena 019 em Hortolândia abre o pátio para festas temáticas, DJs e encontros de carros no fim de mês.",
      phone: "1938091019",
      whatsapp: "5519966000190",
      instagramUrl: "https://instagram.com/arena019",
      websiteUrl: null,
      addressStreet: "Avenida Santana",
      addressNumber: "2500",
      neighborhood: "Remanso Campineiro",
      postalCode: "13184-000",
      cityId: cityMap.hortolandia!.id,
      latitude: -22.8583,
      longitude: -47.22,
      status: "PUBLISHED" as const,
      hasMusic: false,
      categorySlugs: ["outros", "casa-de-shows", "encontros", "carros-antigos"],
      audienceSlugs: ["familia", "amigos"],
      amenitySlugs: ["estacionamento", "espaco-infantil", "area-externa"],
      coverPath: "demo/venue-arena-019.png",
    },
    {
      name: "Mesa da Vila",
      slug: "mesa-da-vila",
      shortDescription: "Restaurante caseiro com almoço estendido e jantar leve.",
      description:
        "A Mesa da Vila em Sumaré é o recado certo para família: prato feito caprichado, área kids e música baixa no sábado.",
      phone: "1938644411",
      whatsapp: "5519955000190",
      instagramUrl: "https://instagram.com/mesadavila",
      websiteUrl: null,
      addressStreet: "Rua das Acácias",
      addressNumber: "78",
      neighborhood: "Vila Yolanda",
      postalCode: "13170-000",
      cityId: cityMap.sumare!.id,
      latitude: -22.8219,
      longitude: -47.2668,
      status: "PUBLISHED" as const,
      hasMusic: false,
      categorySlugs: ["restaurante", "restaurantes"],
      audienceSlugs: ["familia", "casal", "casuais-e-familia"],
      amenitySlugs: ["espaco-infantil", "acessibilidade", "ar-condicionado"],
      coverPath: "demo/venue-mesa-da-vila.png",
    },
    {
      name: "Forró da Praça",
      slug: "forro-da-praca",
      shortDescription: "Bar de esquina em Americana com sanfona no fim de semana.",
      description:
        "O Forró da Praça em Americana recebe sanfoneiros e forró pé de serra. Mesa de plástico, caldinho e pista improvisada.",
      phone: "1934619019",
      whatsapp: "5519944000190",
      instagramUrl: "https://instagram.com/forrodapraca019",
      websiteUrl: null,
      addressStreet: "Rua Washington Luiz",
      addressNumber: "320",
      neighborhood: "Centro",
      postalCode: "13465-000",
      cityId: cityMap.americana!.id,
      latitude: -22.7389,
      longitude: -47.3314,
      status: "PUBLISHED" as const,
      hasMusic: true,
      categorySlugs: ["boteco", "bar", "bares"],
      audienceSlugs: ["amigos", "casal"],
      amenitySlugs: ["area-externa", "estacionamento"],
      coverPath: "demo/venue-forro-da-praca.png",
    },
  ];

  const establishmentIds: Record<string, string> = {};

  for (const item of establishmentsSeed) {
    const { categorySlugs, audienceSlugs, amenitySlugs, coverPath, ...data } = item;
    const saved = await prisma.establishment.upsert({
      where: { slug: data.slug },
      create: data,
      update: { ...data, deletedAt: null },
    });
    establishmentIds[data.slug] = saved.id;

    await prisma.establishmentCategory.deleteMany({ where: { establishmentId: saved.id } });
    await prisma.establishmentAudience.deleteMany({ where: { establishmentId: saved.id } });
    await prisma.establishmentAmenity.deleteMany({ where: { establishmentId: saved.id } });
    await prisma.businessHour.deleteMany({ where: { establishmentId: saved.id } });

    await prisma.establishmentCategory.createMany({
      data: categorySlugs.map((slug) => ({
        establishmentId: saved.id,
        categoryId: categoryMap[slug]!.id,
      })),
    });
    await prisma.establishmentAudience.createMany({
      data: audienceSlugs.map((slug) => ({
        establishmentId: saved.id,
        audienceId: audienceMap[slug]!.id,
      })),
    });
    await prisma.establishmentAmenity.createMany({
      data: amenitySlugs.map((slug) => ({
        establishmentId: saved.id,
        amenityId: amenityMap[slug]!.id,
      })),
    });

    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as const;
    await prisma.businessHour.createMany({
      data: days.map((dayOfWeek) => {
        const closed = dayOfWeek === "MONDAY";
        return {
          establishmentId: saved.id,
          dayOfWeek,
          closed,
          opensAt: closed ? null : timeOn(new Date(), dayOfWeek === "SUNDAY" ? 15 : 18),
          closesAt: closed ? null : timeOn(new Date(), 2),
        };
      }),
    });

    const media = await upsertDemoMedia(coverPath, `Foto ilustrativa de ${data.name}`);
    await prisma.establishmentMedia.deleteMany({ where: { establishmentId: saved.id } });
    await prisma.establishmentMedia.create({
      data: { establishmentId: saved.id, mediaId: media.id, isCover: true, sortOrder: 0 },
    });
  }

  const artistsSeed = [
    {
      name: "Banda Sunset",
      slug: "banda-sunset",
      type: "BAND" as const,
      bio: "Quarteto de pop rock campineiro. Setlist entre clássicos nacionais e autorais.",
      instagramUrl: "https://instagram.com/bandasunset019",
      whatsapp: "5519991112019",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      hireUrl: null as string | null,
      cityId: cityMap.campinas!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["pop-rock", "rock"],
      coverPath: "demo/artist-banda-sunset.png",
    },
    {
      name: "DJ Aurora",
      slug: "dj-aurora",
      type: "DJ" as const,
      bio: "Sets de eletrônica e remixes brasileiros para pista e rooftop.",
      instagramUrl: "https://instagram.com/djaurora019",
      whatsapp: "5519992222019",
      videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      hireUrl: "https://wa.me/5519992222019",
      cityId: cityMap.campinas!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["eletronica"],
      coverPath: "demo/artist-dj-aurora.png",
    },
    {
      name: "João do Pagode",
      slug: "joao-do-pagode",
      type: "SOLO" as const,
      bio: "Voz e cavaquinho. Pagode de mesa e samba de raiz nas terças e sábados.",
      instagramUrl: "https://instagram.com/joaodopagode",
      whatsapp: "5519993332019",
      videoUrl: null as string | null,
      hireUrl: null as string | null,
      cityId: cityMap.hortolandia!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["pagode", "samba"],
      coverPath: "demo/artist-joao-pagode.png",
    },
    {
      name: "Luiza Viola",
      slug: "luiza-viola",
      type: "SOLO" as const,
      bio: "Sertanejo e MPB acústica para jantar e fim de tarde.",
      instagramUrl: "https://instagram.com/luizaviola",
      whatsapp: "5519994442019",
      videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      hireUrl: null as string | null,
      cityId: cityMap.valinhos!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["sertanejo", "mpb"],
      coverPath: "demo/artist-luiza-viola.png",
    },
    {
      name: "Duo Cambuí",
      slug: "duo-cambui",
      type: "DUO" as const,
      bio: "Voz e violão no Cambuí. MPB e pop intimista para casal e happy hour.",
      instagramUrl: "https://instagram.com/duocambui019",
      whatsapp: "5519995552019",
      videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      hireUrl: null as string | null,
      cityId: cityMap.campinas!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["mpb", "pop-rock"],
      coverPath: "demo/artist-duo-cambui.png",
    },
    {
      name: "Zé Sanfona",
      slug: "ze-sanfona",
      type: "SOLO" as const,
      bio: "Forró pé de serra e sanfona aberta para tarde de domingo.",
      instagramUrl: "https://instagram.com/zesanfona019",
      whatsapp: "5519996662019",
      videoUrl: null as string | null,
      hireUrl: "https://wa.me/5519996662019",
      cityId: cityMap.americana!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["forro"],
      coverPath: "demo/artist-ze-sanfona.png",
    },
    {
      name: "Trio Jardim",
      slug: "trio-jardim",
      type: "BAND" as const,
      bio: "Jazz de jantar. Clima elegante e sofisticado para a mesa.",
      instagramUrl: "https://instagram.com/triojardim019",
      whatsapp: "5519997772019",
      videoUrl: null as string | null,
      hireUrl: null as string | null,
      cityId: cityMap.campinas!.id,
      status: "PUBLISHED" as const,
      genreSlugs: ["jazz"],
      coverPath: "demo/artist-duo-cambui.png",
    },
  ];

  const artistIds: Record<string, string> = {};
  for (const item of artistsSeed) {
    const { genreSlugs, coverPath, ...data } = item;
    const saved = await prisma.artist.upsert({
      where: { slug: data.slug },
      create: data,
      update: { ...data, deletedAt: null },
    });
    artistIds[data.slug] = saved.id;
    await prisma.artistGenre.deleteMany({ where: { artistId: saved.id } });
    await prisma.artistGenre.createMany({
      data: genreSlugs.map((slug) => ({ artistId: saved.id, genreId: genreMap[slug]!.id })),
    });
    const media = await upsertDemoMedia(coverPath, `Foto ilustrativa de ${data.name}`);
    await prisma.artistMedia.deleteMany({ where: { artistId: saved.id } });
    await prisma.artistMedia.create({
      data: { artistId: saved.id, mediaId: media.id, isCover: true, sortOrder: 0 },
    });
  }

  await prisma.userEstablishment.upsert({
    where: {
      userId_establishmentId: {
        userId: partner.id,
        establishmentId: establishmentIds["boteco-019"]!,
      },
    },
    create: { userId: partner.id, establishmentId: establishmentIds["boteco-019"]! },
    update: {},
  });

  await prisma.userArtist.upsert({
    where: {
      userId_artistId: {
        userId: partner.id,
        artistId: artistIds["banda-sunset"]!,
      },
    },
    create: { userId: partner.id, artistId: artistIds["banda-sunset"]! },
    update: {},
  });

  const today = todayInSaoPaulo();
  const thursday = nextWeekday(today, 4);
  const friday = nextWeekday(today, 5);
  const saturday = nextWeekday(today, 6);
  const sunday = nextWeekday(today, 0);

  const eventsSeed = [
    {
      slug: "sunset-no-boteco-hoje",
      title: "Banda Sunset no Boteco 019",
      description: "Pop rock ao vivo no palco do fundo. Chopp em dobro até 22h.",
      establishmentId: establishmentIds["boteco-019"]!,
      eventType: "LIVE_MUSIC" as const,
      startAt: saoPauloDateTime(today.year, today.month, today.day, 20, 0),
      endAt: saoPauloDateTime(today.year, today.month, today.day, 23, 30),
      agendaStatus: "CONFIRMED" as const,
      entryPriceType: "COUVERT" as const,
      entryPriceCents: 2000,
      artistSlugs: ["banda-sunset"],
      genreSlugs: ["pop-rock"],
      coverPath: "demo/banner-rock-noite.png",
    },
    {
      slug: "aurora-na-estacao",
      title: "DJ Aurora na Estação Campinas",
      description: "Pista aberta com set de eletrônica até tarde.",
      establishmentId: establishmentIds["estacao-campinas"]!,
      eventType: "PARTY" as const,
      startAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 23, 0),
      endAt: saoPauloDateTime(addDays(saturday, 1).year, addDays(saturday, 1).month, addDays(saturday, 1).day, 5, 0),
      agendaStatus: "CONFIRMED" as const,
      entryPriceType: "FROM" as const,
      entryPriceCents: 4000,
      artistSlugs: ["dj-aurora"],
      genreSlugs: ["eletronica"],
      coverPath: "demo/banner-dj-rooftop.png",
    },
    {
      slug: "pagode-na-arena",
      title: "Pagode na Arena 019",
      description: "Tarde de pagode, food trucks e espaço para a família.",
      establishmentId: establishmentIds["arena-019"]!,
      eventType: "LIVE_MUSIC" as const,
      startAt: saoPauloDateTime(sunday.year, sunday.month, sunday.day, 16, 0),
      endAt: saoPauloDateTime(sunday.year, sunday.month, sunday.day, 20, 0),
      agendaStatus: "PENDING" as const,
      entryPriceType: "FREE" as const,
      entryPriceCents: null as number | null,
      artistSlugs: ["joao-do-pagode"],
      genreSlugs: ["pagode", "samba"],
      coverPath: "demo/banner-palco-vermelho.png",
    },
    {
      slug: "luiza-no-sunset",
      title: "Luiza Viola no Sunset Pub",
      description: "Sertanejo e MPB para o jantar de sexta.",
      establishmentId: establishmentIds["sunset-pub"]!,
      eventType: "LIVE_MUSIC" as const,
      startAt: saoPauloDateTime(friday.year, friday.month, friday.day, 21, 0),
      endAt: saoPauloDateTime(friday.year, friday.month, friday.day, 23, 30),
      agendaStatus: "CONFIRMED" as const,
      entryPriceType: "UP_TO" as const,
      entryPriceCents: 3000,
      artistSlugs: ["luiza-viola"],
      genreSlugs: ["sertanejo", "mpb"],
      coverPath: "demo/banner-palco-vermelho.png",
    },
    {
      slug: "encontro-arena",
      title: "Encontro 019 na Arena",
      description: "Carros, som e food park. Entrada familiar até 18h. [modalidade:encontros-de-carros]",
      establishmentId: establishmentIds["arena-019"]!,
      eventType: "CAR_MEET" as const,
      startAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 14, 0),
      endAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 18, 0),
      agendaStatus: "OUTDATED" as const,
      entryPriceType: "TICKET" as const,
      entryPriceCents: 1500,
      artistSlugs: ["dj-aurora"],
      genreSlugs: ["eletronica"],
      coverPath: "demo/banner-dj-rooftop.png",
    },
    {
      slug: "duo-cambui-hoje",
      title: "Duo Cambuí no Boteco 019",
      description: "Voz e violão para o começo da noite no Cambuí.",
      establishmentId: establishmentIds["boteco-019"]!,
      eventType: "LIVE_MUSIC" as const,
      startAt: saoPauloDateTime(today.year, today.month, today.day, 18, 30),
      endAt: saoPauloDateTime(today.year, today.month, today.day, 20, 0),
      agendaStatus: "CONFIRMED" as const,
      entryPriceType: "FREE" as const,
      entryPriceCents: null as number | null,
      artistSlugs: ["duo-cambui"],
      genreSlugs: ["mpb"],
      coverPath: "demo/banner-rock-noite.png",
    },
    {
      slug: "ze-sanfona-americana",
      title: "Zé Sanfona no Forró da Praça",
      description: "Forró ao vivo em Americana, com sanfona aberta e caldinho na mesa.",
      establishmentId: establishmentIds["forro-da-praca"]!,
      eventType: "LIVE_MUSIC" as const,
      startAt: saoPauloDateTime(sunday.year, sunday.month, sunday.day, 15, 0),
      endAt: saoPauloDateTime(sunday.year, sunday.month, sunday.day, 18, 0),
      agendaStatus: "PENDING" as const,
      entryPriceType: "COUVERT" as const,
      entryPriceCents: 1000,
      artistSlugs: ["ze-sanfona"],
      genreSlugs: ["forro"],
      coverPath: "demo/banner-palco-vermelho.png",
    },
    {
      slug: "jantar-casual-mesa",
      title: "Jantar casual na Mesa da Vila",
      description: "Jantar em familia, sem musica.",
      establishmentId: establishmentIds["mesa-da-vila"]!,
      eventType: "OTHER" as const,
      startAt: saoPauloDateTime(thursday.year, thursday.month, thursday.day, 19, 0),
      endAt: saoPauloDateTime(thursday.year, thursday.month, thursday.day, 22, 0),
      agendaStatus: "CONFIRMED" as const,
      entryPriceType: "FROM" as const,
      entryPriceCents: 4500,
      artistSlugs: [] as string[],
      genreSlugs: [] as string[],
      coverPath: "demo/venue-mesa-da-vila.png",
    },
  ];

  for (const item of eventsSeed) {
    const { artistSlugs, genreSlugs, coverPath, ...data } = item;
    const hasMusic = data.eventType === "LIVE_MUSIC" || data.eventType === "PARTY";
    const saved = await prisma.event.upsert({
      where: { slug: data.slug },
      create: { ...data, status: "PUBLISHED", hasMusic },
      update: { ...data, status: "PUBLISHED", hasMusic, deletedAt: null },
    });
    await prisma.eventArtist.deleteMany({ where: { eventId: saved.id } });
    await prisma.eventGenre.deleteMany({ where: { eventId: saved.id } });
    if (artistSlugs.length) {
      await prisma.eventArtist.createMany({
        data: artistSlugs.map((slug, index) => ({
          eventId: saved.id,
          artistId: artistIds[slug]!,
          sortOrder: index,
        })),
      });
    }
    if (genreSlugs.length) {
      await prisma.eventGenre.createMany({
        data: genreSlugs.map((slug) => ({ eventId: saved.id, genreId: genreMap[slug]!.id })),
      });
    }
    const media = await upsertDemoMedia(coverPath, `Banner ilustrativo de ${data.title}`);
    await prisma.eventMedia.deleteMany({ where: { eventId: saved.id } });
    await prisma.eventMedia.create({
      data: { eventId: saved.id, mediaId: media.id, isCover: true, sortOrder: 0 },
    });
  }

  const promotionsSeed = [
    {
      slugKey: "chopp-em-dobro-boteco",
      establishmentId: establishmentIds["boteco-019"]!,
      title: "Chopp em dobro",
      description: "Chopp 300ml em dobro das 18h às 22h.",
    },
    {
      slugKey: "combo-sunset",
      establishmentId: establishmentIds["sunset-pub"]!,
      title: "Combo por R$ 49,90",
      description: "Burger + drink da casa.",
    },
    {
      slugKey: "caipirinha-mesa",
      establishmentId: establishmentIds["mesa-da-vila"]!,
      title: "Caipirinha em dobro",
      description: "Válido no jantar de sexta e sábado.",
    },
  ];

  for (const promo of promotionsSeed) {
    const existing = await prisma.promotion.findFirst({
      where: { establishmentId: promo.establishmentId, title: promo.title },
    });
    const payload = {
      establishmentId: promo.establishmentId,
      title: promo.title,
      description: promo.description,
      startsAt: saoPauloDateTime(today.year, today.month, today.day, 0, 0),
      endsAt: saoPauloDateTime(addDays(today, 14).year, addDays(today, 14).month, addDays(today, 14).day, 23, 59),
      active: true,
      deletedAt: null,
    };
    if (existing) {
      await prisma.promotion.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.promotion.create({ data: payload });
    }
  }

  const campaignPairs = [
    {
      planSlug: "destaque",
      establishmentId: establishmentIds["boteco-019"]!,
      unitPriceCents: 1500,
      notes: "Destaque da semana: Boteco 019",
    },
    {
      planSlug: "patrocinado",
      establishmentId: establishmentIds["estacao-campinas"]!,
      unitPriceCents: 3500,
      notes: "Patrocínio negociado: Estação Campinas",
    },
    {
      planSlug: "normal-plus",
      artistId: artistIds["banda-sunset"]!,
      unitPriceCents: 700,
      notes: "Plus da Banda Sunset",
    },
  ];

  for (const campaign of campaignPairs) {
    const existing = await prisma.commercialCampaign.findFirst({
      where: {
        notes: campaign.notes,
      },
    });
    const payload = {
      commercialPlanId: planMap[campaign.planSlug]!.id,
      establishmentId: campaign.establishmentId ?? null,
      artistId: campaign.artistId ?? null,
      startsAt: saoPauloDateTime(today.year, today.month, today.day, 0, 0),
      endsAt: saoPauloDateTime(addDays(today, 10).year, addDays(today, 10).month, addDays(today, 10).day, 23, 59),
      unitPriceCents: campaign.unitPriceCents,
      totalPriceCents: campaign.unitPriceCents * 10,
      paymentStatus: "PAID" as const,
      notes: campaign.notes,
    };
    if (existing) {
      await prisma.commercialCampaign.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.commercialCampaign.create({ data: payload });
    }
  }

  const flowCities = [
    "campinas",
    "valinhos",
    "vinhedo",
    "louveira",
    "jundiai",
    "paulinia",
    "sumare",
    "hortolandia",
    "indaiatuba",
    "cosmopolis",
  ] as const;
  const flowPoints: Record<(typeof flowCities)[number], { lat: number; lng: number; neighborhood: string; name: string }> = {
    campinas: { lat: -22.9056, lng: -47.0608, neighborhood: "Cambuí", name: "Campinas" },
    valinhos: { lat: -22.9706, lng: -46.9958, neighborhood: "Centro", name: "Valinhos" },
    vinhedo: { lat: -23.0298, lng: -46.9753, neighborhood: "Centro", name: "Vinhedo" },
    louveira: { lat: -23.0856, lng: -46.9506, neighborhood: "Centro", name: "Louveira" },
    jundiai: { lat: -23.1857, lng: -46.8978, neighborhood: "Centro", name: "Jundiaí" },
    paulinia: { lat: -22.7611, lng: -47.1542, neighborhood: "Centro", name: "Paulínia" },
    sumare: { lat: -22.8219, lng: -47.2669, neighborhood: "Centro", name: "Sumaré" },
    hortolandia: { lat: -22.8583, lng: -47.22, neighborhood: "Centro", name: "Hortolândia" },
    indaiatuba: { lat: -23.0903, lng: -47.2181, neighborhood: "Centro", name: "Indaiatuba" },
    cosmopolis: { lat: -22.6458, lng: -47.1961, neighborhood: "Centro", name: "Cosmópolis" },
  };
  const flowWeekday: Record<(typeof flowCities)[number], number> = {
    campinas: 3,
    valinhos: 4,
    vinhedo: 5,
    louveira: 5,
    jundiai: 4,
    paulinia: 6,
    sumare: 0,
    hortolandia: 6,
    indaiatuba: 6,
    cosmopolis: 0,
  };
  const baladaGenre: Record<(typeof flowCities)[number], string> = {
    campinas: "eletronicas",
    valinhos: "rock",
    vinhedo: "pop-rock",
    louveira: "sertanejo",
    jundiai: "samba",
    paulinia: "pagode",
    sumare: "anos-80",
    hortolandia: "eletronicas",
    indaiatuba: "rock",
    cosmopolis: "pop-rock",
  };
  const flowKinds = [
    {
      key: "bar",
      placeSlug: "bar-sertanejo",
      eventSlug: "show-sertanejo",
      placeName: "Bar Sertanejo",
      eventTitle: "Sertanejo ao vivo",
      description: "Noite de sertanejo com música ao vivo.",
      categories: ["bares", "bar"],
      audiences: ["amigos"],
      genres: ["sertanejo"],
      hasMusic: true,
      eventType: "LIVE_MUSIC" as const,
      artist: "luiza-viola",
      cover: "demo/venue-boteco-019.png",
      banner: "demo/banner-rock-noite.png",
      priceType: "COUVERT" as const,
      priceCents: 2500,
    },
    {
      key: "jazz",
      placeSlug: "restaurante-jazz",
      eventSlug: "jantar-jazz",
      placeName: "Restaurante Jazz",
      eventTitle: "Jazz no jantar",
      description: "Jantar com jazz. Clima elegante e sofisticado.",
      categories: ["restaurantes", "restaurante"],
      audiences: ["elegante-sofisticado", "casal"],
      genres: ["jazz"],
      hasMusic: true,
      eventType: "LIVE_MUSIC" as const,
      artist: "trio-jardim",
      cover: "demo/venue-mesa-da-vila.png",
      banner: "demo/banner-palco-vermelho.png",
      priceType: "FROM" as const,
      priceCents: 8000,
    },
    {
      key: "balada",
      placeSlug: "balada-eletronica",
      eventSlug: "pista-eletronica",
      placeName: "Balada Eletrônica",
      eventTitle: "Pista eletrônica",
      description: "Pista de música eletrônica.",
      categories: ["baladas", "balada"],
      audiences: ["amigos"],
      genres: ["eletronicas"],
      hasMusic: true,
      eventType: "PARTY" as const,
      artist: "dj-aurora",
      cover: "demo/venue-estacao-campinas.png",
      banner: "demo/banner-dj-rooftop.png",
      priceType: "TICKET" as const,
      priceCents: 5000,
    },
    {
      key: "carros",
      placeSlug: "encontro-carros",
      eventSlug: "encontro-carros-antigos",
      placeName: "Encontro de Carros",
      eventTitle: "Encontro de carros antigos",
      description: "Encontro de carros antigos, rebaixados e som.",
      categories: ["encontros", "carros-antigos"],
      audiences: ["amigos"],
      genres: [] as string[],
      hasMusic: false,
      eventType: "CAR_MEET" as const,
      artist: null as string | null,
      cover: "demo/venue-arena-019.png",
      banner: "demo/venue-arena-019.png",
      priceType: "FREE" as const,
      priceCents: null as number | null,
    },
    {
      key: "bar-sem",
      placeSlug: "bar-sem-musica",
      eventSlug: "noite-sem-musica",
      placeName: "Bar sem Musica",
      eventTitle: "Noite tranquila",
      description: "Bar para conversar, sem musica.",
      categories: ["bares", "bar"],
      audiences: ["casal", "amigos"],
      genres: [] as string[],
      hasMusic: false,
      eventType: "OTHER" as const,
      artist: null as string | null,
      cover: "demo/venue-boteco-019.png",
      banner: "demo/venue-boteco-019.png",
      priceType: "FREE" as const,
      priceCents: null as number | null,
    },
  ];

  const hourDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
  for (const citySlug of flowCities) {
    const point = flowPoints[citySlug];
    const cityId = cityMap[citySlug]!.id;
    for (const [index, kind] of flowKinds.entries()) {
      if (kind.key === "bar-sem" && citySlug !== "louveira" && citySlug !== "campinas") {
        continue;
      }
      const placeSlug = `${kind.placeSlug}-${citySlug}`;
      const casualCity = citySlug === "louveira" || citySlug === "sumare" || citySlug === "cosmopolis";
      const audiences =
        kind.key === "jazz"
          ? casualCity
            ? ["casuais-e-familia", "familia"]
            : ["elegante-sofisticado", "casal"]
          : kind.audiences;
      const genres = kind.key === "balada" ? [baladaGenre[citySlug]] : kind.genres;
      const saved = await prisma.establishment.upsert({
        where: { slug: placeSlug },
        create: {
          name: `${kind.placeName} ${point.name}`,
          slug: placeSlug,
          shortDescription: kind.description,
          description: kind.description,
          neighborhood: point.neighborhood,
          cityId,
          latitude: point.lat + index * 0.004,
          longitude: point.lng + index * 0.004,
          status: "PUBLISHED",
          hasMusic: kind.hasMusic,
        },
        update: {
          name: `${kind.placeName} ${point.name}`,
          shortDescription: kind.description,
          description: kind.description,
          neighborhood: point.neighborhood,
          cityId,
          latitude: point.lat + index * 0.004,
          longitude: point.lng + index * 0.004,
          status: "PUBLISHED",
          hasMusic: kind.hasMusic,
          deletedAt: null,
        },
      });
      await prisma.establishmentCategory.deleteMany({ where: { establishmentId: saved.id } });
      await prisma.establishmentAudience.deleteMany({ where: { establishmentId: saved.id } });
      await prisma.establishmentGenre.deleteMany({ where: { establishmentId: saved.id } });
      await prisma.businessHour.deleteMany({ where: { establishmentId: saved.id } });
      await prisma.establishmentCategory.createMany({
        data: kind.categories.map((slug) => ({
          establishmentId: saved.id,
          categoryId: categoryMap[slug]!.id,
        })),
      });
      await prisma.establishmentAudience.createMany({
        data: audiences.map((slug) => ({
          establishmentId: saved.id,
          audienceId: audienceMap[slug]!.id,
        })),
      });
      if (genres.length) {
        await prisma.establishmentGenre.createMany({
          data: genres.map((slug) => ({
            establishmentId: saved.id,
            genreId: genreMap[slug]!.id,
          })),
        });
      }
      await prisma.businessHour.createMany({
        data: hourDays.map((dayOfWeek) => {
          const closed = dayOfWeek === "MONDAY";
          return {
            establishmentId: saved.id,
            dayOfWeek,
            closed,
            opensAt: closed ? null : timeOn(new Date(), 18),
            closesAt: closed ? null : timeOn(new Date(), 2),
          };
        }),
      });
      const placeMedia = await upsertDemoMedia(kind.cover, `Foto ilustrativa de ${kind.placeName} ${point.name}`);
      await prisma.establishmentMedia.deleteMany({ where: { establishmentId: saved.id } });
      await prisma.establishmentMedia.create({
        data: { establishmentId: saved.id, mediaId: placeMedia.id, isCover: true, sortOrder: 0 },
      });

      const when = nextWeekday(today, flowWeekday[citySlug]);
      const eventSlug = `${kind.eventSlug}-${citySlug}`;
      const description =
        kind.eventType === "LIVE_MUSIC"
          ? `${kind.description} [modalidade:apresentacoes-de-bandas]`
          : kind.key === "carros"
            ? `${kind.description} [modalidade:encontros-de-carros]`
            : kind.description;
      const event = await prisma.event.upsert({
        where: { slug: eventSlug },
        create: {
          title: `${kind.eventTitle} em ${point.name}`,
          slug: eventSlug,
          description,
          establishmentId: saved.id,
          eventType: kind.eventType,
          startAt: saoPauloDateTime(when.year, when.month, when.day, 21, 0),
          endAt: saoPauloDateTime(when.year, when.month, when.day, 23, 30),
          status: "PUBLISHED",
          agendaStatus: "CONFIRMED",
          entryPriceType: kind.priceType,
          entryPriceCents: kind.priceCents,
          hasMusic: kind.hasMusic,
        },
        update: {
          title: `${kind.eventTitle} em ${point.name}`,
          description,
          establishmentId: saved.id,
          eventType: kind.eventType,
          startAt: saoPauloDateTime(when.year, when.month, when.day, 21, 0),
          endAt: saoPauloDateTime(when.year, when.month, when.day, 23, 30),
          status: "PUBLISHED",
          agendaStatus: "CONFIRMED",
          entryPriceType: kind.priceType,
          entryPriceCents: kind.priceCents,
          hasMusic: kind.hasMusic,
          deletedAt: null,
        },
      });
      await prisma.eventArtist.deleteMany({ where: { eventId: event.id } });
      await prisma.eventGenre.deleteMany({ where: { eventId: event.id } });
      await prisma.eventAudience.deleteMany({ where: { eventId: event.id } });
      if (kind.artist) {
        await prisma.eventArtist.create({
          data: { eventId: event.id, artistId: artistIds[kind.artist]!, sortOrder: 0 },
        });
      }
      if (genres.length) {
        await prisma.eventGenre.createMany({
          data: genres.map((slug) => ({ eventId: event.id, genreId: genreMap[slug]!.id })),
        });
      }
      await prisma.eventAudience.createMany({
        data: audiences.map((slug) => ({ eventId: event.id, audienceId: audienceMap[slug]!.id })),
      });
      const eventMedia = await upsertDemoMedia(kind.banner, `Banner ilustrativo de ${kind.eventTitle} em ${point.name}`);
      await prisma.eventMedia.deleteMany({ where: { eventId: event.id } });
      await prisma.eventMedia.create({
        data: { eventId: event.id, mediaId: eventMedia.id, isCover: true, sortOrder: 0 },
      });
    }
  }

  const agenda = await prisma.establishment.upsert({
    where: { slug: "agenda-019-campinas" },
    create: {
      name: "Agenda 019 Campinas",
      slug: "agenda-019-campinas",
      shortDescription: "Programação de rua em Campinas.",
      description: "Corridas, teatro, motos, pedal, feira e aula livre.",
      neighborhood: "Centro",
      cityId: cityMap.campinas!.id,
      latitude: -22.907,
      longitude: -47.062,
      status: "PUBLISHED",
      hasMusic: false,
    },
    update: {
      name: "Agenda 019 Campinas",
      shortDescription: "Programação de rua em Campinas.",
      description: "Corridas, teatro, motos, pedal, feira e aula livre.",
      neighborhood: "Centro",
      cityId: cityMap.campinas!.id,
      status: "PUBLISHED",
      hasMusic: false,
      deletedAt: null,
    },
  });
  await prisma.establishmentCategory.deleteMany({ where: { establishmentId: agenda.id } });
  await prisma.establishmentCategory.createMany({
    data: ["outros", "eventos"].map((slug) => ({
      establishmentId: agenda.id,
      categoryId: categoryMap[slug]!.id,
    })),
  });

  const holidayYmd = upcomingHolidayYmds(`${today.year}-${pad(today.month)}-${pad(today.day)}`)[0];
  const holidayParts = holidayYmd?.split("-").map(Number);
  const streetEvents: Array<{ slug: string; title: string; when: { year: number; month: number; day: number }; modality: string }> = [
    { slug: "corrida-019-campinas", title: "Corrida 019", when: nextWeekday(today, 3), modality: "corridas" },
    { slug: "teatro-019-campinas", title: "Teatro no centro", when: nextWeekday(today, 4), modality: "teatro" },
    { slug: "motorcycle-019-campinas", title: "Motorcycle na pista", when: nextWeekday(today, 6), modality: "motos" },
    { slug: "bikecycle-019-campinas", title: "BikeCycle no parque", when: nextWeekday(today, 0), modality: "ciclismo-pedal" },
    { slug: "gastronomia-019-campinas", title: "Feira gastronomica", when: nextWeekday(today, 0), modality: "feiras-gastronomicas" },
  ];
  if (holidayParts?.[0] && holidayParts[1] && holidayParts[2]) {
    streetEvents.push({
      slug: "aula-livre-feriado-campinas",
      title: "Aula livre de feriado",
      when: { year: holidayParts[0], month: holidayParts[1], day: holidayParts[2] },
      modality: "aulas-livre",
    });
  }
  for (const item of streetEvents) {
    const description = `${item.title} em Campinas. [modalidade:${item.modality}]`;
    await prisma.event.upsert({
      where: { slug: item.slug },
      create: {
        title: item.title,
        slug: item.slug,
        description,
        establishmentId: agenda.id,
        eventType: "SPECIAL_EVENT",
        startAt: saoPauloDateTime(item.when.year, item.when.month, item.when.day, 9, 0),
        endAt: saoPauloDateTime(item.when.year, item.when.month, item.when.day, 12, 0),
        status: "PUBLISHED",
        agendaStatus: "CONFIRMED",
        entryPriceType: "FREE",
        hasMusic: false,
      },
      update: {
        title: item.title,
        description,
        establishmentId: agenda.id,
        eventType: "SPECIAL_EVENT",
        startAt: saoPauloDateTime(item.when.year, item.when.month, item.when.day, 9, 0),
        endAt: saoPauloDateTime(item.when.year, item.when.month, item.when.day, 12, 0),
        status: "PUBLISHED",
        agendaStatus: "CONFIRMED",
        entryPriceType: "FREE",
        hasMusic: false,
        deletedAt: null,
      },
    });
  }

  const extraGenres = ["acustico", "misto", "bossa-nova", "classicas", "lounge", "anos-80"] as const;
  for (const genre of extraGenres) {
    const slug = `estacao-${genre}`;
    const title = `${genre} na Estacao Campinas`;
    await prisma.event.upsert({
      where: { slug },
      create: {
        title,
        slug,
        description: `Apresentacao ${genre} na Estacao Campinas. [modalidade:apresentacoes-de-bandas]`,
        establishmentId: establishmentIds["estacao-campinas"]!,
        eventType: "LIVE_MUSIC",
        startAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 21, 0),
        endAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 23, 0),
        status: "PUBLISHED",
        agendaStatus: "CONFIRMED",
        entryPriceType: "COUVERT",
        entryPriceCents: 2000,
        hasMusic: true,
      },
      update: {
        title,
        description: `Apresentacao ${genre} na Estacao Campinas. [modalidade:apresentacoes-de-bandas]`,
        establishmentId: establishmentIds["estacao-campinas"]!,
        eventType: "LIVE_MUSIC",
        startAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 21, 0),
        endAt: saoPauloDateTime(saturday.year, saturday.month, saturday.day, 23, 0),
        status: "PUBLISHED",
        agendaStatus: "CONFIRMED",
        hasMusic: true,
        deletedAt: null,
      },
    });
    const saved = await prisma.event.findUniqueOrThrow({ where: { slug } });
    await prisma.eventGenre.deleteMany({ where: { eventId: saved.id } });
    await prisma.eventGenre.create({
      data: { eventId: saved.id, genreId: genreMap[genre]!.id },
    });
  }

  void admin;
  console.log("Seed AGITO019 concluído.");
  console.log(`Hoje no fuso ${TIMEZONE}: ${today.year}-${pad(today.month)}-${pad(today.day)}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
