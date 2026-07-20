"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  BookOpenText,
  ChefHat,
  Flame,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Store,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/shared/api/auth-api";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import type { LoginRequest } from "@/shared/types/auth";
import { Link, usePathname } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { usePushRegistration } from "@/features/push-notifications/model/use-push-registration";
import { PlatformLoginScreen } from "./platform-login-screen";

type NavItem = {
  href: string;
  labelKey: string;
  icon: ReactNode;
  exact?: boolean;
};

type AdminShellProps = PropsWithChildren<{
  area: "platform" | "staff";
}>;

export function AdminShell({ children, area }: AdminShellProps) {
  const t = useTranslations("AdminShell");
  const tRoles = useTranslations("Shared.roles");
  const tStaffLoginRequired = useTranslations("StaffLoginRequired");
  const session = useAdminSession();
  usePushRegistration();

  const loginMutation = useMutation({
    mutationFn: (values: LoginRequest) => authApi.login(values),
    onSuccess: (response) => {
      session.setSession(response);
      toast.success(t("loginSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("loginError"));
    },
  });

  if (!session.isClientReady) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  if (!session.accessToken || !session.user) {
    if (area === "platform") {
      return (
        <PlatformLoginScreen
          isPending={loginMutation.isPending}
          onSubmit={(values) => loginMutation.mutate(values)}
        />
      );
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <ChefHat className="size-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {tStaffLoginRequired("title")}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {tStaffLoginRequired("description")}
        </p>
      </main>
    );
  }

  const user = session.user;

  const adminNav: NavItem[] = session.isPlatformAdmin
    ? [
        {
          href: "/admin",
          labelKey: "navOverview",
          icon: <LayoutDashboard className="size-4" />,
          exact: true,
        },
        {
          href: "/admin/restaurants",
          labelKey: "navRestaurants",
          icon: <Store className="size-4" />,
        },
        {
          href: "/admin/leads",
          labelKey: "navLeads",
          icon: <Inbox className="size-4" />,
        },
      ]
    : session.isRestaurantAdmin
      ? [
          {
            href: "/admin",
            labelKey: "navOverview",
            icon: <LayoutDashboard className="size-4" />,
            exact: true,
          },
          {
            href: "/admin/team",
            labelKey: "navTeam",
            icon: <Users className="size-4" />,
          },
          {
            href: "/admin/branches",
            labelKey: "navBranches",
            icon: <MapPin className="size-4" />,
          },
        ]
      : [];

  const operationsNav: NavItem[] =
    user.profileType === "staff"
      ? [
          ...(session.canAccessFloor
            ? [
                {
                  href: "/staff",
                  labelKey: "navTables",
                  icon: <UtensilsCrossed className="size-4" />,
                  exact: true,
                },
              ]
            : []),
          ...(session.canAccessMenuStudio
            ? [
                {
                  href: "/staff/menu",
                  labelKey: "navMenu",
                  icon: <BookOpenText className="size-4" />,
                },
              ]
            : []),
          ...(session.canAccessKitchen
            ? [
                {
                  href: "/staff/kitchen",
                  labelKey: "navKitchen",
                  icon: <Flame className="size-4" />,
                },
              ]
            : []),
        ]
      : [];

  const collapseToHeader = adminNav.length === 0 && operationsNav.length <= 1;

  const handleLogout = () => {
    session.logout();
    toast.success(t("logoutSuccess"));
  };

  const primaryRole = session.isPlatformAdmin
    ? t("platformAdminRole")
    : user.branchRoles.length > 0
      ? tRoles(user.branchRoles[0].role)
      : t("noRoleYet");

  return (
    <div
      className={
        collapseToHeader
          ? "min-h-screen"
          : "min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]"
      }
    >
      {!collapseToHeader ? (
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar pt-[env(safe-area-inset-top)] lg:flex">
          <div className="flex items-center gap-3 px-6 pt-7 pb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ChefHat className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg leading-none font-bold">Sazono</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {session.isPlatformAdmin ? t("platformSubtitle") : t("restaurantSubtitle")}
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
            {adminNav.length > 0 ? (
              <NavSection title={t("sectionAdmin")} items={adminNav} t={t} />
            ) : null}
            {operationsNav.length > 0 ? (
              <NavSection
                title={t("sectionOperations")}
                items={operationsNav}
                t={t}
              />
            ) : null}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground uppercase">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {primaryRole}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("logout")}
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div
              className={
                collapseToHeader ? "flex items-center gap-3" : "flex items-center gap-3 lg:hidden"
              }
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ChefHat className="size-4" />
              </div>
              <div>
                <p className="font-heading text-base font-bold">Sazono</p>
                {collapseToHeader ? (
                  <p className="text-xs text-muted-foreground">
                    {session.isPlatformAdmin ? t("platformSubtitle") : t("restaurantSubtitle")}
                  </p>
                ) : null}
              </div>
            </div>
            {!collapseToHeader ? <div className="hidden lg:block" /> : null}
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className={collapseToHeader ? undefined : "lg:hidden"}
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                {t("logout")}
              </Button>
            </div>
          </div>

          {!collapseToHeader ? (
            <nav className="flex gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
              {[...adminNav, ...operationsNav].map((item) => (
                <MobileNavLink key={item.href} item={item} t={t} />
              ))}
            </nav>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10">
          {session.userError ? (
            <div className="mb-6 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {t("refreshError")}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

type NavSectionProps = {
  title: string;
  items: NavItem[];
  t: (key: string) => string;
};

function NavSection({ title, items, t }: NavSectionProps) {
  const pathname = usePathname();

  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type MobileNavLinkProps = {
  item: NavItem;
  t: (key: string) => string;
};

function MobileNavLink({ item, t }: MobileNavLinkProps) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        isActive
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {item.icon}
      {t(item.labelKey)}
    </Link>
  );
}
