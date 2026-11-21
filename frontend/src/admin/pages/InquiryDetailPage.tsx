import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useContent";
import { whatsappHref } from "@/lib/utils";
import { inquiryAdminApi } from "../api";
import { SelectInput, TextArea } from "../form/inputs";
import { INQUIRY_STATUS_LABEL, type InquiryRecord, type InquiryStatus } from "../types";
import { Badge, Card, FullPageSpinner, LoadError, Spinner, useConfirm, useToast } from "../ui";
import { statusTone } from "./InquiriesPage";

const MODE_LABEL: Record<string, string> = { sea: "Sea freight", air: "Air freight", road: "Road", "not-sure": "Not sure yet" };

export default function InquiryDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "inquiry", id], queryFn: () => inquiryAdminApi.get(id) });
  if (isLoading) return <FullPageSpinner />;
  if (error || !data) return <LoadError error={error} onRetry={() => refetch()} />;
  return <InquiryDetail key={data.id} inquiry={data} />;
}

function InquiryDetail({ inquiry }: { inquiry: InquiryRecord }) {
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const dirty = status !== inquiry.status || notes !== (inquiry.notes ?? "");

  const phoneDigits = inquiry.phone.replace(/\D/g, "").replace(/^0/, "92");
  const reply = `Assalam o Alaikum ${inquiry.name}, thank you for contacting ${settings?.companyName ?? "us"} about shipping ${inquiry.cargoType} to ${inquiry.city}.`;

  const save = async (patch?: Partial<{ status: InquiryStatus; notes: string }>) => {
    setSaving(true);
    try {
      const updated = await inquiryAdminApi.update(inquiry.id, patch ?? { status, notes });
      qc.setQueryData(["admin", "inquiry", inquiry.id], updated);
      await qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Inquiry updated");
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const yes = await confirm({ title: "Delete inquiry?", message: `The request from ${inquiry.name} will be permanently deleted.`, confirmLabel: "Delete", danger: true });
    if (!yes) return;
    try {
      await inquiryAdminApi.remove(inquiry.id);
      await qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Inquiry deleted");
      navigate("/admin/inquiries");
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <>
      <Link to="/admin/inquiries" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
        <ArrowLeft className="size-4" aria-hidden /> All inquiries
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <title>{`${inquiry.name} | Inquiries · Admin`}</title>
        <h1 className="text-2xl font-extrabold text-navy-900">{inquiry.name}</h1>
        <Badge tone={statusTone(inquiry.status)}>{INQUIRY_STATUS_LABEL[inquiry.status]}</Badge>
        <span className="text-sm text-slate-500">Received {new Date(inquiry.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Shipment details">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Goods" value={inquiry.cargoType} />
              <Detail label="Shipping mode" value={MODE_LABEL[inquiry.mode] ?? inquiry.mode} />
              <Detail label="Delivery city" value={inquiry.city} />
              <Detail label="Phone" value={inquiry.phone} />
              {inquiry.email && <Detail label="Email" value={inquiry.email} />}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-700">{inquiry.message || "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Internal notes" description="Only visible to admins.">
            <TextArea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Internal notes" placeholder="e.g. Quoted Rs 1,200/kg by air, follow up Monday" maxLength={3000} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label htmlFor="status" className="text-sm font-semibold text-navy-900">Status</label>
              <SelectInput id="status" value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className="w-44">
                {(Object.keys(INQUIRY_STATUS_LABEL) as InquiryStatus[]).map((s) => (
                  <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
                ))}
              </SelectInput>
              <Button onClick={() => void save()} disabled={!dirty || saving} className="ml-auto">
                {saving && <Spinner className="size-4 text-navy-950" />} Save
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Reply">
            <div className="grid gap-2">
              <a href={whatsappHref(phoneDigits, reply)} target="_blank" rel="noopener noreferrer"
                onClick={() => inquiry.status === "new" && void save({ status: "in_progress" })}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white hover:brightness-95">
                <MessageCircle className="size-4.5" aria-hidden /> Reply on WhatsApp
              </a>
              <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-navy-800 hover:bg-surface">
                <Phone className="size-4" aria-hidden /> Call {inquiry.phone}
              </a>
              {inquiry.email && (
                <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Your shipping inquiry")}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-navy-800 hover:bg-surface">
                  <Mail className="size-4" aria-hidden /> Email
                </a>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">Opening WhatsApp marks a new inquiry as “In progress”.</p>
          </Card>
          <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-600 hover:underline">
            <Trash2 className="size-4" aria-hidden /> Delete inquiry
          </button>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 font-medium text-navy-900">{value}</dd>
    </div>
  );
}
