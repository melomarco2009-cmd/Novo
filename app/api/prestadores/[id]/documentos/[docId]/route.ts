import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";

type RouteParams = { params: { id: string; docId: string } };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const doc = await prisma.documentoPrestador.findFirst({
    where: { id: params.docId, userId, prestadorId: params.id },
    include: { upload: { select: { id: true, storagePath: true } } },
  });

  if (!doc) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  // Delete the upload record (cascade deletes DocumentoPrestador)
  await prisma.upload.delete({ where: { id: doc.upload.id } });

  // Remove physical file (best-effort)
  try {
    await unlink(doc.upload.storagePath);
  } catch {
    // File may already be missing — ignore
  }

  return NextResponse.json({ success: true });
}
