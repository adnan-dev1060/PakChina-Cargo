import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { ICON_KEYS, getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Card } from "../ui";
import { ImageField } from "../media/ImageField";
import { FieldShell, SelectInput, TextArea, TextInput, Toggle } from "./inputs";
import { getIn, setIn, slugify, toPath, type FieldDef, type FormSection, type Path } from "./types";

interface Ctx {
  root: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors: Record<string, string>;
}

/** Renders a config-driven form. `value` is the full object; every change returns a new object. */
export function FormRenderer({
  sections,
  value,
  onChange,
  errors = {},
}: {
  sections: FormSection[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}) {
  const ctx: Ctx = { root: value, onChange, errors };
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <Card key={s.title} title={s.title} description={s.description}>
          <FieldGrid fields={s.fields} prefix={[]} ctx={ctx} />
        </Card>
      ))}
    </div>
  );
}

function FieldGrid({ fields, prefix, ctx }: { fields: FieldDef[]; prefix: Path; ctx: Ctx }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={cn((f.wide || ["textarea", "paragraphs", "list", "objectList", "image"].includes(f.type)) && "md:col-span-2")}>
          <Field def={f} path={[...prefix, ...toPath(f.name)]} ctx={ctx} />
        </div>
      ))}
    </div>
  );
}

