import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { APP_URL } from "@/lib/constants";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      // Always 200 — don't reveal if email exists or schema is invalid
      return NextResponse.json({ success: true });
    }

    const { email } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unexpired tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate raw token → hash for storage
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetLink = `${APP_URL}/reset-password/${rawToken}`;

    await sendEmail({
      to: email,
      subject: "Recuperação de senha — MyFuckingLife",
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para criar uma nova senha (válido por ${TOKEN_EXPIRY_HOURS}h):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se você não solicitou isso, ignore este email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password]", error);
    // Always 200 to avoid information leakage
    return NextResponse.json({ success: true });
  }
}
