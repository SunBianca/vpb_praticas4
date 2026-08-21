import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  LogOut,
  UserCircle,
  LayoutDashboard,
  ArrowLeftRight,
  CalendarClock,
  Wallet,
  Tags,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { getSession, clearSession, type LoginResponse } from "@/lib/users";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="grid min-h-screen place-items-center bg-triangles px-4 text-center">
      <div>
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página não encontrada.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-display text-primary-foreground"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="grid min-h-screen place-items-center bg-triangles px-4 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-2xl">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-lg bg-primary px-4 py-2 font-display text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VPB Finanças — Painel" },
      { name: "description", content: "Painel financeiro VPB com agendamentos e contas." },
      { property: "og:title", content: "VPB Finanças — Painel" },
      { name: "twitter:title", content: "VPB Finanças — Painel" },
      { property: "og:description", content: "Painel financeiro VPB com agendamentos e contas." },
      { name: "twitter:description", content: "Painel financeiro VPB com agendamentos e contas." },
      { name: "theme-color", content: "#0f0d14" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/752b2443-1e69-4a73-8679-49f03f2704e6/id-preview-6fac860d--e7c5b6ae-9c18-4a0e-ab8a-6c22ff872f29.lovable.app-1782161051819.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/752b2443-1e69-4a73-8679-49f03f2704e6/id-preview-6fac860d--e7c5b6ae-9c18-4a0e-ab8a-6c22ff872f29.lovable.app-1782161051819.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/pwa-192.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bowlby+One&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    setUser(getSession());
    const onChange = () => setUser(getSession());
    window.addEventListener("storage", onChange);
    window.addEventListener("vpb:session", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("vpb:session", onChange);
    };
  }, []);

  const isAuthPage =
    pathname === "/login" || pathname === "/cadastro" || pathname === "/recuperar-senha";

  useEffect(() => {
    if (!mounted) return;
    if (!user && !isAuthPage) {
      router.navigate({ to: "/login" });
    } else if (user && isAuthPage) {
      router.navigate({ to: "/" });
    }
  }, [mounted, user, isAuthPage, router]);

  const showSidebar = mounted && !!user && !isAuthPage;
  const canRenderOutlet = isAuthPage || !!user;

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthPage ? (
        <Outlet />
      ) : showSidebar ? (
        <SidebarLayout user={user!}>
          <Outlet />
        </SidebarLayout>
      ) : (
        <div className="min-h-screen bg-triangles">
          {canRenderOutlet ? (
            <div className="mx-auto max-w-6xl px-8 py-10">
              <Outlet />
            </div>
          ) : null}
        </div>
      )}
      <Toaster richColors theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}

function SidebarLayout({ user, children }: { user: LoginResponse; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background lg:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-foreground hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-display text-lg">VPB</div>
        <div className="w-9" />
      </header>

      {/* Desktop sidebar — sticky */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar user={user} />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] sm:max-w-[22rem]">
            <Sidebar user={user} onClose={() => setMobileOpen(false)} showClose />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 bg-triangles">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

function Sidebar({
  user,
  onClose,
  showClose,
}: {
  user: LoginResponse;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const initial = (user.name?.[0] ?? "U").toUpperCase();

  const handleLogout = () => {
    clearSession();
    window.dispatchEvent(new Event("vpb:session"));
  };

  return (
    <aside className="relative flex h-full w-full min-w-0 flex-col gap-6 overflow-y-auto border-r border-white/5 bg-black px-5 py-6 sm:w-72 sm:shrink-0">
      {showClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-foreground hover:bg-white/10"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white font-display text-lg text-black">
          {initial}
        </div>
        <div className="leading-tight">
          <div className="text-xs text-muted-foreground">Olá!</div>
          <div className="text-base font-semibold">{user.name}</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 text-sm">
        {[
          { to: "/", label: "Dashboard", icon: LayoutDashboard, showDot: true },
          { to: "/transacoes", label: "Transação", icon: ArrowLeftRight },
          { to: "/agendamentos", label: "Agendamento", icon: CalendarClock },
          { to: "/contas", label: "Contas Bancárias", icon: Wallet },
          { to: "/categorias", label: "Gerenciar Categorias", icon: Tags },
        ].map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(168,38,168,0.55)]"
                  : "bg-primary/15 text-foreground hover:bg-primary/25"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-white/5 pt-4 text-sm">
        <Link
          to="/contato"
          className={`flex items-center gap-2 rounded-full px-3 py-2 ${
            pathname === "/contato"
              ? "bg-primary/20 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          <span className="underline-offset-2 hover:underline">Contate-nos</span>
        </Link>
        <Link
          to="/perfil"
          className={`flex items-center gap-2 rounded-full px-3 py-2 ${
            pathname === "/perfil"
              ? "bg-primary/20 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCircle className="h-4 w-4" />
          <span className="underline-offset-2 hover:underline">Acessar perfil</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="underline-offset-2 hover:underline">Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
}
