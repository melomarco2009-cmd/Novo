"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CalendarDays,
  KeyRound,
  CreditCard,
  Users,
  ShoppingCart,
  Target,
  Loader2,
} from "lucide-react";

// Static navigation shown when no search query
const staticGroups = [
  {
    heading: "Módulos",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { id: "agenda", label: "Agenda", href: "/agenda", icon: CalendarDays },
      { id: "servicos", label: "Acessos e Assinaturas", href: "/servicos", icon: KeyRound },
      { id: "contas", label: "Contas a Pagar", href: "/contas", icon: CreditCard },
      { id: "prestadores", label: "Prestadores", href: "/prestadores", icon: Users },
      { id: "compras", label: "Lista de Compras", href: "/compras", icon: ShoppingCart },
      { id: "metas", label: "Metas", href: "/metas", icon: Target },
    ],
  },
];

const moduleIcons: Record<string, React.ElementType> = {
  agenda: CalendarDays,
  contas: CreditCard,
  servicos: KeyRound,
  prestadores: Users,
  compras: ShoppingCart,
  metas: Target,
};

const moduleLabels: Record<string, string> = {
  agenda: "Agenda",
  contas: "Contas",
  servicos: "Acessos",
  prestadores: "Prestadores",
  compras: "Compras",
  metas: "Metas",
};

type SearchResultItem = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type SearchResults = Record<string, SearchResultItem[]>;

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  // Debounced real search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setResults(json.data ?? null);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults(null);
      setSearching(false);
    }
  }, [open]);

  function handleSelect(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  const hasQuery = search.trim().length >= 2;
  const hasResults =
    results && Object.values(results).some((arr) => arr.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar em todos os módulos... (mín. 2 caracteres)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {/* Loading */}
        {hasQuery && searching && (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando...
          </div>
        )}

        {/* No results */}
        {hasQuery && !searching && !hasResults && (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        )}

        {/* Real search results */}
        {hasQuery && !searching && hasResults && results && (
          <>
            {Object.entries(results).map(([module, items], i) => {
              if (items.length === 0) return null;
              const Icon = moduleIcons[module] ?? LayoutDashboard;
              const label = moduleLabels[module] ?? module;
              return (
                <div key={module}>
                  {i > 0 && <CommandSeparator />}
                  <CommandGroup heading={label}>
                    {items.map(({ id, label: itemLabel, description, href }) => (
                      <CommandItem
                        key={id}
                        value={`${module}-${id}-${itemLabel}`}
                        onSelect={() => handleSelect(href)}
                        className="cursor-pointer"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate text-sm">{itemLabel}</span>
                          {description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              );
            })}
          </>
        )}

        {/* Static navigation when no query */}
        {!hasQuery &&
          staticGroups.map((group, i) => (
            <div key={group.heading}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.items.map(({ id, label, href, icon: Icon }) => (
                  <CommandItem
                    key={id}
                    value={`${group.heading} ${label}`}
                    onSelect={() => handleSelect(href)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
      </CommandList>
    </CommandDialog>
  );
}
