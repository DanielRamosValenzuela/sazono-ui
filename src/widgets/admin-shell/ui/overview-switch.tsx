"use client";

import { PlatformOverview } from "@/widgets/platform-dashboard/ui/platform-overview";
import { RestaurantOverview } from "@/widgets/restaurant-dashboard/ui/restaurant-overview";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

/** Portada del área admin: cada perfil ve su propio resumen. */
export function OverviewSwitch() {
  const session = useAdminSession();

  if (!session.isClientReady || !session.user) {
    return null;
  }

  return session.isPlatformAdmin ? <PlatformOverview /> : <RestaurantOverview />;
}
