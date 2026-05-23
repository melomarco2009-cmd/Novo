import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto/encryption";

type RouteParams = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const servico = await prisma.servico.findFirst({
    where: { id: params.id, userId },
    select: {
      senhaEncrypted: true,
      senhaIv: true,
      senhaAuthTag: true,
    },
  });

  if (!servico) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const senha = decrypt({
      encrypted: servico.senhaEncrypted,
      iv: servico.senhaIv,
      authTag: servico.senhaAuthTag,
    });
    return NextResponse.json({ success: true, data: { senha } });
  } catch {
    return NextResponse.json(
      { error: "Erro ao descriptografar senha" },
      { status: 500 }
    );
  }
}
