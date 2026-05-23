import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { saveUpload, getUploadUrl } from "@/lib/uploads";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES } from "@/lib/constants";

type RouteParams = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  // Verify meta ownership
  const meta = await prisma.meta.findFirst({ where: { id: params.id, userId } });
  if (!meta) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
  }

  try {
    const saved = await saveUpload({
      file,
      userId,
      entityType: "META",
      entityId: params.id,
      modulo: "metas",
      categoria: "inspiracao",
      allowedMimeTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES],
    });

    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        url: getUploadUrl(saved.id),
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar arquivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
