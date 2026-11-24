import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { fetchTrash, permanentDeleteContact, restoreContact } from "../api/contacts";

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

export default function Trash() {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState(null);
  const [message, setMessage] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trash"],
    queryFn: fetchTrash,
  });
  const contacts = data?.contacts ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["trash"] });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["contactStats"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const restoreMutation = useMutation({
    mutationFn: restoreContact,
    onSuccess: () => {
      setMessage("");
      refresh();
    },
    onError: (err) => setMessage(err.response?.data?.message || "Could not restore contact"),
  });

  const deleteMutation = useMutation({
    mutationFn: permanentDeleteContact,
    onSuccess: () => {
      refresh();
      setToDelete(null);
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Trash</h1>
        <p className="mt-1 text-sm text-muted">
          Deleted contacts stay here for 30 days, then they are removed permanently.
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
      )}

      <div className="rounded-2xl border border-line bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-line/60" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-ink">Could not load the trash</p>
            <p className="mt-1 text-sm text-muted">Check that the server is running and try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Trash2 className="mx-auto text-primary" size={36} />
            <p className="mt-3 font-medium text-ink">Trash is empty</p>
            <p className="mt-1 text-sm text-muted">Deleted contacts will show up here for 30 days.</p>
          </div>
        ) : (
          <ul>
            {contacts.map((c) => (
              <li
                key={c._id}
                className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-4 first:border-t-0"
              >
                <Avatar contact={c} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{c.name}</p>
                  <p className="truncate text-xs text-muted">
                    {[c.company, c.email].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    c.daysLeft <= 5 ? "bg-red-50 text-red-500" : "bg-primary-soft text-primary-dark"
                  }`}
                >
                  {c.daysLeft} {c.daysLeft === 1 ? "day" : "days"} left
                </span>

                <button
                  onClick={() => restoreMutation.mutate(c._id)}
                  disabled={restoreMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  <RotateCcw size={15} /> Restore
                </button>
                <button
                  onClick={() => setToDelete(c)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 size={15} /> Delete permanently
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">Delete permanently?</h3>
            <p className="mt-2 text-sm text-muted">
              {toDelete.name} and all their follow-ups will be removed for good. This cannot be undone.
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
                {deleteMutation.isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}