import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Star, UserPlus, Users } from "lucide-react";
import { fetchSummary } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";

function Avatar({ contact }) {
  if (contact.photoUrl) {
    return <img src={contact.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender font-semibold text-accent">
      {contact.name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 shadow-sm">
      <div className="rounded-xl bg-primary-soft p-3 text-primary-dark">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className={`font-serif text-3xl font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-line bg-card p-5 shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-line/60" />
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchSummary,
  });

  const recent = data?.recent ?? [];
  const firstName = user?.name?.split(" ")[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted">Here is a quick look at your network</p>
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
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Total Contacts" value={data.total} color="text-ink" />
            <StatCard icon={Star} label="Favourites" value={data.favourites} color="text-primary" />
            <StatCard
              icon={UserPlus}
              label="Added this month"
              value={data.addedThisMonth ?? 0}
              color="text-accent"
            />
          </div>

          <div className="rounded-2xl border border-line bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-serif text-xl font-semibold text-ink">Recent contacts</h2>
              {recent.length > 0 && (
                <Link
                  to="/contacts"
                  className="flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline"
                >
                  View all <ChevronRight size={16} />
                </Link>
              )}
            </div>

            {recent.length === 0 ? (
              <div className="border-t border-line px-6 py-16 text-center">
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
              <ul>
                {recent.map((c) => (
                  <li key={c._id} className="border-t border-line">
                    <Link
                      to={`/contacts/${c._id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-primary-soft/30"
                    >
                      <Avatar contact={c} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{c.name}</p>
                        <p className="truncate text-xs text-muted">
                          {[c.designation, c.company].filter(Boolean).join(" at ") ||
                            c.email ||
                            "No details"}
                        </p>
                      </div>
                      {c.isFavourite && <Star size={16} className="fill-accent text-accent" />}
                      <span className="hidden text-xs text-muted sm:block">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}