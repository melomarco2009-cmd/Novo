import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { lida: true },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      mensagem: true,
      lida: true,
      link: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
