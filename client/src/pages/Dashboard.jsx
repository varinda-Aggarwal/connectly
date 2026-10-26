import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Contact,
  Mail,
  Phone,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { fetchSummary } from "../api/dashboard";

// donut ke slice colours
const PALETTE = [
  "var(--color-primary, #6b7f45)",
  "var(--color-accent, #9b7fc7)",
  "#d4b483",
  "#8aa3a0",
  "#c98b8b",
];
const UNTAGGED_COLOR = "#6f6a5e";

const pad = (n) => String(n ?? 0).padStart(2, "0");

function Avatar({ contact }) {
  if (contact.photoUrl) {
    return (
      <img src={contact.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender font-semibold text-accent">
      {contact.name.charAt(0).toUpperCase()}
    </div>
  );
}

function Donut({ slices, total }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const sum = slices.reduce((s, x) => s + x.count, 0);
  let offset = 0;

  return (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto h-52 w-52"
      role="img"
      aria-label="Contacts grouped by tag"
    >
      <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="26" className="text-line" />
      {sum > 0 &&
        slices.map((s) => {
          const len = (s.count / sum) * C;
          const drawn = Math.max(len - 2, 0); // slices ke beech chhota gap
          const circle = (
            <circle
              key={s.label}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="26"
              strokeDasharray={`${drawn} ${C - drawn}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            />
          );
          offset += len;
          return circle;
        })}
      <text
        x="100"
        y="100"
        textAnchor="middle"
        className="fill-ink"
        style={{ fontSize: 34, fontFamily: "serif", fontWeight: 600 }}
      >
        {total}
      </text>
      <text x="100" y="124" textAnchor="middle" className="fill-muted" style={{ fontSize: 13 }}>
        contacts
      </text>
    </svg>
  );
}

function followupLabel(dueAt) {
  const due = new Date(dueAt);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  const startDayAfter = new Date(startToday);
  startDayAfter.setDate(startDayAfter.getDate() + 2);

  const time = due.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const date = due.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (due < startToday) return { text: `Overdue · ${date}`, tone: "text-red-500" };
  if (due < startTomorrow) return { text: `Today · ${time}`, tone: "text-red-400" };
  if (due < startDayAfter) return { text: `Tomorrow · ${time}`, tone: "text-accent" };
  return { text: date, tone: "text-muted" };
}

function FollowupsCard({ followups }) {
  const [showAll, setShowAll] = useState(false);
  const f = followups ?? { dueToday: 0, upcoming: 0, overdue: 0, items: [] };
  const items = f.items ?? [];
  const visible = showAll ? items : items.slice(0, 3);

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">Upcoming Follow-ups</h2>
          <p className="mt-1 text-xs text-muted">People you plan to reconnect with.</p>
        </div>
        <div className="rounded-xl bg-lavender/60 p-2.5 text-accent">
          <CalendarClock size={20} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-red-500/10 px-4 py-3">
          <p className="text-xs text-red-400">Due today</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-red-400">{f.dueToday}</p>
        </div>
        <div className="rounded-xl bg-lavender/40 px-4 py-3">
          <p className="text-xs text-accent">Upcoming</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-accent">{f.upcoming}</p>
        </div>
        <div className="rounded-xl bg-primary-soft px-4 py-3">
          <p className="text-xs text-primary-dark">Overdue</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-primary-dark">{f.overdue}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <CalendarClock className="mx-auto text-primary" size={32} />
          <p className="mt-3 font-medium text-ink">No follow-ups planned</p>
          <p className="mt-1 text-sm text-muted">Open a contact and add a follow-up to see it here.</p>
        </div>
      ) : (
        <>
          <ul className="mt-4">
            {visible.map((item) => {
              const label = followupLabel(item.dueAt);
              return (
                <li key={item._id}>
                  <Link
                    to={`/contacts/${item.contact._id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-primary-soft/30"
                  >
                    <Avatar contact={item.contact} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.contact.name}</p>
                      <p className="truncate text-xs text-muted">{item.note}</p>
                      <p className={`text-xs ${label.tone}`}>{label.text}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
            <span>
              Showing {showAll ? "all" : "next"} {visible.length}{" "}
              {visible.length === 1 ? "reminder" : "reminders"}
            </span>
            {items.length > 3 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-1 font-medium text-ink hover:text-primary-dark"
              >
                {showAll ? "Show less" : "View all"} <ArrowRight size={14} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-2xl bg-line/60" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-line/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-line/60" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-line/60" />
    </div>
  );
}

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchSummary,
  });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const recent = data?.recent ?? [];
  const selected = recent.find((c) => c._id === selectedId);

  const slices = data
    ? [
        ...(data.tagBreakdown ?? []).map((t, i) => ({
          label: t.tag,
          count: t.count,
          color: PALETTE[i % PALETTE.length],
        })),
        ...(data.total - data.withTags > 0
          ? [{ label: "untagged", count: data.total - data.withTags, color: UNTAGGED_COLOR }]
          : []),
      ]
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{today}</p>
          <h1 className="font-serif text-3xl font-semibold text-ink">Your network, at a glance</h1>
        </div>
        <Link
          to="/contacts/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          <Plus size={18} /> Add Contact
        </Link>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-line bg-card px-6 py-16 text-center shadow-sm">
          <p className="font-medium text-ink">Could not load your dashboard</p>
          <p className="mt-1 text-sm text-muted">Check that the server is running and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Hero card */}
          <div className="rounded-2xl bg-primary p-6 text-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/70">Your network</p>
                <p className="mt-1 font-serif text-4xl font-semibold">
                  {data.total} {data.total === 1 ? "contact" : "contacts"}
                </p>
                <p className="mt-1 text-sm text-white/70">Your personal connections, organized.</p>
              </div>
              <Contact size={30} className="text-white/80" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
              <div>
                <p className="text-xs text-white/70">Added this month</p>
                <p className="mt-1 font-serif text-2xl font-semibold">{pad(data.addedThisMonth)}</p>
              </div>
              <div>
                <p className="text-xs text-white/70">With company details</p>
                <p className="mt-1 font-serif text-2xl font-semibold">{pad(data.withCompany)}</p>
              </div>
              <div>
                <p className="text-xs text-white/70">With tags</p>
                <p className="mt-1 font-serif text-2xl font-semibold">{pad(data.withTags)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Network breakdown */}
            <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-ink">Network Breakdown</h2>
              <p className="mt-1 text-xs text-muted">Contacts grouped by tag</p>

              {data.total === 0 ? (
                <div className="py-14 text-center">
                  <Users className="mx-auto text-primary" size={36} />
                  <p className="mt-3 text-sm text-muted">Add contacts with tags to see your breakdown.</p>
                </div>
              ) : (
                <>
                  <div className="my-5">
                    <Donut slices={slices} total={data.total} />
                  </div>
                  <ul className="space-y-2.5">
                    {slices.map((s) => (
                      <li key={s.label} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2.5 capitalize text-ink">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                          {s.label}
                        </span>
                        <span className="font-medium text-ink">{s.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Recently added */}
            <div className="rounded-2xl border border-line bg-lavender/30 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">Recently Added</h2>
                  <p className="mt-1 text-xs text-muted">Your latest connections</p>
                </div>
                {recent.length > 0 && (
                  <Link to="/contacts" className="text-sm font-medium text-primary-dark hover:underline">
                    View all
                  </Link>
                )}
              </div>

              {recent.length === 0 ? (
                <div className="py-14 text-center">
                  <Users className="mx-auto text-primary" size={36} />
                  <p className="mt-3 font-medium text-ink">No contacts yet</p>
                  <p className="mt-1 text-sm text-muted">Add your first contact to get started.</p>
                  <Link
                    to="/contacts/new"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    <Plus size={18} /> Add Contact
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="mt-4 space-y-1">
                    {recent.map((c) => (
                      <li key={c._id}>
                        <button
                          onClick={() => setSelectedId(c._id === selectedId ? null : c._id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            c._id === selectedId ? "bg-primary-soft/60" : "hover:bg-primary-soft/30"
                          }`}
                        >
                          <Avatar contact={c} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                            <p className="truncate text-xs text-muted">
                              {c.company || c.email || "No details"}
                            </p>
                          </div>
                          {c.isFavourite && <Star size={15} className="fill-accent text-accent" />}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 border-t border-line pt-4">
                    {selected ? (
                      <div className="space-y-2">
                        <p className="font-medium text-ink">{selected.name}</p>
                        <p className="text-xs text-muted">
                          {[selected.designation, selected.company].filter(Boolean).join(" at ") ||
                            "No job details"}
                        </p>
                        {selected.email && (
                          <p className="flex items-center gap-2 text-sm text-ink">
                            <Mail size={14} className="text-muted" /> {selected.email}
                          </p>
                        )}
                        {selected.phone && (
                          <p className="flex items-center gap-2 text-sm text-ink">
                            <Phone size={14} className="text-muted" /> {selected.phone}
                          </p>
                        )}
                        {selected.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {selected.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-dark"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link
                          to={`/contacts/${selected._id}`}
                          className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary-dark hover:underline"
                        >
                          View full profile <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">Select a person to view their details.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming follow-ups */}
          <FollowupsCard followups={data.followups} />
        </div>
      )}
    </div>
  );
}