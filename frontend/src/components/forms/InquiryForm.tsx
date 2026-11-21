import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useContactLinks } from "@/hooks/useContactLinks";
import { useOffices } from "@/hooks/useContent";
import { ApiError, inquiryApi } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Field } from "./fields";
import { fieldProps, inputClass, trapValue } from "./fieldUtils";
import type { InquiryInput } from "@/types/content";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number, e.g. 0300 1234567"),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).optional(),
  city: z.string().trim().min(2, "Which city should we deliver to?").max(60),
  mode: z.enum(["sea", "air", "road", "not-sure"]),
  cargoType: z.string().trim().min(2, "What are you shipping?").max(120),
  message: z.string().trim().max(1500).optional().default(""),
});

type FormValues = z.input<typeof schema>;

const MODES: { value: InquiryInput["mode"]; label: string }[] = [
  { value: "not-sure", label: "Not sure yet" },
  { value: "sea", label: "Sea freight" },
  { value: "air", label: "Air freight" },
];

function buildWhatsappMessage(v: z.output<typeof schema>) {
  return [
    "Assalam o Alaikum, I'd like a shipping quote.",
    `Name: ${v.name}`,
    `Phone: ${v.phone}`,
    v.email ? `Email: ${v.email}` : null,
    `Delivery city: ${v.city}`,
    `Shipping mode: ${MODES.find((m) => m.value === v.mode)?.label ?? v.mode}`,
    `Goods: ${v.cargoType}`,
    v.message ? `Details: ${v.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Quote / contact form.
 * - Backend connected: the inquiry is saved and appears in the admin inbox.
 * - Not connected yet: the same validated details open in WhatsApp, so the form always works.
 */
export function InquiryForm() {
  const { whatsappWith } = useContactLinks();
  const { data: offices } = useOffices();
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mode: "not-sure", email: "", message: "" },
  });

  const onSubmit = handleSubmit(async (raw, event) => {
    const values = schema.parse(raw);
    setServerError(null);

    if (!isApiEnabled) {
      const href = whatsappWith(buildWhatsappMessage(values));
      if (href) window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await inquiryApi.submit({ ...values, email: values.email || undefined, website: trapValue(event) });
      setStatus("sent");
      reset();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "We couldn't send your message. Please try WhatsApp instead.");
    }
  });

  if (status === "sent") {
    const wa = whatsappWith("Assalam o Alaikum, I just sent a quote request on your website.");
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
        className="flex flex-col items-center rounded-lg border border-line bg-white px-6 py-14 text-center"
      >
        <CheckCircle2 className="size-12 text-green-600" aria-hidden />
        <h3 className="mt-4 text-2xl font-extrabold">Thank you — we've got your request</h3>
        <p className="mt-2 max-w-md text-slate-600">Our team will contact you shortly. For a faster reply, message us on WhatsApp.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {wa && (
            <ButtonLink href={wa} variant="navy">
              <MessageCircle className="size-4.5" aria-hidden /> WhatsApp us
            </ButtonLink>
          )}
          <Button variant="outline" onClick={() => setStatus("idle")}>
            Send another request
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
      {/* Spam trap: invisible to people and screen readers; bots that fill every field get filtered out. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" error={errors.name?.message} required>
          <input {...fieldProps(register("name"), !!errors.name)} autoComplete="name" />
        </Field>
        <Field id="phone" label="Phone / WhatsApp" error={errors.phone?.message} required>
          <input {...fieldProps(register("phone"), !!errors.phone)} type="tel" inputMode="tel" autoComplete="tel" placeholder="03xx xxxxxxx" />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message} hint="Optional">
          <input {...fieldProps(register("email"), !!errors.email)} type="email" autoComplete="email" />
        </Field>
        <Field id="city" label="Delivery city" error={errors.city?.message} required>
          <input {...fieldProps(register("city"), !!errors.city)} list="city-options" autoComplete="address-level2" />
          <datalist id="city-options">
            {offices?.map((o) => <option key={o.id} value={o.city} />)}
          </datalist>
        </Field>
        <Field id="mode" label="Shipping mode" error={errors.mode?.message}>
          <select {...fieldProps(register("mode"), !!errors.mode)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="cargoType" label="What are you shipping?" error={errors.cargoType?.message} required>
          <input {...fieldProps(register("cargoType"), !!errors.cargoType)} placeholder="e.g. mobile accessories, 200 kg" />
        </Field>
        <Field id="message" label="Details" error={errors.message?.message} hint="Optional" className="sm:col-span-2">
          <textarea
            {...fieldProps(register("message"), !!errors.message)}
            rows={4}
            placeholder="Supplier city in China, approximate weight or cartons, when you need it…"
            className={cn(inputClass(!!errors.message), "h-auto py-3")}
          />
        </Field>
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="mt-5 rounded-lg bg-signal-500/10 px-4 py-3 text-sm font-medium text-signal-600"
          >
            {serverError}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {isApiEnabled
            ? "We'll only use your details to reply to this request."
            : "Your request opens in WhatsApp, ready to send to our team."}
        </p>
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-48">
          {isSubmitting ? (
            <Loader2 className="size-4.5 animate-spin" aria-hidden />
          ) : isApiEnabled ? (
            <Send className="size-4.5" aria-hidden />
          ) : (
            <MessageCircle className="size-4.5" aria-hidden />
          )}
          {isApiEnabled ? "Send request" : "Send via WhatsApp"}
        </Button>
      </div>
    </form>
  );
}
