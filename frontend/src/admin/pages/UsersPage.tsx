import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminApiError, usersApi } from "../api";
import { useAuth } from "../auth";
import { FieldShell, SelectInput, TextInput, Toggle } from "../form/inputs";
import type { AdminUser, Role } from "../types";
import { AdminPageTitle, Badge, FullPageSpinner, LoadError, Modal, Spinner, useConfirm, useToast } from "../ui";
import { timeAgo } from "./DashboardPage";

const PASSWORD_HELP = "At least 10 characters, with a letter and a number.";

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "users"], queryFn: usersApi.list });
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const update = async (u: AdminUser, patch: Parameters<typeof usersApi.update>[1], message: string) => {
    try {
      await usersApi.update(u.id, patch);
      await refresh();
      toast.success(message);
    } catch (err) {
      toast.error(err);
    }
  };

  const remove = async (u: AdminUser) => {
    if (!(await confirm({ title: "Remove admin?", message: `${u.name} (${u.email}) will lose access immediately.`, confirmLabel: "Remove", danger: true }))) return;
    try {
      await usersApi.remove(u.id);
      await refresh();
      toast.success("Admin removed");
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <>
      <AdminPageTitle
        title="Admin users"
        description="Editors can manage all website content. Super admins can also manage admin accounts."
        actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" aria-hidden /> Add admin</Button>}
      />
      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : (
        <ul className="space-y-2">
          {data?.map((u) => {
            const isMe = u.id === me?.id;
            return (
              <li key={u.id} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-800 font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                    {u.name} {isMe && <Badge tone="blue">You</Badge>} {!u.active && <Badge tone="red">Deactivated</Badge>}
                  </p>
                  <p className="truncate text-sm text-slate-500">{u.email} · {u.lastLoginAt ? `last sign-in ${timeAgo(u.lastLoginAt)}` : "never signed in"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SelectInput value={u.role} disabled={isMe} aria-label={`Role for ${u.name}`} className="w-36"
                    onChange={(e) => void update(u, { role: e.target.value as Role }, "Role updated")}>
                    <option value="editor">Editor</option>
                    <option value="super_admin">Super admin</option>
                  </SelectInput>
                  {!isMe && (
                    <div className="flex items-center gap-2 px-1">
                      <Toggle checked={u.active} label={u.active ? "Deactivate" : "Activate"} onChange={(v) => void update(u, { active: v }, v ? "Account activated" : "Account deactivated")} />
                    </div>
                  )}
                  {!isMe && (
                    <>
                      <button type="button" onClick={() => setResetting(u)} aria-label={`Set new password for ${u.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-surface hover:text-navy-900"><KeyRound className="size-4" /></button>
                      <button type="button" onClick={() => void remove(u)} aria-label={`Remove ${u.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-signal-500/10 hover:text-signal-600"><Trash2 className="size-4" /></button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && <CreateUserModal onClose={() => setCreating(false)} onCreated={() => { void refresh(); toast.success("Admin added"); }} />}
      {resetting && (
        <ResetPasswordModal user={resetting} onClose={() => setResetting(null)}
          onSave={async (password) => { await usersApi.update(resetting.id, { password }); toast.success("Password changed — they've been signed out everywhere"); }} />
      )}
    </>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      await usersApi.create(form);
      onCreated();
      onClose();
    } catch (err) {
      setErrors(err instanceof AdminApiError ? { ...err.fieldErrors, _: Object.keys(err.fieldErrors).length ? "" : err.message } : { _: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add admin" footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={saving}>{saving && <Spinner className="size-4 text-navy-950" />} Add admin</Button>
      </>
    }>
      <div className="space-y-4">
        <FieldShell id="u-name" label="Name" required error={errors.name}><TextInput id="u-name" value={form.name} onChange={set("name")} invalid={!!errors.name} /></FieldShell>
        <FieldShell id="u-email" label="Email" required error={errors.email}><TextInput id="u-email" type="email" value={form.email} onChange={set("email")} invalid={!!errors.email} /></FieldShell>
        <FieldShell id="u-pass" label="Temporary password" required help={PASSWORD_HELP} error={errors.password}><TextInput id="u-pass" type="text" autoComplete="new-password" value={form.password} onChange={set("password")} invalid={!!errors.password} /></FieldShell>
        <FieldShell id="u-role" label="Role">
          <SelectInput id="u-role" value={form.role} onChange={set("role")}>
            <option value="editor">Editor — manages website content</option>
            <option value="super_admin">Super admin — also manages admins</option>
          </SelectInput>
        </FieldShell>
        {errors._ && <p role="alert" className="text-sm font-medium text-signal-600">{errors._}</p>}
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(password);
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? (Object.values(err.fieldErrors)[0] ?? err.message) : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`New password for ${user.name}`} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={saving || !password}>Set password</Button>
      </>
    }>
      <FieldShell id="reset-pass" label="New password" help={PASSWORD_HELP} error={error ?? undefined}>
        <TextInput id="reset-pass" type="text" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
      </FieldShell>
    </Modal>
  );
}
