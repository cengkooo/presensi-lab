"use client";

import { useState } from "react";
import {
  Shield, Bell, MapPin, Users, Database, Save,
  Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Globe, Lock, Sliders,
} from "lucide-react";

/* ── SECTION WRAPPER ── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl" style={{ padding: "22px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── TOGGLE ── */
function Toggle({ enabled, onChange, label, desc }: { enabled: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ flex: 1, marginRight: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{label}</p>
        {desc && <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.4)", marginTop: "2px" }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: 44, height: 24, borderRadius: "12px", border: "none", cursor: "pointer",
          position: "relative", flexShrink: 0, transition: "background 0.25s",
          background: enabled ? "linear-gradient(135deg, #059669, #10B981)" : "rgba(255,255,255,0.1)",
        }}
      >
        <div style={{
          position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
          transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          left: enabled ? "23px" : "3px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </button>
    </div>
  );
}

/* ── MAIN ── */
export default function SettingsPage() {
  // Geolocation
  const [defaultRadius, setDefaultRadius] = useState(100);
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [requireGps, setRequireGps] = useState(true);
  const [allowOverride, setAllowOverride] = useState(true);
  const [gpsTimeout, setGpsTimeout] = useState(10);

  // Auth / Whitelist
  const [allowedEmails, setAllowedEmails] = useState("budi.s@stmik.ac.id\nalex.r@stmik.ac.id");
  const [allowedDomain, setAllowedDomain] = useState("stmik.ac.id");
  const [domainOnly, setDomainOnly] = useState(false);

  // Notifications
  const [notifWarning, setNotifWarning] = useState(true);
  const [notifCheckin, setNotifCheckin] = useState(false);
  const [warningMinutes, setWarningMinutes] = useState(5);

  // Rate limit
  const [rateLimit, setRateLimit] = useState(3);

  // Secret reveal
  const [showSecret, setShowSecret] = useState(false);

  // Save state
  const [saved, setSaved] = useState(false);
  const handleSave = async () => {
    setSaved(false);
    await new Promise((r) => setTimeout(r, 700));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#f0fdf4", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Settings</h1>
          <p style={{ color: "rgba(110,231,183,0.5)", fontSize: "14px", marginTop: "6px" }}>Konfigurasi sistem absensi PresensLab</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary rounded-xl"
          style={{ gap: "8px", padding: "10px 20px", flexShrink: 0 }}
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? "Tersimpan!" : "Simpan Perubahan"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="settings-grid">
        {/* ── KOLOM KIRI ── */}
        <div>
          {/* Geolocation */}
          <Section title="Geolocation & GPS" icon={<MapPin size={16} style={{ color: "#34D399" }} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                    Radius Default (meter)
                  </label>
                  <input type="number" className="input-glass" min={10} max={500} value={defaultRadius} onChange={(e) => setDefaultRadius(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                    Durasi Default (menit)
                  </label>
                  <input type="number" className="input-glass" min={5} max={180} value={defaultDuration} onChange={(e) => setDefaultDuration(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                  GPS Timeout (detik)
                </label>
                <input type="number" className="input-glass" min={3} max={30} value={gpsTimeout} onChange={(e) => setGpsTimeout(Number(e.target.value))} />
              </div>
              <Toggle enabled={requireGps} onChange={setRequireGps} label="Wajibkan GPS" desc="Mahasiswa harus aktifkan GPS untuk check-in" />
              <Toggle enabled={allowOverride} onChange={setAllowOverride} label="Izinkan Override Dosen" desc="Dosen bisa menambah absen manual jika GPS gagal" />
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifikasi" icon={<Bell size={16} style={{ color: "#34D399" }} />}>
            <Toggle enabled={notifWarning} onChange={setNotifWarning} label="Peringatan Sesi Hampir Habis" desc={`Alert ${warningMinutes} menit sebelum sesi berakhir`} />
            <div style={{ paddingLeft: "8px", paddingTop: "8px", paddingBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>Menit sebelum habis</label>
              <input type="number" className="input-glass" min={1} max={30} value={warningMinutes} onChange={(e) => setWarningMinutes(Number(e.target.value))} disabled={!notifWarning} style={{ opacity: notifWarning ? 1 : 0.4 }} />
            </div>
            <Toggle enabled={notifCheckin} onChange={setNotifCheckin} label="Notifikasi Setiap Check-in" desc="Alert browser tiap ada mahasiswa check-in" />
          </Section>

          {/* Rate Limiting */}
          <Section title="Rate Limiting" icon={<Sliders size={16} style={{ color: "#34D399" }} />}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                Maks. request per user per menit
              </label>
              <input type="number" className="input-glass" min={1} max={10} value={rateLimit} onChange={(e) => setRateLimit(Number(e.target.value))} />
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <AlertTriangle size={14} style={{ color: "#facc15", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "11px", color: "rgba(234,179,8,0.8)", lineHeight: 1.5 }}>
                  Nilai terlalu rendah bisa memblokir mahasiswa dengan koneksi lambat. Rekomendasi: 3 request/menit.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* ── KOLOM KANAN ── */}
        <div>
          {/* Authentication */}
          <Section title="Autentikasi & Whitelist" icon={<Shield size={16} style={{ color: "#34D399" }} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                  Domain Email yang Diizinkan
                </label>
                <div style={{ position: "relative" }}>
                  <Globe size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(110,231,183,0.3)" }} />
                  <input className="input-glass" style={{ paddingLeft: 34 }} placeholder="stmik.ac.id" value={allowedDomain} onChange={(e) => setAllowedDomain(e.target.value)} />
                </div>
              </div>
              <Toggle enabled={domainOnly} onChange={setDomainOnly} label="Mode Domain Only" desc="Izinkan semua email dengan domain di atas (tanpa whitelist individual)" />
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>
                  Whitelist Email (satu per baris)
                </label>
                <textarea
                  className="input-glass"
                  rows={6}
                  style={{ resize: "vertical", lineHeight: 1.7, opacity: domainOnly ? 0.4 : 1 }}
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  disabled={domainOnly}
                  placeholder="user@stmik.ac.id"
                />
                <p style={{ fontSize: "11px", color: "rgba(110,231,183,0.3)", marginTop: "6px" }}>
                  {allowedEmails.split("\n").filter((e) => e.trim()).length} email terdaftar
                </p>
              </div>
            </div>
          </Section>

          {/* Database / System */}
          <Section title="Sistem & Database" icon={<Database size={16} style={{ color: "#34D399" }} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>Supabase Project URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="input-glass" defaultValue="https://xxxx.supabase.co" readOnly style={{ flex: 1, opacity: 0.6, fontSize: "12px" }} />
                  <button style={{ padding: "8px 10px", borderRadius: "9px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", cursor: "pointer" }}>
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(110,231,183,0.5)", marginBottom: "6px" }}>NEXTAUTH_SECRET</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="input-glass" type={showSecret ? "text" : "password"} defaultValue="randomly_generated_secret_here" readOnly style={{ flex: 1, opacity: 0.6, fontSize: "12px" }} />
                  <button onClick={() => setShowSecret(!showSecret)} style={{ padding: "8px 10px", borderRadius: "9px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", cursor: "pointer" }}>
                    {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginTop: "4px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={13} style={{ color: "#f87171" }} /> Zona Berbahaya
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button style={{ padding: "9px 14px", borderRadius: "9px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                    Hapus Semua Data Absensi
                  </button>
                  <button style={{ padding: "9px 14px", borderRadius: "9px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                    Reset Database ke Default
                  </button>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
