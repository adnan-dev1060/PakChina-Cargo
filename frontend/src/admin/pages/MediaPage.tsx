import { Copy, ImagePlus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "../api";
import { TextInput } from "../form/inputs";
import { ACCEPTED_TYPES, formatBytes, thumb, useMediaList, useUploadMedia } from "../media/useMedia";
import { MEDIA_FOLDERS, type MediaFolder, type MediaItem } from "../types";
import { AdminPageTitle, Badge, LoadError, Modal, Spinner, useConfirm, useToast } from "../ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function MediaPage() {
  const [folder, setFolder] = useState<MediaFolder | "">("");
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("general");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error, refetch } = useMediaList(folder || undefined, page);
  const upload = useUploadMedia();
  const toast = useToast();

  const uploadFiles = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []);
    let ok = 0;
    for (const file of list) {
      try {
        await upload.mutateAsync({ file, folder: uploadFolder, alt: "" });
        ok++;
      } catch (err) {
        toast.error(err);
      }
    }
    if (ok) toast.success(`${ok} image${ok > 1 ? "s" : ""} uploaded`);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <AdminPageTitle title="Media library" description="Images are stored on Cloudinary and optimised automatically for each device." />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void uploadFiles(e.dataTransfer.files); }}
        className={cn("mb-6 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white px-6 py-8 text-center transition-colors sm:flex-row sm:text-left", dragging ? "border-gold-500 bg-gold-100/40" : "border-navy-200")}
      >
        <ImagePlus className="size-8 shrink-0 text-navy-400" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-900">Drag images here or choose files</p>
          <p className="text-xs text-slate-500">JPG, PNG, WebP or AVIF · up to 5 MB each</p>
        </div>
        <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} aria-label="Upload to folder" className="h-10 rounded-lg border border-line bg-white px-3 text-sm">
          {MEDIA_FOLDERS.map((f) => <option key={f} value={f}>Upload to: {f}</option>)}
        </select>
        <input ref={fileRef} id="media-upload" type="file" multiple accept={ACCEPTED_TYPES} className="sr-only" onChange={(e) => void uploadFiles(e.target.files)} />
        <label htmlFor="media-upload" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-gold-500 px-4 text-sm font-semibold text-navy-950 hover:bg-gold-400">
          {upload.isPending ? <Spinner className="size-4 text-navy-950" /> : <Upload className="size-4" aria-hidden />}
          {upload.isPending ? "Uploading…" : "Choose files"}
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Folders">
        {(["", ...MEDIA_FOLDERS] as const).map((f) => (
          <button key={f || "all"} type="button" role="tab" aria-selected={folder === f} onClick={() => { setFolder(f); setPage(1); }}
            className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize", folder === f ? "bg-navy-800 text-white" : "bg-white text-slate-600 hover:text-navy-900")}>
            {f || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <p className="rounded-xl border border-line bg-white py-16 text-center text-sm text-slate-500">No images here yet.</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setActive(m)} className="group block w-full overflow-hidden rounded-xl border border-line bg-white text-left hover:border-navy-300">
                  <img src={thumb(m.url, 360)} alt={m.alt || ""} loading="lazy" className="aspect-square w-full bg-surface object-cover" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <Badge>{m.folder}</Badge>
                    <span className="text-xs text-slate-500">{m.width && m.height ? `${m.width}×${m.height}` : ""}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-slate-500">Page {data.page} of {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {active && <MediaDetails item={active} onClose={() => setActive(null)} />}
    </>
  );
}

function MediaDetails({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const [alt, setAlt] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const saveAlt = async () => {
    setSaving(true);
    try {
      await mediaApi.updateAlt(item.id, alt);
      await qc.invalidateQueries({ queryKey: ["admin", "media"] });
      toast.success("Description saved");
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const yes = await confirm({ title: "Delete image?", message: "It will be removed from the library and from Cloudinary. This can't be undone.", confirmLabel: "Delete", danger: true });
    if (!yes) return;
    try {
      await mediaApi.remove(item.id);
      await qc.invalidateQueries({ queryKey: ["admin", "media"] });
      toast.success("Image deleted");
      onClose();
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <Modal open onClose={onClose} title="Image details" size="lg"
      footer={
        <>
          <Button variant="outline" className="mr-auto text-signal-600 hover:border-signal-500" onClick={() => void remove()}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => void saveAlt()} disabled={saving || alt === item.alt}>Save</Button>
        </>
      }>
      <div className="grid gap-5 md:grid-cols-2">
        <img src={thumb(item.url, 800)} alt={item.alt} className="w-full rounded-lg bg-surface object-contain" />
        <div className="space-y-4 text-sm">
          <div>
            <label htmlFor="media-alt" className="mb-1.5 block font-semibold text-navy-900">Description (alt text)</label>
            <TextInput id="media-alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Container ship at port" maxLength={200} />
            <p className="mt-1.5 text-xs text-slate-500">Describes the image for screen readers and search engines.</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-slate-600">
            <dt className="text-slate-400">Folder</dt><dd>{item.folder}</dd>
            <dt className="text-slate-400">Size</dt><dd>{item.width}×{item.height} · {formatBytes(item.bytes)}</dd>
            <dt className="text-slate-400">Format</dt><dd className="uppercase">{item.format}</dd>
            <dt className="text-slate-400">Uploaded</dt><dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
          </dl>
          <button type="button" onClick={() => void navigator.clipboard.writeText(item.url).then(() => toast.success("Link copied"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-semibold text-navy-700 hover:bg-surface">
            <Copy className="size-3.5" aria-hidden /> Copy link
          </button>
        </div>
      </div>
    </Modal>
  );
}
