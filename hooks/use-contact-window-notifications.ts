"use client";

import { useEffect, useRef } from "react";
import type { ClientDashboardSummary, ClientWithRelations } from "@/lib/types";
import { getContactWindowStatus, getMinutesUntilContactWindowClose } from "@/lib/timezone";

const NOTIFIED_KEY = "meridian-notified-windows";

function loadNotified(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, string>) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

export function useContactWindowNotifications(
  clients: ClientDashboardSummary[] | ClientWithRelations[],
  enabled: boolean,
) {
  const notifiedRef = useRef(loadNotified());

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const check = () => {
      if (Notification.permission !== "granted") return;

      const today = new Date().toDateString();
      const notified = { ...notifiedRef.current };

      for (const client of clients) {
        if (client.status !== "active") continue;

        const { status, label } = getContactWindowStatus(
          client.timezone,
          client.business_hours,
          client.do_not_contact_before,
          client.do_not_contact_after,
        );

        const openKey = `${client.id}:open:${today}`;
        const closeKey = `${client.id}:close:${today}`;

        if (status === "open" && !notified[openKey]) {
          new Notification(`${client.company_name} — contact window open`, {
            body: label,
            tag: openKey,
          });
          notified[openKey] = new Date().toISOString();
        }

        if (status === "closing" && !notified[closeKey]) {
          const mins = getMinutesUntilContactWindowClose(
            client.timezone,
            client.business_hours,
            client.do_not_contact_before,
            client.do_not_contact_after,
          );
          if (mins !== null && mins <= 15) {
            new Notification(`${client.company_name} — window closing in ${mins}m`, {
              body: label,
              tag: closeKey,
            });
            notified[closeKey] = new Date().toISOString();
          }
        }
      }

      notifiedRef.current = notified;
      saveNotified(notified);
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [clients, enabled]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}
