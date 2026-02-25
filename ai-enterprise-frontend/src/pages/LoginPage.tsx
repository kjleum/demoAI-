// path: src/pages/LoginPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginEmail, loginTelegram, getMe } from "@/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getTelegram } from "@/shared/lib/telegram/getTelegram";

export function LoginPage(): React.ReactElement {
  const nav = useNavigate();
  const tg = getTelegram();

  const setMode = useAuthStore((s) => s.setMode);
  const setMe = useAuthStore((s) => s.setMe);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canTg = useMemo(() => !!tg?.initData && !!tg?.initDataUnsafe?.user, [tg]);

  const enterGuest = () => {
    setMe(null);
    setMode("guest");
    nav("/chat");
  };

  const doEmail = async () => {
    setBusy(true);
    setErr(null);
    try {
      await loginEmail(email.trim(), password);
      const me = await getMe();
      setMe(me);
      setMode("user");
      nav("/chat");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doTelegram = async () => {
    if (!tg?.initData) return;
    setBusy(true);
    setErr(null);
    try {
      await loginTelegram(tg.initData);
      const me = await getMe();
      setMe(me);
      setMode("user");
      nav("/chat");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ fontWeight: 950, fontSize: 18 }}>Login</div>
        <div className="muted" style={{ marginTop: 6 }}>
          HttpOnly cookies • no localStorage tokens
        </div>

        <div className="hr" />

        <div className="col">
          <label className="muted" style={{ fontSize: 12 }}>
            Email
          </label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label className="muted" style={{ fontSize: 12 }}>
            Password
          </label>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />

          {err ? (
            <div className="badge err" role="alert">
              {err}
            </div>
          ) : null}

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn primary" onClick={doEmail} disabled={busy || !email.trim() || !password}>
              Email login
            </button>

            <button className="btn" onClick={enterGuest} disabled={busy}>
              Continue as Guest
            </button>

            <button className="btn" onClick={doTelegram} disabled={busy || !canTg}>
              Telegram login
            </button>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            Telegram login доступен только внутри Telegram Mini App (tg.initData).
          </div>
        </div>
      </div>
    </div>
  );
}
