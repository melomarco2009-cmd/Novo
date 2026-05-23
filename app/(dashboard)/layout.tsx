import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardClientLayout } from "@/components/layout/dashboard-client-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardClientLayout
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
    >
      {children}
    </DashboardClientLayout>
  );
}
