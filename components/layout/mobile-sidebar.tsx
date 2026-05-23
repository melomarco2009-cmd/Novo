"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  KeyRound,
  CreditCard,
  Users,
  ShoppingCart,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos", label: "Acessos", icon: KeyRound },
  { href: "/contas", label: "Contas", icon: CreditCard },
  { href: "/prestadores", label: "Prestadores", icon: Users },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/metas", label: "Metas", icon: Target },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-[#2A2D3A] px-4">
        <span className="text-sm font-semibold tracking-tight">MyFuckingLife</span>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#2D7DD2]/15 text-[#2D7DD2]"
                    : "text-muted-foreground hover:bg-[#2A2D3A] hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#2D7DD2]" : "")} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
