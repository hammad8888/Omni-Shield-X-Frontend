import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">OmniShield X</p>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500">
          Optional on this PC. Default lab account is <span className="font-mono">admin</span> / <span className="font-mono">ChangeMe_Admin_123!</span>
        </p>
        <label className="block text-xs font-bold text-slate-700">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-xs font-bold text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60" type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" onClick={() => navigate("/")} className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800">
          Open live console without signing in
        </button>
      </form>
    </div>
  );
}
