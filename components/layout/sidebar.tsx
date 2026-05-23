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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/servicos", label: "Acessos", icon: KeyRound },
  { href: "/contas", label: "Contas", icon: CreditCard },
  { href: "/prestadores", label: "Prestadores", icon: Users },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/metas", label: "Metas", icon: Target },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative hidden flex-col border-r border-[#2A2D3A] bg-[#1A1D27] transition-all duration-300 lg:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-[#2A2D3A] px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            MyFuckingLife
          </span>
        )}
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-[#2A2D3A] hover:text-foreground"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            const item = (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "",
                  isActive
                    ? "bg-[#2D7DD2]/15 text-[#2D7DD2]"
                    : "text-muted-foreground hover:bg-[#2A2D3A] hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-[#2D7DD2]" : ""
                  )}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={href} delayDuration={0}>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return item;
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
