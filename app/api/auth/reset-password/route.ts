import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/hash";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body as {
      token?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 400 }
      );
    }

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 422 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(result.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
