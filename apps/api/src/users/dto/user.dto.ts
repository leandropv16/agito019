import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { USER_ROLES, type UserRole } from "../../common/shared";

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(USER_ROLES)
  role!: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID("4", { each: true })
  establishmentIds?: string[];

  @IsOptional()
  @IsUUID("4", { each: true })
  artistIds?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID("4", { each: true })
  establishmentIds?: string[];

  @IsOptional()
  @IsUUID("4", { each: true })
  artistIds?: string[];
}

export class InvitePartnerDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsUUID("4", { each: true })
  establishmentIds!: string[];
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
