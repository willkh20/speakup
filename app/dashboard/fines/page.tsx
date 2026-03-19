"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CARD, SECTION_LABEL, GRADIENT_TEXT } from "@/lib/styles";
import { FINE_PER_MISS, displayName } from "@/lib/types";
import type { UserProfile, Fine } from "@/lib/types";

const PALETTE = [
  "#f87171", "#fb923c", "#fbbf24", "#4ade80",
  "#34d399", "#38bdf8", "#818cf8", "#e879f9",
  "#f472b6", "#94a3b8",
];

function Avatar({ user, size = 32 }: { user: UserProfile; size?: number }) {
  return user.avatar_url ? (
    <img src={user.avatar_url} alt="" className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {displayName(user)[0].toUpperCase()}
    </div>
  );
}

interface MFine {
  user: UserProfile;
  totalMissed: number;
  totalAmount: number;
  unpaidAmount: number;
  fines: Fine[];
  color: string;
}

// ── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ data, total }: { data: MFine[]; total: number }) {
  const r = 68;
  const cx = 100, cy = 100;
  const circ = 2 * Math.PI * r;
  const active = data.filter(d => d.totalAmount > 0);

  if (!active.length || total === 0) {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="24" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#4b5563" fontSize="10">No fines yet</text>
      </svg>
    );
  }

  let accumulated = 0;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="24" />
      {active.map(d => {
        const dash = (d.totalAmount / total) * circ;
        const offset = accumulated;
        accumulated += dash;
        return (
          <circle key={d.user.id}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="24"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90, ${cx}, ${cy})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        );
      })}
      {/* Center label */}
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="bold">
        ₩{total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#4b5563" fontSize="9">
        total fines
      </text>
    </svg>
  );
}

