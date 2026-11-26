import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchFollowups } from "../api/followups";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

// follow-up abhi kis stage mein hai: overdue, now, today, tomorrow, in2 ya later
function getStage(dueAt, nowMs) {
  const due = new Date(dueAt);
  const dayDiff = Math.round((startOfDay(due) - startOfDay(nowMs)) / DAY_MS);
  if (dayDiff < 0) return "overdue";
  if (dayDiff === 0) return due.getTime() <= nowMs ? "now" : "today";
  if (dayDiff === 1) return "tomorrow";
  if (dayDiff === 2) return "in2";
  return "later";
}

const STAGES = {
  overdue: { label: "Overdue", tone: "text-red-600", urgent: true, title: "Overdue follow-up" },
  now: { label: "Due now", tone: "text-red-600", urgent: true, title: "Follow-up is due now" },
  today: { label: "Due today", tone: "text-red-500", urgent: true, title: "Follow-up due today" },
  tomorrow: { label: "Tomorrow", tone: "text-accent", urgent: true, title: "Follow-up tomorrow" },
  in2: { label: "In 2 days", tone: "text-accent", urgent: true, title: "Follow-up in 2 days" },
  later: { label: "", tone: "text-muted", urgent: false, title: "" },
};

function getFollowupStatus(dueAt, nowMs) {
  const stage = getStage(dueAt, nowMs);
  const config = STAGES[stage];
  const due = new Date(dueAt);
  const time = due.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  let label;
  if (stage === "later") {
    label = due.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (stage === "overdue") {
    label = `Overdue · ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  } else {
    label = `${config.label} · ${time}`;
  }

  return { ...config, stage, label };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const containerRef = useRef(null);
  const { data: followups = [], isLoading, isError } = useQuery({
    queryKey: ["followups"],
    queryFn: () => fetchFollowups(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // har 30 second mein "abhi ka time" badlo, taaki badge aur alerts bina refresh ke badlein
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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

  // desktop alert: har stage par ek baar (2 din pehle, kal, aaj, time aane par, overdue)
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    followups.forEach((item) => {
      const status = getFollowupStatus(item.dueAt, now);
      if (!status.urgent) return;

      const key = `followup-alert:${item._id}:${new Date(item.dueAt).toISOString()}:${status.stage}`;
      if (localStorage.getItem(key)) return;

      new Notification(status.title, {
        body: `${item.contactId?.name ?? "Contact"}: ${item.note}`,
      });
      localStorage.setItem(key, "1");
    });
  }, [followups, permission, now]);

  const urgentCount = followups.filter(({ dueAt }) => getFollowupStatus(dueAt, now).urgent).length;

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
  className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-line bg-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[22rem]"
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
              Desktop alerts start 2 days before a follow-up while Connectly is open in a browser tab.
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
                  const status = getFollowupStatus(item.dueAt, now);
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