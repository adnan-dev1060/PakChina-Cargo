import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "../auth";
import { TextInput } from "../form/inputs";
import { FullPageSpinner, Spinner } from "../ui";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-950 px-4 py-12">
      <meta name="robots" content="noindex, nofollow" />
      <title>Admin sign in | Pak China Cargo</title>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/brand/logo.jpg" alt="Pak China Cargo" className="size-20 rounded-2xl bg-white object-contain p-1" />
          <h1 className="mt-5 text-2xl font-extrabold text-white">Admin dashboard</h1>
          <p className="mt-1 text-sm text-navy-200">Sign in to manage the website</p>
        </div>
        <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy-900">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <TextInput id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9" autoFocus />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-navy-900">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <TextInput id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10 pl-9" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-navy-700">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-signal-500/10 px-3 py-2 text-sm font-medium text-signal-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Spinner className="size-4 text-navy-950" />} Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-navy-300">
          <a href="/" className="hover:text-white">← Back to website</a>
        </p>
      </div>
    </div>
  );
}
