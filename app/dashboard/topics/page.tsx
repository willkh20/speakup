"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { CARD, SECTION_LABEL, GRADIENT_TEXT, DIFF_COLOR, DIFF_EN, ACCENT } from "@/lib/styles";
import { todayKST } from "@/lib/date";
import type { Topic } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return {
      dateStr: localDateStr(d),
      day: i + 1,
      weekday: WEEKDAYS[d.getDay()],
      isSat: d.getDay() === 6,
      isSun: d.getDay() === 0,
    };
  });
}

export default function TopicsPage() {
  const { user } = useAuth();
  const today = todayKST();
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);

  const [topics,     setTopics]     = useState<Topic[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [titleEn,    setTitleEn]    = useState("");
  const [titleKo,    setTitleKo]    = useState("");
  const [diff,       setDiff]       = useState<"easy"|"medium"|"hard">("medium");
  const [targetDate, setTargetDate] = useState(today);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  // Month navigator
  const [calYear,  setCalYear]  = useState(nowKST.getFullYear());
  const [calMonth, setCalMonth] = useState(nowKST.getMonth());

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("topics").select("*")
      .eq("is_custom", true)
      .order("active_date", { ascending: true });
    setTopics((data as Topic[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const openAddForm = (date = today) => {
    setEditingId(null);
    setTitleEn(""); setTitleKo(""); setDiff("medium"); setTargetDate(date);
    setFormError(null); setShowForm(true);
  };

  const openEditForm = (t: Topic) => {
    setEditingId(t.id);
    setTitleEn(t.title_en ?? "");
    setTitleKo(t.title_ko !== t.title_en ? (t.title_ko ?? "") : "");
    setDiff(t.difficulty);
    setTargetDate(t.active_date ?? today);
    setFormError(null); setShowForm(true);
  };

  const saveTopic = async () => {
    if (!titleEn.trim() || !user) return;
    setSaving(true);
    setFormError(null);

    if (editingId) {
      // Update existing
      const { error } = await supabase.from("topics").update({
        title_en: titleEn.trim(),
        title_ko: titleKo.trim() || titleEn.trim(),
        difficulty: diff,
        active_date: targetDate,
      }).eq("id", editingId);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      // Check for existing topic on this date
      if (topicByDate[targetDate]) {
        setFormError(`A topic is already registered for ${new Date(targetDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Please choose a different date.`);
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("topics").insert({
        title_en: titleEn.trim(),
        title_ko: titleKo.trim() || titleEn.trim(),
        difficulty: diff,
        is_custom: true,
        created_by: user.id,
        active_date: targetDate,
      });
      if (error) { setFormError(error.message); setSaving(false); return; }
    }

    setShowForm(false); setSaving(false); setEditingId(null);
    fetchTopics();
  };

  const deleteTopic = async () => {
    if (!deleteTarget) return;
    await supabase.from("topics").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchTopics();
  };

  const topicByDate: Record<string, Topic> = {};
  topics.filter(t => t.active_date).forEach(t => { topicByDate[t.active_date!] = t; });

  const activeTopic = topicByDate[today] ?? null;

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = getDaysInMonth(calYear, calMonth);
  const topicsThisMonth = days.filter(d => topicByDate[d.dateStr]).length;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8"
      style={{ animation: "fadeIn 0.5s ease-out" }}>

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={GRADIENT_TEXT}>Topics</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Assign topics by date — or let the OPIc bank pick one randomly</p>
        </div>
        <button type="button" onClick={() => openAddForm()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shrink-0">
          + Add Topic
        </button>
      </div>

      {/* ── Today's Topic ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-violet-400/20 bg-violet-400/5 backdrop-blur-sm p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 20% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
          aria-hidden="true" />
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#a78bfa" }}>Today&apos;s Topic</span>
        </div>
        {loading ? (
          <div className="space-y-3">
            <div className="h-12 w-2/3 rounded-xl bg-gray-800/60 animate-pulse" />
            <div className="h-4 w-1/3 rounded-lg bg-gray-800/40 animate-pulse" />
          </div>
        ) : activeTopic ? (
          <>
            <p className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
              {activeTopic.title_en ?? activeTopic.title_ko}
            </p>
            {activeTopic.title_ko && activeTopic.title_ko !== activeTopic.title_en && (
              <p className="text-base italic mb-4" style={{ color: "#9ca3af" }}>&ldquo;{activeTopic.title_ko}&rdquo;</p>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${DIFF_COLOR[activeTopic.difficulty]}`}>
              {DIFF_EN[activeTopic.difficulty]}
            </span>
          </>
        ) : (
          <p className="text-lg text-white/30 italic">
            No topic set — a random OPIc topic will apply today.
          </p>
        )}
      </section>

      {/* ── Add Topic Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ animation: "fadeIn 0.15s ease-out" }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowForm(false); setFormError(null); }} />
          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-6 flex flex-col gap-4"
            style={{ animation: "slideDown 0.2s ease-out" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{editingId ? "Edit Topic" : "Add New Topic"}</h3>
              <button type="button" onClick={() => { setShowForm(false); setFormError(null); }}
                className="text-gray-600 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <input type="text" placeholder="Topic (English) *" value={titleEn} onChange={e => setTitleEn(e.target.value)}
              autoFocus
              className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors" />
            <input type="text" placeholder="Topic (Korean, optional)" value={titleKo} onChange={e => setTitleKo(e.target.value)}
              className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors" />
            <div className="flex gap-2">
              {(["easy","medium","hard"] as const).map(d => (
                <button key={d} type="button" onClick={() => setDiff(d)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all
                    ${diff === d ? DIFF_COLOR[d] : "text-gray-600 border-gray-800/60 hover:border-gray-700"}`}>
                  {DIFF_EN[d]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs shrink-0" style={{ color: "#4b5563" }}>Apply Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors" />
            </div>
            {formError && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{formError}</p>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => { setShowForm(false); setFormError(null); }}
                className="px-4 py-2 rounded-xl text-sm border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all">Cancel</button>
              <button type="button" onClick={saveTopic} disabled={saving || !titleEn.trim()}
                className="px-6 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 active:scale-95 disabled:opacity-40 transition-all">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ animation: "fadeIn 0.15s ease-out" }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-6 flex flex-col gap-5"
            style={{ animation: "slideDown 0.2s ease-out" }}>
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            {/* Text */}
            <div className="text-center">
              <p className="text-base font-bold text-white mb-1">Delete Topic?</p>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                <span className="text-white/70 font-medium">&ldquo;{deleteTarget.title_en ?? deleteTarget.title_ko}&rdquo;</span>
                {deleteTarget.active_date && (
                  <> on {new Date(deleteTarget.active_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                )}
                {" "}will be permanently removed.
              </p>
            </div>
            {/* Buttons */}
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                Cancel
              </button>
              <button type="button" onClick={deleteTopic}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/90 hover:bg-red-500 text-white active:scale-95 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Topic Schedule ──────────────────────────────────────────── */}
      <section className={`${CARD} p-6`}>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
            <span className={SECTION_LABEL}>Topic Schedule</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={prevMonth}
              className="w-8 h-8 rounded-lg border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <span className="text-sm font-semibold text-white w-40 text-center">{monthLabel}</span>
            <button type="button" onClick={nextMonth}
              className="w-8 h-8 rounded-lg border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-700/60 text-gray-500">
            {topicsThisMonth} / {days.length} days
          </span>
        </div>

        {/* Day list */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i =>
            <div key={i} className="h-12 rounded-xl bg-gray-800/60 animate-pulse" />
          )}</div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-800/50">
            {days.map(({ dateStr, day, weekday, isSat, isSun }) => {
              const t = topicByDate[dateStr];
              const isToday = dateStr === today;
              const isPast  = dateStr < today;

              return (
                <div key={dateStr}
                  className={`flex items-center gap-4 py-2.5 px-2 rounded-lg transition-colors
                    ${isToday ? "bg-violet-400/5" : ""}`}>

                  {/* Date column */}
                  <div className="flex items-center gap-2 w-20 shrink-0">
                    <span className={`text-lg font-bold tabular-nums w-7 text-right
                      ${isToday ? "text-violet-300" : isSat ? "text-blue-400/60" : isSun ? "text-red-400/60" : isPast ? "text-gray-700" : "text-gray-400"}`}>
                      {day}
                    </span>
                    <span className={`text-[11px] font-semibold
                      ${isToday ? "text-violet-400" : isSat ? "text-blue-400/50" : isSun ? "text-red-400/50" : "text-gray-700"}`}>
                      {weekday}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1 py-0.5 rounded">
                        today
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-800/80 shrink-0" />

                  {/* Topic column */}
                  {t ? (
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isPast && !isToday ? "text-gray-500" : "text-white"}`}>
                          {t.title_en ?? t.title_ko}
                        </p>
                        {t.title_ko && t.title_ko !== t.title_en && (
                          <p className="text-[11px] truncate mt-0.5 italic" style={{ color: "#4b5563" }}>{t.title_ko}</p>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[t.difficulty]}`}>
                        {DIFF_EN[t.difficulty]}
                      </span>
                      {/* Edit button */}
                      <button type="button" onClick={() => openEditForm(t)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800/60 text-gray-600 hover:text-violet-300 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button type="button" onClick={() => setDeleteTarget(t)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800/60 text-gray-600 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/5 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    isPast && !isToday ? (
                      <span className="flex-1 text-xs" style={{ color: "#1f2937" }}>—</span>
                    ) : (
                      <button type="button"
                        onClick={() => openAddForm(dateStr)}
                        className="flex-1 text-left group/add flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-100">
                        <span className="text-xs text-gray-700 group-hover/add:text-gray-400 transition-colors">No topic</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-800/60 text-gray-700 group-hover/add:border-violet-500/40 group-hover/add:text-violet-400 group-hover/add:bg-violet-500/5 transition-all">
                          + add
                        </span>
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
