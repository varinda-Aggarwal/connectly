import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Plus, StickyNote, Trash2, Users } from "lucide-react";
import { createInteraction, deleteInteraction, fetchInteractions } from "../api/interactions";
import { createFollowup } from "../api/followups";

const TYPES = [
  { key: "call", label: "Call", icon: Phone, style: "bg-primary-soft text-primary-dark" },
  { key: "meeting", label: "Meeting", icon: Users, style: "bg-lavender text-accent" },
  { key: "email", label: "Email", icon: Mail, style: "bg-primary-soft text-primary-dark" },
  { key: "note", label: "Note", icon: StickyNote, style: "bg-lavender text-accent" },
];

const inputClass =
  "w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-primary";

// datetime-local input ko local time ki string chahiye
const toLocalInput = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

function lastContactedText(value) {
  if (!value) return "Not contacted yet";
  const days = Math.round((startOfDay(new Date()) - startOfDay(value)) / 86400000);
  if (days <= 0) return "Last contacted today";
  if (days === 1) return "Last contacted yesterday";
  if (days < 30) return `Last contacted ${days} days ago`;
  return `Last contacted on ${new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export default function InteractionTimeline({ contactId, lastContactedAt }) {
  const queryClient = useQueryClient();

  const [type, setType] = useState("call");
  const [date, setDate] = useState(() => toLocalInput());
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [withFollowup, setWithFollowup] = useState(false);
  const [followupAt, setFollowupAt] = useState("");
  const [warning, setWarning] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const {
    data: interactions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["interactions", contactId],
    queryFn: () => fetchInteractions(contactId),
  });

  const refresh = () => {
    ["interactions", "contact", "contacts", "followups", "dashboard"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      await createInteraction(contactId, {
        type,
        date: new Date(date).toISOString(),
        summary: summary.trim(),
        outcome: outcome.trim(),
      });

      // optional: ek tick se Person 2 ka follow-up API
      let followupFailed = false;
      if (withFollowup && followupAt) {
        try {
          await createFollowup({
            contactId,
            note: `Follow up: ${summary.trim()}`.slice(0, 200),
            dueAt: new Date(followupAt).toISOString(),
          });
        } catch {
          followupFailed = true;
        }
      }
      return { followupFailed };
    },
    onSuccess: ({ followupFailed }) => {
      setSummary("");
      setOutcome("");
      setWithFollowup(false);
      setFollowupAt("");
      setDate(toLocalInput());
      setWarning(followupFailed ? "Interaction saved, but the follow-up could not be created." : "");
      refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInteraction,
    onSuccess: () => {
      setConfirmId(null);
      refresh();
    },
  });

  const canAdd =
    summary.trim() && date && (!withFollowup || followupAt) && !addMutation.isPending;
  const addError = addMutation.isError
    ? addMutation.error?.response?.data?.message || "Could not save the interaction"
    : "";

  return (
    <div className="border-t border-line p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">Interaction history</p>
        <p className="text-xs text-muted">{lastContactedText(lastContactedAt)}</p>
      </div>

      {/* Log interaction form */}
      <div className="space-y-3 rounded-xl border border-line bg-page p-4">
        <p className="text-sm font-medium text-ink">Log interaction</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-white"
                    : "bg-primary-soft text-primary-dark hover:bg-primary-soft/70"
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <input
          type="datetime-local"
          value={date}
          max={toLocalInput()}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />

        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What did you talk about?"
          className={`${inputClass} resize-y`}
        />

        <input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          maxLength={200}
          placeholder="Outcome (optional), e.g. Agreed to send proposal"
          className={inputClass}
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={withFollowup}
            onChange={(e) => setWithFollowup(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary,#6b7f45)]"
          />
          Schedule a follow-up
        </label>

        {withFollowup && (
          <input
            type="datetime-local"
            value={followupAt}
            min={toLocalInput()}
            onChange={(e) => setFollowupAt(e.target.value)}
            className={inputClass}
          />
        )}

        {addError && <p className="text-xs text-red-600">{addError}</p>}
        {warning && <p className="text-xs text-accent">{warning}</p>}

        <div className="flex justify-end">
          <button
            onClick={() => canAdd && addMutation.mutate()}
            disabled={!canAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50 sm:w-auto"
          >
            <Plus size={16} /> {addMutation.isPending ? "Saving..." : "Log interaction"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-line bg-page px-4 py-8 text-center">
            <p className="text-sm text-ink">Could not load the interaction history.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        ) : interactions.length === 0 ? (
          <div className="py-8 text-center">
            <StickyNote className="mx-auto text-primary" size={30} />
            <p className="mt-3 text-sm font-medium text-ink">No interactions logged yet</p>
            <p className="mt-1 text-sm text-muted">Log your first call, meeting, email or note above.</p>
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-line pl-6">
            {interactions.map((item) => {
              const meta = TYPES.find((t) => t.key === item.type) ?? TYPES[3];
              const Icon = meta.icon;
              return (
                <li key={item._id} className="relative">
                  <span
                    className={`absolute -left-[38px] flex h-7 w-7 items-center justify-center rounded-full ${meta.style}`}
                  >
                    <Icon size={14} />
                  </span>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {meta.label}
                        <span className="ml-2 text-xs font-normal text-muted">
                          {new Date(item.date).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{item.summary}</p>
                      {item.outcome && (
                        <p className="mt-1 break-words text-xs text-muted">Outcome: {item.outcome}</p>
                      )}
                    </div>

                    {confirmId === item._id ? (
                      <div className="flex shrink-0 items-center gap-3 text-xs">
                        <button
                          onClick={() => deleteMutation.mutate(item._id)}
                          disabled={deleteMutation.isPending}
                          className="font-semibold text-red-600 disabled:opacity-60"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                        <button onClick={() => setConfirmId(null)} className="text-muted hover:text-ink">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(item._id)}
                        aria-label="Delete interaction"
                        className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {deleteMutation.isError && (
          <p className="mt-3 text-xs text-red-600">Could not delete the interaction. Please try again.</p>
        )}
      </div>
    </div>
  );
}