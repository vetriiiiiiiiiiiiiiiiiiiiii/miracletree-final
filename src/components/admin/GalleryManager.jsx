"use client";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Card, Pill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { uploadImage } from "@/components/admin/ImageField";
import { Checkbox, FormMessage, Input, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import {
  addGalleryPhotosAction,
  deleteGalleryPhotoAction,
  reorderGalleryPhotosAction,
  saveGalleryPhotoAction,
} from "@/app/actions/admin/gallery";
const INITIAL = { status: "idle" };
const isUpload = (url) => typeof url === "string" && url.startsWith("/uploads/");
/**
 * One card per gallery group: upload several photos at once, drag to reorder,
 * click a photo to edit its description and caption, move it to another
 * group, hide it or delete it.
 */
export function GalleryManager({ groups }) {
  if (!groups.length) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-cream-400">
          Add a group above first — photos are uploaded into a group.
        </p>
      </Card>
    );
  }
  const options = groups.map((g) => ({ value: g.id, label: g.title }));
  return (
    <div className="grid gap-5">
      {groups.map((group) => (
        <GroupPhotos key={group.id} group={group} groupOptions={options} />
      ))}
    </div>
  );
}
function GroupPhotos({ group, groupOptions }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [, startTransition] = useTransition();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [order, setOrder] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  // The server's order wins again whenever fresh props arrive.
  useEffect(() => setOrder(null), [group.photos]);
  const photos = order
    ? order.map((id) => group.photos.find((p) => p.id === id)).filter(Boolean)
    : group.photos;
  const refresh = () => startTransition(() => router.refresh());
  const upload = async (files) => {
    if (!files?.length) return;
    setError(null);
    const uploaded = [];
    for (const [index, file] of [...files].entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      try {
        uploaded.push(await uploadImage(file, "gallery"));
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
        break;
      }
    }
    if (uploaded.length) {
      setProgress("Saving…");
      const result = await addGalleryPhotosAction({
        groupId: group.id,
        photos: uploaded,
      });
      if (!result.ok) setError(result.error);
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    refresh();
  };
  const onDrop = async (targetId) => {
    if (!dragging || dragging === targetId) return;
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(dragging);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    setOrder(ids);
    setDragging(null);
    const result = await reorderGalleryPhotosAction(group.id, ids);
    if (!result.ok) {
      setOrder(null);
      setError(result.error);
      return;
    }
    refresh();
  };
  const remove = async (photo) => {
    setDeleting(null);
    const result = await deleteGalleryPhotoAction(photo.id);
    if (!result.ok) setError(result.error);
    if (editing?.id === photo.id) setEditing(null);
    refresh();
  };
  const inputId = `gallery-upload-${group.id}`;
  return (
    <Card
      title={group.title}
      description={`${group.photos.length} photo${group.photos.length === 1 ? "" : "s"} · /gallery#${group.slug}`}
      actions={
        <>
          {!group.isActive ? <Pill tone="neutral">Hidden group</Pill> : null}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={(event) => void upload(event.target.files)}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className={cn(
              "cursor-pointer border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100",
              progress && "pointer-events-none opacity-60",
            )}
          >
            {progress ?? "Upload photos"}
          </label>
        </>
      }
    >
      {error ? <FormMessage>{error}</FormMessage> : null}

      {photos.length ? (
        <ul className="mt-1 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo) => (
            <li
              key={photo.id}
              draggable
              onDragStart={() => setDragging(photo.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void onDrop(photo.id)}
              onDragEnd={() => setDragging(null)}
              className={cn(
                "group relative aspect-square cursor-grab overflow-hidden border bg-ink-700 active:cursor-grabbing",
                editing?.id === photo.id
                  ? "border-gold-400"
                  : dragging === photo.id
                    ? "border-gold-400 opacity-50"
                    : "border-border-subtle",
                !photo.isActive && "opacity-50",
              )}
            >
              <button
                type="button"
                onClick={() => setEditing(editing?.id === photo.id ? null : photo)}
                className="absolute inset-0"
                aria-label={`Edit photo: ${photo.alt}`}
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized={isUpload(photo.url)}
                />
              </button>
              {!photo.isActive ? (
                <span className="pointer-events-none absolute left-1.5 top-1.5 bg-ink/85 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.1em] text-cream-300">
                  Hidden
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setDeleting(photo)}
                aria-label="Delete photo"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center bg-ink/85 text-cream-300 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-border-subtle px-5 py-10 text-center text-sm text-cream-400">
          No photos in this group yet. A group with no visible photos is left off
          the page.
        </p>
      )}

      {photos.length ? (
        <p className="mt-3 text-xs text-cream-400">
          Drag to reorder. Click a photo to edit its description and caption.
          JPEG, PNG, WebP, AVIF or GIF up to 8MB each — converted to WebP and
          resized automatically.
        </p>
      ) : null}

      {editing ? (
        <PhotoForm
          key={editing.id}
          photo={editing}
          groupOptions={groupOptions}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this photo?"
        body="It is removed from the gallery. The file stays in the media library. To take it down temporarily, untick 'Show on the page' instead."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
      />
    </Card>
  );
}
function PhotoForm({ photo, groupOptions, onDone, onCancel }) {
  const [state, action] = useActionState(saveGalleryPhotoAction, INITIAL);
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  return (
    <form
      action={action}
      className="mt-5 grid gap-5 border-t border-border-subtle pt-5 md:grid-cols-[10rem_1fr]"
    >
      <input type="hidden" name="id" value={photo.id} />
      <div className="relative aspect-square w-40 overflow-hidden border border-border-subtle bg-ink-700">
        <Image
          src={photo.url}
          alt=""
          fill
          sizes="160px"
          className="object-contain"
          unoptimized={isUpload(photo.url)}
        />
      </div>
      <div className="grid gap-5">
        {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}
        <Input
          name="alt"
          label="Description"
          required
          maxLength={300}
          defaultValue={photo.alt}
          error={errors.alt}
          hint="What the photo shows, for screen readers and search engines."
        />
        <Textarea
          name="caption"
          label="Caption"
          rows={2}
          maxLength={400}
          defaultValue={photo.caption ?? ""}
          error={errors.caption}
          hint="Shown under the photo. If it names someone, check the name is right."
        />
        <Select
          name="groupId"
          label="Group"
          options={groupOptions}
          defaultValue={photo.groupId}
          error={errors.groupId}
        />
        <Checkbox
          name="isActive"
          label="Show on the page"
          defaultChecked={photo.isActive}
        />
        <div className="flex flex-wrap gap-3">
          <SaveButton />
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-400 transition-colors hover:text-cream-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
