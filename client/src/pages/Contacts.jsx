import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { deleteContact, fetchContacts, fetchTags, toggleFavourite } from "../api/contacts";
import useDebounce from "../hooks/useDebounce";

const LIMIT = 10;

const VIEWS = [
  { key: "all", label: "All" },
  { key: "favourites", label: "Favourites" },
  { key: "recent", label: "Recently Added" },
];

const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "name", label: "Name A-Z" },
  { value: "-name", label: "Name Z-A" },
];

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

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} className="border-t border-line">
      <td colSpan={4} className="px-5 py-3">
        <div className="h-10 animate-pulse rounded-lg bg-line/60" />
      </td>
    </tr>
  ));
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-5 py-4 shadow-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-serif text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function RowMenu({ contact, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="More actions"
        className="rounded-lg p-1.5 text-muted transition hover:bg-primary-soft hover:text-ink"
      >
        <EllipsisVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-line bg-card py-1 shadow-lg">
          <Link
            to={`/contacts/${contact._id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-primary-soft/60"
          >
            <Eye size={16} /> View details
          </Link>
          <Link
            to={`/contacts/${contact._id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-primary-soft/60"
          >
            <Pencil size={16} /> Edit
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onDelete(contact);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Contacts() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [view, setView] = useState("all");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const debouncedSearch = useDebounce(search.trim());

  const params = {
    page,
    limit: LIMIT,
    sort,
    search: debouncedSearch,
    tag,
    ...(view === "favourites" && { favourite: true }),
    ...(view === "recent" && { recent: true }),
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["contacts", params],
    queryFn: () => fetchContacts(params),
    placeholderData: keepPreviousData,
  });

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const { data: stats } = useQuery({
    queryKey: ["contactStats"],
    queryFn: async () => {
      const [all, fav, recent] = await Promise.all([
        fetchContacts({ limit: 1 }),
        fetchContacts({ limit: 1, favourite: true }),
        fetchContacts({ limit: 1, recent: true }),
      ]);
      return { total: all.total, favourites: fav.total, recent: recent.total };
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["contactStats"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const favMutation = useMutation({ mutationFn: toggleFavourite, onSuccess: refresh });
  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      refresh();
      setToDelete(null);
    },
  });

  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);
  const hasFilters = Boolean(debouncedSearch || tag || view !== "all");

  // last page ka akhri contact delete ho jaye toh ek page peeche aa jao
  useEffect(() => {
    if (data && data.totalPages > 0 && page > data.totalPages) setPage(data.totalPages);
  }, [data, page]);

  const clearFilters = () => {
    setSearch("");
    setTag("");
    setView("all");
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">All Contacts</h1>
          <p className="mt-1 text-sm text-muted">Manage and organize your connections</p>
        </div>
        <Link
          to="/contacts/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          <Plus size={18} /> Add Contact
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total Contacts" value={stats?.total ?? "-"} color="text-ink" />
        <StatCard label="Favourites" value={stats?.favourites ?? "-"} color="text-primary" />
        <StatCard label="Recently Added" value={stats?.recent ?? "-"} color="text-accent" />
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-page px-3.5 py-2.5 focus-within:border-primary">
              <Search size={16} className="text-muted" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>

            <select
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
              className="rounded-xl bg-lavender/60 px-4 py-2.5 text-sm font-medium text-accent outline-none"
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-xl bg-page px-4 py-2.5 text-sm font-medium text-ink outline-none ring-1 ring-line"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => {
                  setView(v.key);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  view === v.key
                    ? "bg-primary text-white"
                    : "bg-primary-soft text-primary-dark hover:bg-primary-soft/70"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`border-t border-line transition ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {isError ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-ink">Could not load your contacts</p>
              <p className="mt-1 text-sm text-muted">Check that the server is running and try again.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Retry
              </button>
            </div>
          ) : !isLoading && contacts.length === 0 ? (
            hasFilters ? (
              <div className="px-6 py-16 text-center">
                <Search className="mx-auto text-primary" size={34} />
                <p className="mt-3 font-medium text-ink">No contacts found</p>
                <p className="mt-1 text-sm text-muted">Try a different search or clear the filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
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
            )
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Tags</th>
                  <th className="w-24 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : (
                  contacts.map((c) => (
                    <tr key={c._id} className="border-t border-line transition hover:bg-primary-soft/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar contact={c} />
                          <div>
                            <Link
                              to={`/contacts/${c._id}`}
                              className="font-medium text-ink hover:text-primary-dark hover:underline"
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-muted">{c.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-ink">{c.company || "-"}</p>
                        <p className="text-xs text-muted">{c.designation}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-dark"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => favMutation.mutate(c._id)}
                            aria-label={c.isFavourite ? "Remove from favourites" : "Add to favourites"}
                            className="rounded-lg p-1.5 transition hover:bg-primary-soft"
                          >
                            <Star
                              size={18}
                              className={c.isFavourite ? "fill-accent text-accent" : "text-muted/60"}
                            />
                          </button>
                          <RowMenu contact={c} onDelete={setToDelete} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !isError && contacts.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
            <span>
              Showing {from}-{to} of {total}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="rounded-lg p-1.5 transition hover:bg-primary-soft disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-medium text-ink">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="rounded-lg p-1.5 transition hover:bg-primary-soft disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">Delete contact?</h3>
            <p className="mt-2 text-sm text-muted">
              {toDelete.name} will be removed from your contacts. This cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Could not delete the contact. Please try again.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setToDelete(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-ink hover:bg-primary-soft"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(toDelete._id)}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}