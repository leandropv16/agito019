import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { publicAssetUrl } from "../common/timezone";

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(file: Express.Multer.File, altText?: string) {
    const stored = await this.storage.saveImage(file.buffer, file.originalname);
    const media = await this.prisma.media.create({
      data: {
        path: stored.path,
        thumbnailPath: stored.thumbnailPath,
        mimeType: stored.mimeType,
        width: stored.width,
        height: stored.height,
        fileSize: stored.fileSize,
        altText: altText ?? null,
      },
    });
    return this.toPublic(media);
  }

  toPublic(media: {
    id: string;
    path: string;
    thumbnailPath: string | null;
    altText: string | null;
    width: number | null;
    height: number | null;
  }, isCover = false) {
    return {
      id: media.id,
      url: publicAssetUrl(media.path),
      thumbnailUrl: publicAssetUrl(media.thumbnailPath),
      altText: media.altText,
      width: media.width,
      height: media.height,
      isCover,
    };
  }
}
