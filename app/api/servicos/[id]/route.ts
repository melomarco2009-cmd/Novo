import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { servicoPatchSchema } from "@/lib/validations/servicos";
import { encrypt } from "@/lib/crypto/encryption";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.servico.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const servico = await prisma.servico.findFirst({
    where: { id: params.id, userId },
    include: {
      logoUpload: {
        select: {
          id: true,
          storagePath: true,
          originalName: true,
          mimeType: true,
        },
      },
    },
  });

  if (!servico) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senhaEncrypted, senhaIv, senhaAuthTag, ...safeServico } = servico;
  return NextResponse.json({ success: true, data: safeServico });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = servicoPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { senha, logoUploadId, ...rest } = parsed.data;

  // Build crypto update only if password is being changed
  let cryptoUpdate: {
    senhaEncrypted: string;
    senhaIv: string;
    senhaAuthTag: string;
  } | undefined;

  if (senha) {
    const { encrypted, iv, authTag } = encrypt(senha);
    cryptoUpdate = { senhaEncrypted: encrypted, senhaIv: iv, senhaAuthTag: authTag };
  }

  const updated = await prisma.servico.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(cryptoUpdate ?? {}),
      ...(logoUploadId !== undefined ? { logoUploadId: logoUploadId ?? null } : {}),
      url: rest.url !== undefined ? (rest.url ?? null) : undefined,
      observacao: rest.observacao !== undefined ? (rest.observacao ?? null) : undefined,
    },
    include: {
      logoUpload: {
        select: {
          id: true,
          storagePath: true,
          originalName: true,
          mimeType: true,
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senhaEncrypted, senhaIv, senhaAuthTag, ...safeUpdated } = updated;
  return NextResponse.json({ success: true, data: safeUpdated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.servico.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
