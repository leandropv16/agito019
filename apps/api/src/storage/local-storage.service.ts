import { Injectable } from "@nestjs/common";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { storageRoot } from "../common/paths";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { StorageService, type StoredImage } from "./storage.service";
import { AppException } from "../common/errors/app.exception";
import { HttpStatus } from "@nestjs/common";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly root = storageRoot();
  private readonly maxBytes = Number(process.env.MAX_UPLOAD_SIZE ?? 5_242_880);

  async saveImage(buffer: Buffer, _originalName: string): Promise<StoredImage> {
    if (buffer.byteLength > this.maxBytes) {
      throw new AppException("FILE_TOO_LARGE", "Arquivo excede o limite de upload", HttpStatus.BAD_REQUEST);
    }

    const probe = sharp(buffer, { failOn: "none" });
    const meta = await probe.metadata();
    const mime = meta.format === "jpeg" ? "image/jpeg" : meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : null;
    if (!mime || !ALLOWED.has(mime)) {
      throw new AppException("INVALID_IMAGE", "Envie JPEG, PNG ou WEBP", HttpStatus.BAD_REQUEST);
    }

    const id = randomUUID();
    const fileName = `${id}.webp`;
    const thumbName = `thumbs/${id}.webp`;
    await mkdir(join(this.root, "thumbs"), { recursive: true });

    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const thumbnail = await sharp(buffer)
      .rotate()
      .resize({ width: 480, height: 480, fit: "cover" })
      .webp({ quality: 76 })
      .toBuffer();

    await writeFile(join(this.root, fileName), optimized);
    await writeFile(join(this.root, thumbName), thumbnail);
    const info = await sharp(optimized).metadata();

    return {
      path: fileName,
      thumbnailPath: thumbName,
      mimeType: "image/webp",
      width: info.width ?? 0,
      height: info.height ?? 0,
      fileSize: optimized.byteLength,
    };
  }

  async delete(path: string): Promise<void> {
    try {
      await unlink(join(this.root, path));
    } catch {
      // arquivo já ausente
    }
  }
}
