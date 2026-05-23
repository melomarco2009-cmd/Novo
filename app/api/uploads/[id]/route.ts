import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const upload = await prisma.upload.findFirst({
    where: { id: params.id, userId },
    select: { storagePath: true, mimeType: true, originalName: true },
  });

  if (!upload) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(upload.storagePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": upload.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(upload.originalName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("File not found on disk", { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const upload = await prisma.upload.findFirst({
    where: { id: params.id, userId },
    select: { id: true, storagePath: true },
  });

  if (!upload) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.upload.delete({ where: { id: params.id } });

  try {
    await unlink(upload.storagePath);
  } catch {
    // File might already be gone — ignore
  }

  return NextResponse.json({ success: true });
}
