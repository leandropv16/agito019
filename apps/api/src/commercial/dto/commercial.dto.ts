import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { PAYMENT_STATUSES, type PaymentStatus } from "../../common/shared";

export class UpsertPlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  dailyPriceCents?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  showInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  showWebsite?: boolean;

  @IsOptional()
  @IsBoolean()
  showMap?: boolean;

  @IsOptional()
  @IsBoolean()
  showArtist?: boolean;

  @IsOptional()
  @IsBoolean()
  showArtistInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  highlighted?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class CreateCampaignDto {
  @IsUUID()
  commercialPlanId!: string;

  @IsOptional()
  @IsUUID()
  establishmentId?: string | null;

  @IsOptional()
  @IsUUID()
  artistId?: string | null;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsInt()
  @Min(0)
  totalPriceCents!: number;

  @IsOptional()
  @IsEnum(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsUUID()
  commercialPlanId?: string;

  @IsOptional()
  @IsUUID()
  establishmentId?: string | null;

  @IsOptional()
  @IsUUID()
  artistId?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalPriceCents?: number;

  @IsOptional()
  @IsEnum(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export function assertCampaignXor(establishmentId?: string | null, artistId?: string | null) {
  const hasEstablishment = Boolean(establishmentId);
  const hasArtist = Boolean(artistId);
  return hasEstablishment !== hasArtist;
}
