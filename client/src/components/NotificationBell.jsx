import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchFollowups } from "../api/followups";

function getFollowupStatus(dueAt) {
  const due = new Date(dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < today) return { label: "Overdue", tone: "text-red-600", urgent: true };
  if (due < tomorrow) return { label: "Due today", tone: "text-red-500", urgent: true };
  return {
    label: due.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    tone: "text-muted",
    urgent: false,
  };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const containerRef = useRef(null);
  const { data: followups = [], isLoading, isError } = useQuery({
    queryKey: ["followups"],
    queryFn: () => fetchFollowups(),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    followups.forEach((item) => {
      const due = new Date(item.dueAt);
      if (due >= tomorrow) return;

      const notificationKey = `followup-notified-${item._id}-${due.toISOString().slice(0, 10)}`;
      if (sessionStorage.getItem(notificationKey)) return;

      new Notification(due < today ? "Overdue follow-up" : "Follow-up due today", {
        body: `${item.contactId?.name ?? "Contact"}: ${item.note}`,
      });
      sessionStorage.setItem(notificationKey, "1");
    });
  }, [followups, permission]);

  const urgentCount = followups.filter(({ dueAt }) => getFollowupStatus(dueAt).urgent).length;

  const enableDesktopAlerts = async () => {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${urgentCount ? `, ${urgentCount} urgent` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-primary-soft"
      >
        <Bell size={18} />
        {urgentCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {urgentCount > 9 ? "9+" : urgentCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Notifications</h2>
              <p className="text-xs text-muted">Follow-ups and important reminders</p>
            </div>
            <CalendarClock className="text-accent" size={20} />
          </div>

          {permission === "default" && (
            <div className="flex items-center justify-between gap-3 border-b border-line bg-primary-soft/40 px-4 py-3">
              <p className="text-xs text-ink">Get desktop alerts for due follow-ups.</p>
              <button
                type="button"
                onClick={enableDesktopAlerts}
                className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Enable
              </button>
            </div>
          )}
          {permission === "denied" && (
            <p className="border-b border-line px-4 py-2 text-xs text-muted">
              Desktop alerts are blocked in your browser settings.
            </p>
          )}
          {permission === "granted" && (
            <p className="border-b border-line px-4 py-2 text-xs text-primary-dark">
              Desktop alerts are enabled for overdue and today&apos;s follow-ups.
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Loading notifications...</p>
            ) : isError ? (
              <p className="px-4 py-8 text-center text-sm text-red-600">
                Could not load notifications. Please try again.
              </p>
            ) : followups.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto text-muted/60" size={24} />
                <p className="mt-2 text-sm font-medium text-ink">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-muted">New follow-up reminders will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {followups.slice(0, 10).map((item) => {
                  const status = getFollowupStatus(item.dueAt);
                  return (
                    <li key={item._id}>
                      <Link
                        to={`/contacts/${item.contactId?._id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-primary-soft/30"
                      >
                        <span className="mt-0.5 rounded-lg bg-lavender/60 p-2 text-accent">
                          <CalendarClock size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {item.contactId?.name ?? "Contact follow-up"}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">{item.note}</span>
                          <span className={`mt-1 block text-xs font-medium ${status.tone}`}>
                            {status.label}
                          </span>
                        </span>
                        <ChevronRight className="mt-1 shrink-0 text-muted" size={16} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {followups.length > 10 && (
            <p className="border-t border-line px-4 py-2 text-center text-xs text-muted">
              Showing the next 10 of {followups.length} follow-ups
            </p>
          )}
        </section>
      )}
    </div>
  );
}
