import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { id: string; marcoId: string } };

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const marco = await prisma.marco.findFirst({
    where: { id: params.marcoId, metaId: params.id, userId },
  });
  if (!marco) {
    return NextResponse.json({ error: "Marco não encontrado" }, { status: 404 });
  }

  const novoConcluido = !marco.concluido;

  const updated = await prisma.marco.update({
    where: { id: params.marcoId },
    data: {
      concluido: novoConcluido,
      concluidoEm: novoConcluido ? new Date() : null,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
