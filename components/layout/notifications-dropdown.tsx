"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  referenciaModulo: string | null;
  createdAt: string;
}

const TIPO_COLOR: Record<NotificationType, string> = {
  INFO: "text-blue-400",
  SUCCESS: "text-green-400",
  WARNING: "text-yellow-400",
  ERROR: "text-red-400",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checking, setChecking] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?pageSize=30");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch {
      // silently ignore
    }
  }, []);

  const triggerCheck = useCallback(async () => {
    setChecking(true);
    try {
      await fetch("/api/notifications/check", { method: "POST" });
      await fetchNotifications();
    } catch {
      // silently ignore
    } finally {
      setChecking(false);
    }
  }, [fetchNotifications]);

  // On mount: trigger check then fetch
  useEffect(() => {
    triggerCheck();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [triggerCheck, fetchNotifications]);

  // Re-fetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  async function handleMarkOne(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    } catch {
      // silently ignore
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch {
      // silently ignore
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.lida) {
      handleMarkOne(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-0 rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {checking && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAll}
              disabled={markingAll}
            >
              {markingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {checking ? "Verificando alertas..." : "Nenhuma notificação"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group",
                    !notification.lida && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0 w-2">
                      {!notification.lida && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span
                          className={cn(
                            "text-xs font-semibold truncate leading-tight",
                            TIPO_COLOR[notification.tipo]
                          )}
                        >
                          {notification.titulo}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.mensagem}
                      </p>
                      {notification.link && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3 text-primary" />
                          <span className="text-[10px] text-primary">Ver detalhes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
