import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, CheckCircle2, Trash2, X } from "lucide-react";
import { createContact, fetchContact, updateContact } from "../api/contacts";

const MAX_SIZE = 2 * 1024 * 1024; // backend ki limit ke barabar
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-primary";

function Field({ label, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-sm">
      <div className="h-24 w-24 animate-pulse rounded-full bg-line/60" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  );
}

export default function ContactForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", email: "", phone: "", company: "", designation: "", notes: "" },
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saved, setSaved] = useState(false);

  // edit mode: purana contact laao
  const {
    data: existing,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? "",
      email: existing.email ?? "",
      phone: existing.phone ?? "",
      company: existing.company ?? "",
      designation: existing.designation ?? "",
      notes: existing.notes ?? "",
    });
    setTags(existing.tags ?? []);
  }, [existing, reset]);

  // nayi chuni hui photo ka preview
  useEffect(() => {
    if (!photoFile) {
      setLocalPreview("");
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const preview = localPreview || (removePhoto ? "" : existing?.photoUrl || "");
  const nameValue = watch("name");

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setPhotoError("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      setPhotoError("Photo must be 2MB or smaller");
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
    setRemovePhoto(false);
  };

  const onRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoError("");
    if (existing?.photoUrl) setRemovePhoto(true);
  };

  const parseTags = (raw) =>
    raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  const addTags = (raw) => {
    const incoming = parseTags(raw);
    if (incoming.length) setTags((prev) => [...new Set([...prev, ...incoming])]);
    setTagInput("");
  };

  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const mutation = useMutation({
    mutationFn: (formData) => (isEdit ? updateContact(id, formData) : createContact(formData)),
    onSuccess: () => {
      ["contacts", "contactStats", "tags", "dashboard", "contact"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
      setSaved(true);
      setTimeout(() => navigate("/contacts"), 1000);
    },
  });

  const onSubmit = (values) => {
    const finalTags = [...new Set([...tags, ...parseTags(tagInput)])];

    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => fd.append(key, (value ?? "").trim()));
    fd.append("tags", finalTags.join(",")); // backend comma-separated string leta hai
    if (photoFile) fd.append("photo", photoFile);
    else if (removePhoto) fd.append("removePhoto", "true");

    mutation.mutate(fd);
  };

  const serverError = mutation.isError
    ? mutation.error?.response?.data?.message || "Could not save the contact. Please try again."
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/contacts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to contacts
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {isEdit ? "Edit Contact" : "Add Contact"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isEdit ? "Update the details of this contact" : "Save someone new to your network"}
        </p>
      </div>

      {isEdit && isLoading ? (
        <FormSkeleton />
      ) : isEdit && isError ? (
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 rounded-2xl border border-line bg-card p-6 shadow-sm"
        >
          {/* Photo */}
          <div className="flex items-center gap-5">
            {preview ? (
              <img src={preview} alt="Contact" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lavender text-3xl font-semibold text-accent">
                {nameValue?.trim() ? nameValue.trim().charAt(0).toUpperCase() : <Camera size={28} />}
              </div>
            )}
            <div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl bg-primary-soft px-4 py-2 text-sm font-medium text-primary-dark transition hover:bg-primary-soft/70"
                >
                  {preview ? "Change photo" : "Upload photo"}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">JPG, PNG or WEBP, up to 2MB</p>
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPickPhoto}
                className="hidden"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name *" error={errors.name?.message} className="md:col-span-2">
              <input
                {...register("name", {
                  validate: (v) => v.trim().length > 0 || "Name is required",
                })}
                placeholder="Full name"
                className={inputClass}
              />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input
                {...register("email", {
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
                })}
                type="email"
                placeholder="name@example.com"
                className={inputClass}
              />
            </Field>

            <Field label="Phone" error={errors.phone?.message}>
              <input
                {...register("phone", {
                  pattern: {
                    value: /^[0-9+\-()\s]{6,20}$/,
                    message: "Enter a valid phone number",
                  },
                })}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </Field>

            <Field label="Company">
              <input {...register("company")} placeholder="Company name" className={inputClass} />
            </Field>

            <Field label="Designation">
              <input {...register("designation")} placeholder="Job title" className={inputClass} />
            </Field>

            <Field label="Tags" className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-page px-3 py-2 focus-within:border-primary">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-dark"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                      aria-label={`Remove tag ${t}`}
                      className="rounded-full hover:text-red-600"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={() => tagInput.trim() && addTags(tagInput)}
                  placeholder={tags.length ? "" : "Type a tag and press Enter"}
                  className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-muted/70"
                />
              </div>
              <p className="mt-1 text-xs text-muted">Press Enter or comma to add a tag</p>
            </Field>

            <Field label="Notes" className="md:col-span-2">
              <textarea
                {...register("notes")}
                rows={4}
                placeholder="Anything worth remembering about this person"
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Link
              to="/contacts"
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-ink hover:bg-primary-soft"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || saved}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      )}

      {/* Save confirmation */}
      {saved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-card p-6 text-center shadow-xl">
            <CheckCircle2 className="mx-auto text-primary" size={40} />
            <h3 className="mt-3 font-serif text-xl font-semibold text-ink">
              {isEdit ? "Changes saved" : "Contact added"}
            </h3>
            <p className="mt-1 text-sm text-muted">Taking you back to your contacts...</p>
          </div>
        </div>
      )}
    </div>
  );
}