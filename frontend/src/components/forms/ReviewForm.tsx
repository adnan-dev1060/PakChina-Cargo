import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ApiError, testimonialApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Field } from "./fields";
import { fieldProps, inputClass, trapValue } from "./fieldUtils";

const schema = z.object({
  rating: z.number({ error: "Choose a star rating" }).int().min(1, "Choose a star rating").max(5),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  company: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  quote: z.string().trim().min(20, "Please write at least a sentence or two").max(1000, "Please keep it under 1,000 characters"),
  contact: z.string().trim().max(160).optional(),
});

type FormValues = z.input<typeof schema>;
const ID = "review-";
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * "Share your experience" form. Reviews are saved as waiting for approval and only appear on the
 * website once an admin approves them in Admin → Testimonials.
 */
export function ReviewForm({ onDone }: { onDone?: () => void }) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rating: 0 } });

  const onSubmit = handleSubmit(async (raw, event) => {
    const v = schema.parse(raw);
    setServerError(null);
    try {
      await testimonialApi.submit({
        ...v,
        company: v.company || undefined,
        city: v.city || undefined,
        contact: v.contact || undefined,
        website: trapValue(event),
      });
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "We couldn't send your review. Please try again.");
    }
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center rounded-lg border border-line bg-white px-6 py-12 text-center">
        <CheckCircle2 className="size-11 text-green-600" aria-hidden />
        <h3 className="mt-4 text-xl font-extrabold text-navy-900">Thank you for your review</h3>
        <p className="mt-2 max-w-md text-sm text-slate-600">Our team will check it, and it will appear on the website once approved.</p>
        {onDone && (
          <Button variant="outline" className="mt-6" onClick={onDone}>
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-line bg-white p-6 text-left sm:p-8">
      {/* Spam trap: invisible to people and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`${ID}website`}>Leave this field empty</label>
        <input id={`${ID}website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy-900">
          Your rating <span className="text-signal-500" aria-hidden>*</span>
        </legend>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <div role="radiogroup" aria-label="Rating" className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={field.value === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => field.onChange(n)}
                    className="rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-navy-500"
                  >
                    <Star className={cn("size-7 transition-colors", n <= (field.value ?? 0) ? "fill-gold-500 text-gold-500" : "text-slate-300 hover:text-gold-400")} />
                  </button>
                ))}
              </div>
              <span className="text-sm text-slate-500">{RATING_WORDS[field.value ?? 0]}</span>
            </div>
          )}
        />
        {errors.rating && <p className="mt-1 text-xs font-medium text-signal-600">{errors.rating.message}</p>}
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id={`${ID}name`} label="Your name" error={errors.name?.message} required>
          <input {...fieldProps(register("name"), !!errors.name, ID)} autoComplete="name" />
        </Field>
        <Field id={`${ID}city`} label="City" error={errors.city?.message} hint="Optional">
          <input {...fieldProps(register("city"), !!errors.city, ID)} autoComplete="address-level2" />
        </Field>
        <Field id={`${ID}company`} label="Business name" error={errors.company?.message} hint="Optional">
          <input {...fieldProps(register("company"), !!errors.company, ID)} autoComplete="organization" />
        </Field>
        <Field id={`${ID}contact`} label="Phone or email" error={errors.contact?.message} hint="Not shown publicly">
          <input {...fieldProps(register("contact"), !!errors.contact, ID)} autoComplete="tel" />
        </Field>
        <Field id={`${ID}quote`} label="Your experience" error={errors.quote?.message} required className="sm:col-span-2">
          <textarea
            {...fieldProps(register("quote"), !!errors.quote, ID)}
            rows={4}
            placeholder="What did you ship, and how did it go?"
            className={cn(inputClass(!!errors.quote), "h-auto py-3")}
          />
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="mt-5 rounded-lg bg-signal-500/10 px-4 py-3 text-sm font-medium text-signal-600">
          {serverError}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">Reviews appear on the website after our team approves them.</p>
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-44">
          {isSubmitting ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : <Send className="size-4.5" aria-hidden />}
          Send review
        </Button>
      </div>
    </form>
  );
}
