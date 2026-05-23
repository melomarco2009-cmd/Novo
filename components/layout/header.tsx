"use client";

import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type HeaderProps = {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
  onMobileMenuOpen?: () => void;
  onSearchOpen: () => void;
  onDesktopToggle: () => void;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header({
  userName,
  userEmail,
  userImage,
  onSearchOpen,
  onDesktopToggle,
}: HeaderProps) {
  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-[#2A2D3A] bg-[#1A1D27] px-4 gap-3">
      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-[#1A1D27] border-[#2A2D3A]">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDesktopToggle}
        className="hidden lg:flex text-muted-foreground hover:text-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {greeting},{" "}
          <span className="text-[#2D7DD2]">{userName ?? "Usuário"}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Busca global (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userImage ?? undefined} alt={userName ?? "Avatar"} />
                <AvatarFallback className="bg-[#2D7DD2]/20 text-[#2D7DD2] text-xs font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium truncate">{userName}</span>
                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
