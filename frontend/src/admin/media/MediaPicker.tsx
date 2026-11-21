import { Check, ImagePlus, Link2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TextInput } from "../form/inputs";
import { MEDIA_FOLDERS, type MediaFolder } from "../types";
import { Modal, Spinner, useToast } from "../ui";
import { ACCEPTED_TYPES, thumb, useMediaList, useUploadMedia } from "./useMedia";

/** Choose an image from the library, upload a new one, or paste an external https URL. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  folder: defaultFolder,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder: MediaFolder;
}) {
  const [tab, setTab] = useState<"library" | "url">("library");
  const [folder, setFolder] = useState<MediaFolder | "">(defaultFolder);
  const [selected, setSelected] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { data, isLoading } = useMediaList(folder || undefined);
  const upload = useUploadMedia();

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const media = await upload.mutateAsync({ file, folder: folder || defaultFolder, alt: "" });
      setSelected(media.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const choose = () => {
    const value = tab === "url" ? url.trim() : selected;
    if (!value) return;
    if (tab === "url" && !/^https:\/\/\S+$/.test(value)) {
      toast.error(new Error("Enter an https:// image address"));
      return;
    }
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose an image"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={choose} disabled={tab === "library" ? !selected : !url.trim()}>Use this image</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-surface p-1">
          {(["library", "url"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-md px-3 py-1.5 text-sm font-semibold", tab === t ? "bg-white text-navy-900 shadow-sm" : "text-slate-500")}>
              {t === "library" ? "Media library" : "From URL"}
            </button>
          ))}
        </div>
        {tab === "library" && (
          <>
            <select value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder | "")} aria-label="Folder" className="h-9 rounded-lg border border-line bg-white px-3 text-sm">
              <option value="">All folders</option>
              {MEDIA_FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} className="sr-only" id="picker-upload" onChange={(e) => void onFiles(e.target.files)} />
            <label htmlFor="picker-upload" className="ml-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-navy-800 px-3.5 text-sm font-semibold text-white hover:bg-navy-700">
              {upload.isPending ? <Spinner className="size-4 text-white" /> : <Upload className="size-4" aria-hidden />}
              {upload.isPending ? "Uploading…" : "Upload new"}
            </label>
          </>
        )}
      </div>

      {tab === "url" ? (
        <div className="space-y-3">
          <label htmlFor="picker-url" className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Link2 className="size-4" aria-hidden /> Image address
          </label>
          <TextInput id="picker-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <p className="text-xs text-slate-500">Prefer uploading to the library — external images can disappear or load slowly.</p>
          {/^https:\/\/\S+$/.test(url.trim()) && <img src={url.trim()} alt="Preview" className="max-h-64 rounded-lg border border-line" />}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !data?.items.length ? (
        <label htmlFor="picker-upload" className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line py-16 text-center text-sm text-slate-500 hover:border-navy-300">
          <ImagePlus className="size-8 text-navy-300" aria-hidden />
          No images in this folder yet. Click to upload one.
        </label>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.items.map((m) => {
            const active = selected === m.url;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelected(m.url)}
                  onDoubleClick={() => { onSelect(m.url); onClose(); }}
                  aria-pressed={active}
                  className={cn("group relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface", active ? "border-gold-500" : "border-transparent hover:border-navy-200")}
                >
                  <img src={thumb(m.url, 300)} alt={m.alt || "Library image"} loading="lazy" className="size-full object-cover" />
                  {active && (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-gold-500 text-navy-950">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
