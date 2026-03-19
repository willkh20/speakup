"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { CARD, SECTION_LABEL, GRADIENT_TEXT, ACCENT } from "@/lib/styles";
import { weekStartKST } from "@/lib/date";
import { displayName, FINE_PER_MISS } from "@/lib/types";
import type { UserProfile, Fine } from "@/lib/types";

function Avatar({ user, size = 40 }: { user: UserProfile; size?: number }) {
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

interface MStats { user: UserProfile; weekCount: number; totalCount: number; totalFine: number; }

export default function MembersPage() {
  const { user: me }      = useAuth();
  const [stats, setStats]  = useState<MStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const weekStart = weekStartKST();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: u }, { data: v }, { data: f }] = await Promise.all([
      supabase.from("users").select("*").order("created_at"),
      supabase.from("videos").select("user_id, recorded_date"),
      supabase.from("fines").select("*"),
    ]);
    const users = (u as UserProfile[]) ?? [];
    const vids  = (v as { user_id: string; recorded_date: string }[]) ?? [];
    const fines = (f as Fine[]) ?? [];
    setStats(users.map(u => ({
      user:       u,
      weekCount:  vids.filter(x => x.user_id === u.id && x.recorded_date >= weekStart).length,
      totalCount: vids.filter(x => x.user_id === u.id).length,
      totalFine:  fines.filter(x => x.user_id === u.id).reduce((s, x) => s + x.amount, 0),
    })));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (me && !selected) setSelected(me.id); }, [me, selected]);

  const sel = stats.find(s => s.user.id === selected);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 flex flex-col gap-6 md:gap-8"
      style={{ animation: "fadeIn 0.5s ease-out" }}>

      <div>
        <h1 className="text-3xl font-bold" style={GRADIENT_TEXT}>Members</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Check group members&apos; participation status</p>
      </div>

      {/* Member selector */}
      <section className={`${CARD} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className={SECTION_LABEL}>Select Member</span>
        </div>
        {loading ? (
          <div className="flex gap-3">{[1,2,3].map(i =>
            <div key={i} className="w-20 h-24 rounded-2xl bg-gray-800/60 animate-pulse" />
          )}</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map(s => (
              <button key={s.user.id} type="button" onClick={() => setSelected(s.user.id)}
                className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border transition-all hover:scale-105 active:scale-95
                  ${selected === s.user.id
                    ? "border-white/20 bg-white/5"
                    : "border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-800/40 bg-gray-900/30"}`}>
                <Avatar user={s.user} size={52} />
                <span className="text-sm text-white/80 w-full text-center truncate font-medium">
                  {displayName(s.user)}
                </span>
                {s.user.id === me?.id && (
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded-full border border-purple-400/20">Me</span>
                )}
              </button>
            ))}
            {stats.length === 0 && <p className="text-sm" style={{ color: "#4b5563" }}>No members yet</p>}
          </div>
        )}
      </section>

      {/* Detail */}
      {sel && (
        <section className={`${CARD} p-6`}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar user={sel.user} size={56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{displayName(sel.user)}</h2>
                {sel.user.id === me?.id && (
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">My Profile</span>
                )}
              </div>
              {sel.user.nickname && (
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{sel.user.full_name}</p>
              )}
              {sel.user.goal && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#4b5563" }}>Goal</span>
                  <span className="text-xs text-white/70 italic">&quot;{sel.user.goal}&quot;</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "This Week",     value: `${sel.weekCount}` },
              { label: "Weekly Goal",   value: `${sel.weekCount}/${sel.user.weekly_goal}` },
              { label: "Total Uploads", value: `${sel.totalCount}` },
              { label: "Total Fines",   value: `₩${sel.totalFine.toLocaleString()}`, red: sel.totalFine > 0 },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-800/60 bg-gray-800/30 px-4 py-3">
                <p className={`${SECTION_LABEL} mb-1`}>{c.label}</p>
                <p className={`text-2xl font-bold ${c.red ? "text-red-400" : "text-white"}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Weekly progress */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: "#4b5563" }}>Weekly Progress</span>
            <span className="text-xs font-bold text-white">
              {sel.weekCount}/{sel.user.weekly_goal}&nbsp;
              <span style={{ color: "#4b5563" }}>
                ({Math.min(100, Math.round(sel.weekCount / sel.user.weekly_goal * 100))}%)
              </span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800/80">
            <div className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, sel.weekCount / sel.user.weekly_goal * 100)}%`,
                background: sel.weekCount >= sel.user.weekly_goal ? "#4ade80"
                  : sel.weekCount / sel.user.weekly_goal >= 0.6 ? ACCENT : "#f87171",
              }} />
          </div>
          <p className="text-[11px] mt-1.5 text-right" style={{ color: "#374151" }}>
            Target: {sel.user.weekly_goal} recording{sel.user.weekly_goal !== 1 ? "s" : ""} / week
          </p>
        </section>
      )}

      {/* All comparison */}
      <section className={`${CARD} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className={SECTION_LABEL}>Overall Comparison</span>
        </div>
        <div className="flex flex-col gap-2">
          {[...stats]
            .sort((a, b) => (b.weekCount / b.user.weekly_goal) - (a.weekCount / a.user.weekly_goal))
            .map((s, i) => {
              const pct = Math.min(100, Math.round(s.weekCount / s.user.weekly_goal * 100));
              return (
                <div key={s.user.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors
                    ${s.user.id === me?.id ? "border-white/10 bg-white/3" : "border-gray-800/40 bg-gray-800/20"}`}>
                  <span className="text-xs w-5 text-center" style={{ color: "#4b5563" }}>#{i + 1}</span>
                  <Avatar user={s.user} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{displayName(s.user)}</p>
                    {s.user.goal && (
                      <p className="text-[10px] truncate italic" style={{ color: "#4b5563" }}>{s.user.goal}</p>
                    )}
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-gray-800 shrink-0">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "#4ade80" : pct >= 60 ? ACCENT : "#f87171" }} />
                  </div>
                  <span className="text-xs font-bold text-white w-10 text-right shrink-0">
                    {s.weekCount}/{s.user.weekly_goal}
                  </span>
                  {s.totalFine > 0 && (
                    <span className="text-xs text-red-400 shrink-0">₩{s.totalFine.toLocaleString()}</span>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
