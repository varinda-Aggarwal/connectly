import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, Mail, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { deleteContact, fetchContact, toggleFavourite } from "../api/contacts";

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-primary-soft p-2 text-primary-dark">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="break-words text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="h-24 w-24 animate-pulse rounded-full bg-line/60" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-1/2 animate-pulse rounded-lg bg-line/60" />
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-line/60" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  );
}

export default function ContactDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: contact,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact(id),
  });

  const refreshLists = () => {
    ["contacts", "contactStats", "tags", "dashboard"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const favMutation = useMutation({
    mutationFn: () => toggleFavourite(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["contact", id], updated);
      refreshLists();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(id),
    onSuccess: () => {
      refreshLists();
      navigate("/contacts");
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/contacts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to contacts
      </Link>

      {isLoading ? (
        <DetailsSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-line bg-card px-6 py-16 text-center shadow-sm">
          <p className="font-medium text-ink">Could not load this contact</p>
          <p className="mt-1 text-sm text-muted">It may have been deleted, or the server is not reachable.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => refetch()}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Retry
            </button>
            <Link
              to="/contacts"
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-ink hover:bg-primary-soft"
            >
              Back to contacts
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-5 p-6">
            {contact.photoUrl ? (
              <img src={contact.photoUrl} alt={contact.name} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lavender text-3xl font-semibold text-accent">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="break-words font-serif text-3xl font-semibold text-ink">{contact.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {[contact.designation, contact.company].filter(Boolean).join(" at ") || "No job details"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Added on{" "}
                {new Date(contact.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => favMutation.mutate()}
                disabled={favMutation.isPending}
                aria-label={contact.isFavourite ? "Remove from favourites" : "Add to favourites"}
                className="rounded-xl p-2.5 transition hover:bg-primary-soft disabled:opacity-60"
              >
                <Star
                  size={22}
                  className={contact.isFavourite ? "fill-accent text-accent" : "text-muted/60"}
                />
              </button>
              <Link
                to={`/contacts/${contact._id}/edit`}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                <Pencil size={16} /> Edit
              </Link>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="grid gap-5 border-t border-line p-6 md:grid-cols-2">
            <InfoRow icon={Mail} label="Email">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="hover:text-primary-dark hover:underline">
                  {contact.email}
                </a>
              ) : (
                "-"
              )}
            </InfoRow>
            <InfoRow icon={Phone} label="Phone">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="hover:text-primary-dark hover:underline">
                  {contact.phone}
                </a>
              ) : (
                "-"
              )}
            </InfoRow>
            <InfoRow icon={Building2} label="Company">
              {contact.company || "-"}
            </InfoRow>
            <InfoRow icon={Briefcase} label="Designation">
              {contact.designation || "-"}
            </InfoRow>
          </div>

          {/* Tags */}
          <div className="border-t border-line p-6">
            <p className="mb-2 text-sm font-medium text-ink">Tags</p>
            {contact.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-dark"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No tags added</p>
            )}
          </div>

          {/* Notes */}
          <div className="border-t border-line p-6">
            <p className="mb-2 text-sm font-medium text-ink">Notes</p>
            {contact.notes ? (
              <p className="whitespace-pre-wrap break-words text-sm text-ink">{contact.notes}</p>
            ) : (
              <p className="text-sm text-muted">No notes yet</p>
            )}
          </div>
        </div>
      )}

      {/* Delete popup */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">Delete contact?</h3>
            <p className="mt-2 text-sm text-muted">
              {contact?.name} will be removed from your contacts. This cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Could not delete the contact. Please try again.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-ink hover:bg-primary-soft"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
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