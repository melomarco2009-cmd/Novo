import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { saveUpload, getUploadUrl } from "@/lib/uploads";
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
  }

  try {
    const saved = await saveUpload({
      file,
      userId,
      entityType: "CONTA",
      modulo: "contas",
      categoria: "comprovante",
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
