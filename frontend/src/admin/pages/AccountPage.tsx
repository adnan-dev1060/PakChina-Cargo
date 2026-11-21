import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AdminApiError, authApi } from "../api";
import { useAuth } from "../auth";
import { FieldShell, TextInput } from "../form/inputs";
import { AdminPageTitle, Card, Spinner, useToast } from "../ui";

export default function AccountPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmNext) {
      setErrors({ confirm: "The new passwords don't match" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await authApi.changePassword(current, next);
      toast.success("Password changed. Please sign in with your new password.");
      qc.setQueryData(["admin", "me"], null);
      navigate("/admin/login", { replace: true });
    } catch (err) {
      if (err instanceof AdminApiError) {
        setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { currentPassword: err.message });
      } else toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageTitle title="My account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-400">Name</dt><dd className="font-semibold text-navy-900">{user?.name}</dd></div>
            <div><dt className="text-slate-400">Email</dt><dd className="font-semibold text-navy-900">{user?.email}</dd></div>
            <div><dt className="text-slate-400">Role</dt><dd className="font-semibold text-navy-900">{user?.role === "super_admin" ? "Super admin" : "Editor"}</dd></div>
          </dl>
        </Card>
        <Card title="Change password" description="You'll be signed out on all devices afterwards.">
          <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
            <FieldShell id="cur" label="Current password" error={errors.currentPassword}>
              <TextInput id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} invalid={!!errors.currentPassword} />
            </FieldShell>
            <FieldShell id="new" label="New password" help="At least 10 characters, with a letter and a number." error={errors.newPassword}>
              <TextInput id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} invalid={!!errors.newPassword} />
            </FieldShell>
            <FieldShell id="confirm" label="Repeat new password" error={errors.confirm}>
              <TextInput id="confirm" type="password" autoComplete="new-password" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} invalid={!!errors.confirm} />
            </FieldShell>
            <Button type="submit" disabled={saving || !current || !next}>{saving && <Spinner className="size-4 text-navy-950" />} Change password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
