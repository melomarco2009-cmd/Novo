import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  UPLOAD_DIR,
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
} from "@/lib/constants";
import type { UploadEntityType } from "@prisma/client";

// AVISO DE PRODUCAO: Em ambientes serverless (Vercel), o sistema de arquivos
// local é efêmero. Arquivos salvos em UPLOAD_DIR (/tmp/uploads) não persistem
// entre diferentes invocações de função. Para produção com uploads persistentes,
// configure um storage externo (Vercel Blob, AWS S3 ou Cloudinary) e substitua
// a função saveUpload abaixo.
//
// Para desenvolvimento local, uploads funcionam normalmente em ./uploads.

export interface SaveUploadOptions {
  file: File;
  userId: string;
  entityType: UploadEntityType;
  entityId?: string;
  modulo: string;
  categoria?: string;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

export interface SavedUpload {
  id: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export async function saveUpload(opts: SaveUploadOptions): Promise<SavedUpload> {
  const {
    file,
    userId,
    entityType,
    entityId,
    modulo,
    categoria,
    allowedMimeTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES],
    maxSizeBytes = MAX_UPLOAD_SIZE_BYTES,
  } = opts;

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / 1024 / 1024);
    throw new Error(`Arquivo muito grande. Máximo permitido: ${maxMb} MB`);
  }

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }

  const ext = extname(file.name).toLowerCase() || ".bin";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${randomSuffix}${ext}`;

  // Em produção serverless, UPLOAD_DIR deve ser /tmp/uploads (ver .env.production).
  // Em desenvolvimento, UPLOAD_DIR é ./uploads (ver .env.example).
  const baseDir = process.env.NODE_ENV === "production"
    ? (process.env.UPLOAD_DIR ?? "/tmp/uploads")
    : join(process.cwd(), UPLOAD_DIR);

  const dir = join(baseDir, modulo);
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const storagePath = join(dir, filename);

  await writeFile(storagePath, buffer);

  const upload = await prisma.upload.create({
    data: {
      userId,
      entityType,
      entityId: entityId ?? null,
      modulo,
      categoria: categoria ?? null,
      originalName: file.name,
      storagePath,
      mimeType: file.type,
      extension: ext,
      sizeBytes: file.size,
      checksum,
    },
  });

  return {
    id: upload.id,
    storagePath,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export function getUploadUrl(uploadId: string): string {
  return `/api/uploads/${uploadId}`;
}
