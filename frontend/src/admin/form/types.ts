import type { MediaFolder } from "../types";

interface Base {
  /** Dotted path into the value object, e.g. "hero.title". */
  name: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Spans both columns in the two-column grid. */
  wide?: boolean;
}

export type FieldDef =
  | (Base & { type: "text"; placeholder?: string; maxLength?: number; dir?: "rtl" })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string; maxLength?: number })
  | (Base & { type: "slug"; from: string })
  | (Base & { type: "number"; min?: number; max?: number })
  | (Base & { type: "date" })
  | (Base & { type: "toggle" })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "icon" })
  | (Base & { type: "image"; folder: MediaFolder })
  | (Base & { type: "list"; itemLabel: string; placeholder?: string })
  | (Base & { type: "paragraphs"; itemLabel: string })
  | (Base & {
      type: "objectList";
      itemLabel: string;
      fields: FieldDef[];
      newItem: () => Record<string, unknown>;
      /** Items can be moved up/down; after a move each item's `orderField` is renumbered. */
      sortable?: boolean;
      orderField?: string;
      /** Items can't be added or removed (e.g. homepage sections). */
      fixed?: boolean;
      /** Field whose value titles each item card. */
      titleField?: string;
      max?: number;
    });

export interface FormSection {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export type Path = (string | number)[];

export function toPath(name: string): Path {
  return name.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

export function getIn(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string | number, unknown>)[key]), obj);
}

export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [head, ...rest] = path;
  const source = (obj ?? (typeof head === "number" ? [] : {})) as Record<string | number, unknown>;
  const copy = (Array.isArray(source) ? [...source] : { ...source }) as Record<string | number, unknown>;
  copy[head] = setIn(source[head], rest, value);
  return copy as T;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
