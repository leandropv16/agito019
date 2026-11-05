ALTER TABLE "Establishment" ADD COLUMN "hasMusic" BOOLEAN;

CREATE TABLE "EstablishmentGenre" (
    "establishmentId" UUID NOT NULL,
    "genreId" UUID NOT NULL,

    CONSTRAINT "EstablishmentGenre_pkey" PRIMARY KEY ("establishmentId","genreId")
);

CREATE UNIQUE INDEX "EstablishmentGenre_establishmentId_genreId_key" ON "EstablishmentGenre"("establishmentId", "genreId");

ALTER TABLE "Event" ADD COLUMN "hasMusic" BOOLEAN;

CREATE TABLE "EventAudience" (
    "eventId" UUID NOT NULL,
    "audienceId" UUID NOT NULL,

    CONSTRAINT "EventAudience_pkey" PRIMARY KEY ("eventId","audienceId")
);

CREATE UNIQUE INDEX "EventAudience_eventId_audienceId_key" ON "EventAudience"("eventId", "audienceId");

ALTER TABLE "EstablishmentGenre" ADD CONSTRAINT "EstablishmentGenre_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstablishmentGenre" ADD CONSTRAINT "EstablishmentGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "MusicGenre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventAudience" ADD CONSTRAINT "EventAudience_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventAudience" ADD CONSTRAINT "EventAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
