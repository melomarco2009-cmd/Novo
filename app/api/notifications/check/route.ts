import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { checkNotifications } from "@/lib/notifications/check";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    await checkNotifications(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notifications/check]", err);
    return NextResponse.json({ error: "Erro ao verificar notificações" }, { status: 500 });
  }
}
