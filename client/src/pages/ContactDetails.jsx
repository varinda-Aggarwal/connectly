import InteractionTimeline from "../components/InteractionTimeline";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Mail,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { deleteContact, fetchContact, toggleFavourite } from "../api/contacts";
import {
  createFollowup,
  deleteFollowup,
  fetchFollowups,
  toggleFollowupDone,
  updateFollowup,
} from "../api/followups";

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
    <div className="space-y-4 rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="h-20 w-20 animate-pulse rounded-full bg-line/60 sm:h-24 sm:w-24" />
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
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupNote, setFollowupNote] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState("");
  const [editingFollowupId, setEditingFollowupId] = useState(null);

  const {
    data: contact,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact(id),
  });

  const {
    data: followups = [],
    isLoading: followupsLoading,
  } = useQuery({
    queryKey: ["followups", id],
    queryFn: () => fetchFollowups(id),
  });

  const refreshLists = () => {
    ["contacts", "contactStats", "tags", "dashboard", "trash", "followups"].forEach((key) =>
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

  const createFollowupMutation = useMutation({
    mutationFn: () =>
      createFollowup({
        contactId: id,
        note: followupNote,
        dueAt: followupDueAt,
      }),
    onSuccess: () => {
      setFollowupNote("");
      setFollowupDueAt("");
      setShowFollowupForm(false);
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const toggleDoneMutation = useMutation({
    mutationFn: toggleFollowupDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateFollowupMutation = useMutation({
    mutationFn: () =>
      updateFollowup(editingFollowupId, {
        note: followupNote,
        dueAt: followupDueAt,
      }),
    onSuccess: () => {
      setEditingFollowupId(null);
      setFollowupNote("");
      setFollowupDueAt("");
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteFollowupMutation = useMutation({
    mutationFn: deleteFollowup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const formatFollowupDate = (dueAt) =>
    new Date(dueAt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const toDateTimeInputValue = (dueAt) => {
    const date = new Date(dueAt);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

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
          <div className="flex flex-wrap items-center gap-4 p-4 sm:gap-5 sm:p-6">
            {contact.photoUrl ? (
              <img
                src={contact.photoUrl}
                alt={contact.name}
                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lavender text-3xl font-semibold text-accent sm:h-24 sm:w-24">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="break-words font-serif text-2xl font-semibold text-ink sm:text-3xl">
                {contact.name}
              </h1>
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

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
                <Trash2 size={16} /> Move to Trash
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="grid gap-5 border-t border-line p-4 sm:p-6 md:grid-cols-2">
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
          <div className="border-t border-line p-4 sm:p-6">
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

          {/* Follow-ups */}
          <div className="border-t border-line p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Follow-ups</p>
                <p className="mt-0.5 text-xs text-muted">Plan and complete your next conversations.</p>
              </div>
              <button
                onClick={() => setShowFollowupForm((visible) => !visible)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {showFollowupForm && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  createFollowupMutation.mutate();
                }}
                className="mt-4 rounded-xl bg-primary-soft/40 p-4"
              >
                <label className="block text-xs font-medium text-ink">
                  Reminder note
                  <input
                    value={followupNote}
                    onChange={(event) => setFollowupNote(event.target.value)}
                    maxLength={200}
                    required
                    placeholder="Call to discuss the project"
                    className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </label>
                <label className="mt-3 block text-xs font-medium text-ink">
                  Date and time
                  <input
                    type="datetime-local"
                    value={followupDueAt}
                    onChange={(event) => setFollowupDueAt(event.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </label>
                {createFollowupMutation.isError && (
                  <p className="mt-3 text-sm text-red-600">Could not add the follow-up.</p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFollowupForm(false)}
                    className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-card"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFollowupMutation.isPending}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {createFollowupMutation.isPending ? "Saving..." : "Save follow-up"}
                  </button>
                </div>
              </form>
            )}

            {followupsLoading ? (
              <div className="mt-4 h-16 animate-pulse rounded-xl bg-line/60" />
            ) : followups.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line py-7 text-center">
                <CalendarClock className="mx-auto text-primary" size={24} />
                <p className="mt-2 text-sm text-muted">No follow-ups scheduled</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {followups.map((followup) => (
                  <li
                    key={followup._id}
                    className={`flex flex-wrap items-start gap-3 rounded-xl border border-line p-3 ${
                      followup.isDone ? "bg-line/30 opacity-70" : "bg-card"
                    }`}
                  >
                    <button
                      onClick={() => toggleDoneMutation.mutate(followup._id)}
                      disabled={toggleDoneMutation.isPending}
                      aria-label={followup.isDone ? "Mark follow-up incomplete" : "Mark follow-up complete"}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        followup.isDone
                          ? "border-primary bg-primary text-white"
                          : "border-muted/50 text-transparent hover:border-primary"
                      }`}
                    >
                      <Check size={13} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm text-ink ${followup.isDone ? "line-through" : ""}`}>
                        {followup.note}
                      </p>
                      <p className="mt-1 text-xs text-muted">{formatFollowupDate(followup.dueAt)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingFollowupId(followup._id);
                        setFollowupNote(followup.note);
                        setFollowupDueAt(toDateTimeInputValue(followup.dueAt));
                        updateFollowupMutation.reset();
                      }}
                      disabled={Boolean(editingFollowupId)}
                      aria-label="Edit follow-up"
                      className="rounded-lg p-1.5 text-muted hover:bg-primary-soft hover:text-primary-dark disabled:opacity-50"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteFollowupMutation.mutate(followup._id)}
                      disabled={deleteFollowupMutation.isPending}
                      aria-label="Delete follow-up"
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                    {editingFollowupId === followup._id && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          updateFollowupMutation.mutate();
                        }}
                        className="w-full space-y-3 border-t border-line pt-3"
                      >
                        <label className="block text-xs font-medium text-ink">
                          Reminder note
                          <input
                            value={followupNote}
                            onChange={(event) => setFollowupNote(event.target.value)}
                            maxLength={200}
                            required
                            className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                          />
                        </label>
                        <label className="block text-xs font-medium text-ink">
                          Date and time
                          <input
                            type="datetime-local"
                            value={followupDueAt}
                            onChange={(event) => setFollowupDueAt(event.target.value)}
                            required
                            className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                          />
                        </label>
                        {updateFollowupMutation.isError && (
                          <p className="text-sm text-red-600">Could not update the follow-up.</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFollowupId(null);
                              setFollowupNote("");
                              setFollowupDueAt("");
                            }}
                            className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-primary-soft"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updateFollowupMutation.isPending}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                          >
                            {updateFollowupMutation.isPending ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <div className="border-t border-line p-4 sm:p-6">
            <p className="mb-2 text-sm font-medium text-ink">Notes</p>
            {contact.notes ? (
              <p className="whitespace-pre-wrap break-words text-sm text-ink">{contact.notes}</p>
            ) : (
              <p className="text-sm text-muted">No notes yet</p>
            )}
          </div>

          {/* Interaction history */}
          <InteractionTimeline contactId={contact._id} lastContactedAt={contact.lastContactedAt} />
        </div>
      )}

      {/* Delete popup */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">Move to Trash?</h3>
            <p className="mt-2 text-sm text-muted">
              {contact?.name} will be moved to Trash. You can restore it within 30 days.
            </p>
            {deleteMutation.isError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Could not move the contact to Trash. Please try again.
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
                {deleteMutation.isPending ? "Moving..." : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}