// ── Olympic Podium ───────────────────────────────────────────────────────────
function Podium({ data }: { data: MFine[] }) {
  const ranked = data.filter(d => d.totalMissed > 0);
  if (ranked.length === 0) return null;

  // Column order: 2nd (left), 1st (center), 3rd (right)
  const slots = [ranked[1] ?? null, ranked[0] ?? null, ranked[2] ?? null];
  const heights  = [68, 104, 52];
  const medals   = ["🥈", "🥇", "🥉"];
  const rankText = ["2nd", "1st", "3rd"];
  const styles   = [
    { text: "#9ca3af", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.2)" },
    { text: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)" },
    { text: "#b97a3a", bg: "rgba(185,122,58,0.08)",  border: "rgba(185,122,58,0.2)"  },
  ];

  return (
    <div className="flex items-end justify-center gap-2 pt-6">
      {slots.map((d, col) => {
        const s = styles[col];
        return (
          <div key={col} className="flex flex-col items-center" style={{ width: "30%" }}>
            {d ? (
              <>
                {/* Above stand */}
                <div className="flex flex-col items-center gap-1 mb-2 px-1">
                  <span className="text-xl leading-none">{medals[col]}</span>
                  <div className="relative mt-0.5">
                    {col === 1 && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-base leading-none select-none">👑</span>
                    )}
                    <Avatar user={d.user} size={col === 1 ? 52 : 40} />
                  </div>
                  <p className="text-xs font-bold text-white text-center w-full truncate mt-0.5">
                    {displayName(d.user)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-white leading-none">{d.totalMissed}</span>
                    <span className="text-[10px]" style={{ color: "#6b7280" }}>miss</span>
                  </div>
                  <p className="text-xs font-bold text-red-400">₩{d.totalAmount.toLocaleString()}</p>
                </div>
                {/* Podium stand */}
                <div className="w-full rounded-t-2xl flex items-center justify-center"
                  style={{ height: heights[col], background: s.bg, border: `1px solid ${s.border}`, borderBottom: "none" }}>
                  <span className="text-sm font-black tracking-wide" style={{ color: s.text }}>{rankText[col]}</span>
                </div>
              </>
            ) : (
              <div className="w-full" style={{ height: heights[col] }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function FinesPage() {
  const [data,    setData]    = useState<MFine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: u }, { data: f }] = await Promise.all([
      supabase.from("users").select("*").order("created_at"),
      supabase.from("fines").select("*"),
    ]);
    const users = (u as UserProfile[]) ?? [];
    const fines = (f as Fine[]) ?? [];
    setData(
      users.map((u, i) => {
        const uf = fines.filter(x => x.user_id === u.id);
        return {
          user:         u,
          totalMissed:  uf.reduce((s, x) => s + x.missed_count, 0),
          totalAmount:  uf.reduce((s, x) => s + x.amount, 0),
          unpaidAmount: uf.filter(x => !x.paid).reduce((s, x) => s + x.amount, 0),
          fines:        uf,
          color:        PALETTE[i % PALETTE.length],
        };
      }).sort((a, b) => b.totalMissed - a.totalMissed)
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const grandTotal = data.reduce((s, d) => s + d.totalAmount, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8"
      style={{ animation: "fadeIn 0.5s ease-out" }}>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={GRADIENT_TEXT}>Fines</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Settled every Sunday midnight KST · ₩{FINE_PER_MISS.toLocaleString()} per missed session
        </p>
      </div>

      {/* Summary stats + Donut chart */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* Stats */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {[
            { label: "Total Accumulated", value: `₩${grandTotal.toLocaleString()}`,    color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.18)" },
            { label: "Total Members",     value: `${data.length} members`,             color: "#38bdf8", bg: "rgba(56,189,248,0.07)",   border: "rgba(56,189,248,0.18)"  },
            { label: "Fine per Miss",     value: `₩${FINE_PER_MISS.toLocaleString()}`, color: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.18)" },
          ].map(c => (
            <div key={c.label} className="rounded-2xl px-5 py-4"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#6b7280" }}>{c.label}</p>
              <p className="text-2xl font-bold" style={{ color: c.color, letterSpacing: "-0.03em" }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Donut chart */}
        <div className={`${CARD} p-6 md:col-span-3`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className={SECTION_LABEL}>Fine Distribution</span>
          </div>
          {loading ? (
            <div className="h-40 rounded-xl bg-gray-800/60 animate-pulse" />
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <DonutChart data={data} total={grandTotal} />
              </div>
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {data.filter(d => d.totalAmount > 0).map(d => {
                  const pct = grandTotal > 0 ? Math.round((d.totalAmount / grandTotal) * 100) : 0;
                  return (
                    <div key={d.user.id} className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-white/70 flex-1 truncate">{displayName(d.user)}</span>
                      <span className="text-xs font-bold" style={{ color: d.color }}>{pct}%</span>
                      <span className="text-xs font-semibold text-white/50 shrink-0">₩{d.totalAmount.toLocaleString()}</span>
                    </div>
                  );
                })}
                {data.every(d => d.totalAmount === 0) && (
                  <p className="text-sm" style={{ color: "#4b5563" }}>No fines accumulated yet 🎉</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Podium + Ranking */}
      <section className={`${CARD} overflow-hidden`}>
        {/* Podium */}
        {!loading && data.some(d => d.totalMissed > 0) && (
          <div className="px-6 pt-6 pb-0"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(248,113,113,0.05) 0%, transparent 70%)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className={SECTION_LABEL}>Hall of Shame</span>
            </div>
            <Podium data={data} />
          </div>
        )}

        {/* Divider + Ranking list */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className={SECTION_LABEL}>Fine Ranking</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-800/60 animate-pulse" />)}
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "#4b5563" }}>No members yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((d, i) => {
                const pct = grandTotal > 0 ? (d.totalAmount / grandTotal) * 100 : 0;
                const isFirst = i === 0 && d.totalMissed > 0;
                return (
                  <div key={d.user.id}
                    className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors
                      ${isFirst ? "border-amber-400/20 bg-amber-400/5" : "border-gray-800/50 bg-gray-800/20"}`}>
                    {/* Rank */}
                    <span className="text-xs font-bold w-5 text-center shrink-0"
                      style={{ color: isFirst ? "#f59e0b" : "#374151" }}>
                      #{i + 1}
                    </span>
                    {/* Color dot */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {/* Avatar */}
                    <Avatar user={d.user} size={30} />
                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName(d.user)}</p>
                      {d.totalAmount > 0 && (
                        <div className="h-1 rounded-full bg-gray-800/80 mt-1.5" style={{ maxWidth: 100 }}>
                          <div className="h-1 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: d.color }} />
                        </div>
                      )}
                    </div>
                    {/* Miss count */}
                    <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                      <span className="text-xl font-black text-white leading-none">{d.totalMissed}</span>
                      <span className="text-[9px]" style={{ color: "#4b5563" }}>missed</span>
                    </div>
                    {/* Amount */}
                    <div className="text-right shrink-0 min-w-[80px]">
                      <p className={`text-sm font-bold ${d.totalAmount > 0 ? "text-red-400" : "text-green-400"}`}>
                        {d.totalAmount > 0 ? `₩${d.totalAmount.toLocaleString()}` : "Clean ✓"}
                      </p>
                      {d.unpaidAmount > 0 && (
                        <p className="text-[10px] text-orange-400">Unpaid ₩{d.unpaidAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Weekly Breakdown */}
      {data.length > 0 && data.some(d => d.fines.length > 0) && (
        <section className={`${CARD} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className={SECTION_LABEL}>Weekly Breakdown</span>
          </div>
          <div className="flex flex-col gap-2">
            {data.filter(d => d.fines.length > 0)
              .flatMap(d => d.fines.map(f => ({ ...f, user: d.user, color: d.color })))
              .sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime())
              .map(f => (
                <div key={f.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-800/30 border border-gray-800/40 px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                  <Avatar user={f.user} size={22} />
                  <span className="text-sm text-white flex-1 truncate">{displayName(f.user)}</span>
                  <span className="text-xs shrink-0" style={{ color: "#6b7280" }}>
                    Week of {new Date(f.week_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[11px] shrink-0" style={{ color: "#4b5563" }}>{f.missed_count} missed</span>
                  <span className={`text-sm font-bold shrink-0 ${f.paid ? "text-green-400 line-through opacity-50" : "text-red-400"}`}>
                    ₩{f.amount.toLocaleString()}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0
                    ${f.paid
                      ? "text-green-400 border-green-400/20 bg-green-400/5"
                      : "text-orange-400 border-orange-400/20 bg-orange-400/5"}`}>
                    {f.paid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