function Field({ def, path, ctx }: { def: FieldDef; path: Path; ctx: Ctx }) {
  const id = useId();
  const key = path.join(".");
  const error = ctx.errors[key];
  const value = getIn(ctx.root, path);
  const set = (v: unknown) => ctx.onChange(setIn(ctx.root, path, v));
  const shell = { id, label: def.label, help: def.help, error, required: def.required };
  const aria = { id, "aria-describedby": error ? `${id}-error` : undefined, invalid: !!error };

  switch (def.type) {
    case "text":
      return (
        <FieldShell {...shell}>
          <TextInput {...aria} value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={def.placeholder} maxLength={def.maxLength} dir={def.dir} lang={def.dir === "rtl" ? "ur" : undefined} />
        </FieldShell>
      );
    case "textarea":
      return (
        <FieldShell {...shell}>
          <TextArea {...aria} rows={def.rows ?? 3} value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={def.placeholder} maxLength={def.maxLength} />
        </FieldShell>
      );
    case "slug": {
      const source = getIn(ctx.root, [...path.slice(0, -1), ...toPath(def.from)]) as string | undefined;
      return (
        <FieldShell {...shell} help={def.help ?? "Used in the page address. Lowercase letters, numbers and hyphens."}>
          <div className="flex gap-2">
            <TextInput {...aria} value={(value as string) ?? ""} onChange={(e) => set(slugify(e.target.value))} />
            <button type="button" onClick={() => set(slugify(source ?? ""))} className="shrink-0 rounded-lg border border-line px-3 text-xs font-semibold text-navy-700 hover:bg-surface">
              From title
            </button>
          </div>
        </FieldShell>
      );
    }
    case "number":
      return (
        <FieldShell {...shell}>
          <TextInput {...aria} type="number" min={def.min} max={def.max} value={value === undefined || value === null ? "" : String(value)} onChange={(e) => set(e.target.value === "" ? undefined : Number(e.target.value))} />
        </FieldShell>
      );
    case "date":
      return (
        <FieldShell {...shell}>
          <TextInput {...aria} type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => set(e.target.value)} />
        </FieldShell>
      );
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-navy-900">{def.label}</p>
            {def.help && <p className="text-xs text-slate-500">{def.help}</p>}
          </div>
          <Toggle id={id} label={def.label} checked={Boolean(value)} onChange={set} />
        </div>
      );
    case "select":
      return (
        <FieldShell {...shell}>
          <SelectInput {...aria} value={(value as string) ?? ""} onChange={(e) => set(e.target.value)}>
            {!def.required && <option value="">—</option>}
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectInput>
        </FieldShell>
      );
    case "icon":
      return (
        <FieldShell {...shell}>
          <div role="radiogroup" aria-label={def.label} className="flex flex-wrap gap-1.5">
            {ICON_KEYS.map((k) => {
              const Icon = getIcon(k);
              const active = value === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={k}
                  aria-label={k}
                  onClick={() => set(k)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg border transition-colors",
                    active ? "border-navy-700 bg-navy-800 text-white" : "border-line text-navy-700 hover:bg-surface",
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </button>
              );
            })}
          </div>
        </FieldShell>
      );
    case "image":
      return (
        <FieldShell {...shell}>
          <ImageField value={(value as string) ?? ""} onChange={set} folder={def.folder} invalid={!!error} />
        </FieldShell>
      );
    case "list":
    case "paragraphs": {
      const items = (value as string[] | undefined) ?? [];
      const multi = def.type === "paragraphs";
      return (
        <FieldShell {...shell}>
          <ul className="space-y-2">
            {items.map((item, i) => {
              const itemErr = ctx.errors[`${key}.${i}`];
              return (
                <li key={i} className="flex items-start gap-2">
                  {multi ? (
                    <TextArea rows={3} value={item} invalid={!!itemErr} aria-label={`${def.itemLabel} ${i + 1}`} onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))} />
                  ) : (
                    <TextInput value={item} invalid={!!itemErr} aria-label={`${def.itemLabel} ${i + 1}`} placeholder={"placeholder" in def ? def.placeholder : undefined} onChange={(e) => set(items.map((x, j) => (j === i ? e.target.value : x)))} />
                  )}
                  <ItemButtons index={i} count={items.length} onMove={(to) => set(move(items, i, to))} onRemove={() => set(items.filter((_, j) => j !== i))} label={def.itemLabel} />
                </li>
              );
            })}
          </ul>
          <AddButton label={def.itemLabel} onClick={() => set([...items, ""])} />
        </FieldShell>
      );
    }
    case "objectList": {
      const items = (value as Record<string, unknown>[] | undefined) ?? [];
      const renumber = (list: Record<string, unknown>[]) =>
        def.orderField ? list.map((it, i) => ({ ...it, [def.orderField!]: i + 1 })) : list;
      return (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-navy-900">{def.label}</p>
          {def.help && <p className="mb-3 text-xs text-slate-500">{def.help}</p>}
          {error && <p className="mb-2 text-xs font-medium text-signal-600">{error}</p>}
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="rounded-xl border border-line bg-surface/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-navy-800">
                    {def.titleField && item[def.titleField] ? String(item[def.titleField]) : `${def.itemLabel} ${i + 1}`}
                  </p>
                  <ItemButtons
                    index={i}
                    count={items.length}
                    label={def.itemLabel}
                    onMove={def.sortable !== false ? (to) => set(renumber(move(items, i, to))) : undefined}
                    onRemove={def.fixed ? undefined : () => set(renumber(items.filter((_, j) => j !== i)))}
                  />
                </div>
                <FieldGrid fields={def.fields} prefix={[...path, i]} ctx={ctx} />
              </li>
            ))}
          </ol>
          {!def.fixed && (!def.max || items.length < def.max) && (
            <AddButton label={def.itemLabel} onClick={() => set(renumber([...items, def.newItem()]))} />
          )}
        </div>
      );
    }
  }
}

function move<T>(list: T[], from: number, to: number) {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function ItemButtons({ index, count, label, onMove, onRemove }: {
  index: number;
  count: number;
  label: string;
  onMove?: (to: number) => void;
  onRemove?: () => void;
}) {
  const btn = "flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500 hover:text-navy-900 disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1">
      {onMove && (
        <>
          <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} ${index + 1} up`}>
            <ArrowUp className="size-4" />
          </button>
          <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} ${index + 1} down`}>
            <ArrowDown className="size-4" />
          </button>
        </>
      )}
      {onRemove && (
        <button type="button" className={cn(btn, "hover:border-signal-500 hover:text-signal-600")} onClick={onRemove} aria-label={`Remove ${label} ${index + 1}`}>
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:border-navy-500 hover:bg-navy-50">
      <Plus className="size-4" aria-hidden /> Add {label.toLowerCase()}
    </button>
  );
}
