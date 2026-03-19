"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CARD, SECTION_LABEL, GRADIENT_TEXT, GRADIENT_ACCENT, PILL, ACCENT, DIFF_COLOR, DIFF_EN } from "@/lib/styles";
import { todayKST, weekStartKST, weekDaysKST } from "@/lib/date";
import { displayName } from "@/lib/types";
import type { Topic, UserProfile, Video } from "@/lib/types";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Countdown ─────────────────────────────────────────────────────────────
function Countdown() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const calc = () => {
      const now = new Date(), next = new Date(now);
      next.setHours(24, 0, 0, 0);
      setSecs(Math.floor((next.getTime() - now.getTime()) / 1000));
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return <span className="font-mono font-bold text-3xl" style={GRADIENT_ACCENT}>{h}:{m}:{s}</span>;
}

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28 }: { user: UserProfile; size?: number }) {
  return user.avatar_url ? (
    <img src={user.avatar_url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}>
      {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
    </div>
  );
}


// ── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router   = useRouter();
  const today    = todayKST();
  const weekDays = weekDaysKST();

  const [topic,    setTopic]   = useState<Topic | null>(null);
  const [members,  setMembers] = useState<UserProfile[]>([]);
  const [videos,   setVideos]  = useState<Video[]>([]);
  const [loading,  setLoading] = useState(true);
  const [todayUrls, setTodayUrls] = useState<Record<string, string>>({});

  // Audio player popup
  const [playingVid, setPlayingVid] = useState<Video | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime,    setAudioTime]    = useState(0);
  const [audioDur,     setAudioDur]     = useState(0);

  const fetchTopic = useCallback(async () => {
    const { data: custom } = await supabase.from("topics").select("*")
      .eq("active_date", today).eq("is_custom", true).limit(1).single();
    if (custom) { setTopic(custom as Topic); return; }
    const { data: all } = await supabase.from("topics").select("*").eq("is_custom", false);
    if (all?.length) {
      const seed = new Date().getFullYear() * 1000 +
        Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      setTopic((all as Topic[])[seed % all.length]);
    }
  }, [today]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const weekStart = weekStartKST();
    const [{ data: u }, { data: v }] = await Promise.all([
      supabase.from("users").select("*").order("created_at"),
      supabase.from("videos").select("*, users(*)").gte("recorded_date", weekStart),
    ]);
    const allVids = (v as Video[]) ?? [];
    setMembers((u as UserProfile[]) ?? []);
    setVideos(allVids);
    // Pre-fetch public URLs for today's videos
    const todayVids = allVids.filter(x => x.recorded_date === today);
    const urls: Record<string, string> = {};
    for (const vid of todayVids) {
      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(vid.storage_path);
      urls[vid.id] = publicUrl;
    }
    setTodayUrls(urls);
    setLoading(false);
  }, [today]);

  useEffect(() => { fetchTopic(); fetchData(); }, [fetchTopic, fetchData]);

  // Re-fetch when tab regains focus so ratings set on upload page are visible
  useEffect(() => {
    const onFocus = () => fetchData();
    const onVisibility = () => { if (!document.hidden) fetchData(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchData]);

  const fmtTime = (s: number) => { if (!isFinite(s)) return "0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; };
  const fmtUploadTime = (iso: string) => { const d = new Date(new Date(iso).getTime() + 9*3600000); return d.toISOString().slice(11,16); };
  const fmtDur = (s: number | null) => s ? fmtTime(s) : null;
  const Stars = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className="text-[10px]" style={{ color: "#4b5563" }}>No rating</span>;
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-[2px]">
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="12" height="12" viewBox="0 0 24 24"
              fill={i <= rating ? "#f59e0b" : "none"}
              stroke={i <= rating ? "#f59e0b" : "#6b7280"}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
        <span className="text-[10px] font-bold" style={{ color: "#f59e0b" }}>{rating}/5</span>
      </div>
    );
  };

  const weekCount   = (uid: string) => videos.filter(v => v.user_id === uid).length;
  const todayVidMap = new Map(videos.filter(v => v.recorded_date === today).map(v => [v.user_id, v]));
  const todayJoined = members.filter(m => todayVidMap.has(m.id));
  const todayMissed = members.filter(m => !todayVidMap.has(m.id));
  const videosOnDay = (dateStr: string) => videos.filter(v => v.recorded_date === dateStr);
  const localDateStr = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const dayIndex    = weekDays.findIndex((d: Date) => localDateStr(d) === today);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 flex flex-col gap-6 md:gap-8"
      style={{ animation: "fadeIn 0.5s ease-out" }}>

      {/* ── Today's Topic ─────────────────────────────────────────────── */}
      <section className={`${CARD} p-8 relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: "radial-gradient(ellipse 60% 70% at 20% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />

        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span className={PILL}>Today&apos;s Topic</span>
        </div>

        {topic ? (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight" style={GRADIENT_TEXT}>
              {topic.title_en ?? topic.title_ko}
            </h2>
            {topic.title_ko && topic.title_ko !== topic.title_en && (
              <p className="text-sm italic mb-4" style={{ color: "#9ca3af" }}>&ldquo;{topic.title_ko}&rdquo;</p>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${DIFF_COLOR[topic.difficulty]}`}>
              {DIFF_EN[topic.difficulty]}
            </span>
          </>
        ) : (
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded-lg bg-gray-800/80 animate-pulse" />
            <div className="h-4 w-1/2 rounded-lg bg-gray-800/60 animate-pulse" />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <div>
            <p className={`${SECTION_LABEL} mb-1`}>Next topic in</p>
            <Countdown />
          </div>
          <div>
            <p className={`${SECTION_LABEL} mb-1`}>Today&apos;s participation</p>
            <span className="text-3xl font-bold" style={GRADIENT_TEXT}>
              {todayJoined.length}
              <span className="text-lg font-normal" style={{ color: "#4b5563" }}>/{members.length}</span>
            </span>
          </div>
          <div>
            <p className={`${SECTION_LABEL} mb-1`}>Challenge day</p>
            <span className="text-3xl font-bold" style={GRADIENT_ACCENT}>Day {dayIndex >= 0 ? dayIndex + 1 : "—"}</span>
          </div>
          <div>
            <p className={`${SECTION_LABEL} mb-1`}>Current week</p>
            <span className="text-3xl font-bold" style={GRADIENT_TEXT}>Week {Math.ceil(new Date().getDate() / 7)}</span>
          </div>
        </div>
      </section>

      {/* ── Participation + Achievement ───────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        <section className={`${CARD} p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className={SECTION_LABEL}>Today&apos;s Status</span>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-800/60 animate-pulse" />)}</div>
          ) : members.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "#4b5563" }}>No members yet</p>
          ) : (
            <>
              {todayJoined.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-green-400 font-semibold uppercase tracking-widest mb-2">Joined ✓</p>
                  <div className="flex flex-col gap-2">
                    {todayJoined.map(m => {
                      const vid = todayVidMap.get(m.id)!;
                      const dur = fmtDur(vid.duration_seconds);
                      const uploadedAt = fmtUploadTime(vid.created_at);
                      return (
                        <button key={m.id} type="button"
                          onClick={() => { setPlayingVid(vid); setAudioPlaying(false); setAudioTime(0); setAudioDur(0); }}
                          className="flex items-center gap-3 rounded-xl bg-green-400/5 border border-green-400/10 px-4 py-2.5 hover:bg-green-400/10 hover:border-green-400/20 transition-all text-left w-full">
                          <Avatar user={m} size={30} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{displayName(m)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {dur && <span className="text-[11px]" style={{ color: "#6b7280" }}>⏱ {dur}</span>}
                              <span className="text-[11px]" style={{ color: "#6b7280" }}>{uploadedAt} KST</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Stars rating={vid.rating} />
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {todayMissed.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#374151" }}>Not yet</p>
                  <div className="flex flex-col gap-2">
                    {todayMissed.map(m => (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl bg-gray-800/40 border border-gray-800/60 px-4 py-2.5">
                        <Avatar user={m} size={30} />
                        <span className="text-sm flex-1 truncate" style={{ color: "#6b7280" }}>{displayName(m)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className={`${CARD} p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
            <span className={SECTION_LABEL}>Weekly Achievement</span>
          </div>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="flex flex-col gap-4">
              {[...members]
                .sort((a, b) => (weekCount(b.id) / b.weekly_goal) - (weekCount(a.id) / a.weekly_goal))
                .map((m, i) => {
                  const done = weekCount(m.id);
                  const pct  = Math.min(100, Math.round((done / m.weekly_goal) * 100));
                  return (
                    <div key={m.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] w-5 text-center" style={{ color: "#4b5563" }}>#{i+1}</span>
                        <Avatar user={m} size={22} />
                        <span className="text-sm text-white flex-1 truncate">{m.full_name ?? m.email}</span>
                        <span className="text-xs font-bold text-white">{done}/{m.weekly_goal}</span>
                        <span className="text-[11px] w-10 text-right" style={{ color: "#4b5563" }}>{pct}%</span>
                      </div>
                      <div className="ml-7 h-1.5 rounded-full bg-gray-800/80">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct >= 100 ? "#4ade80" : pct >= 60 ? ACCENT : "#f87171" }} />
                      </div>
                      <div className="ml-7 flex gap-0.5 mt-1.5">
                        {weekDays.map((d: Date, di: number) => {
                          const dateStr = localDateStr(d);
                          const hasVid = videos.some(v => v.user_id === m.id && v.recorded_date === dateStr);
                          return (
                            <div key={di} className="flex flex-col items-center gap-0.5 flex-1">
                              <div className={`w-2.5 h-2.5 rounded-full ${hasVid ? "bg-white" : "bg-gray-800"}`} />
                              <span className="text-[8px]" style={{ color: hasVid ? "#9ca3af" : "#374151" }}>{DAYS[di]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              {members.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "#4b5563" }}>No members yet</p>}
            </div>
          )}
        </section>
      </div>

      {/* ── Weekly Calendar ──────────────────────────────────────────────── */}
      <section className={`${CARD} p-4 md:p-6`}>
        <div className="flex items-center gap-2 mb-4 md:mb-5">
          <span className="w-2 h-2 rounded-full" style={{ background: ACCENT_MID ?? ACCENT }} />
          <span className={SECTION_LABEL}>Weekly Calendar</span>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-3">
          {weekDays.map((d: Date, i: number) => {
            const dateStr = localDateStr(d);
            const isToday = dateStr === today;
            const isPast  = d < new Date(today);
            const dayVids = videosOnDay(dateStr);
            const hasVids = dayVids.length > 0;
            return (
              <button key={dateStr} type="button"
                onClick={() => router.push(`/dashboard/upload?date=${dateStr}`)}
                className={`group flex flex-col items-center gap-2 rounded-xl p-3 border transition-all
                  ${isToday
                    ? "border-violet-400/40 bg-violet-400/5 hover:bg-violet-400/10"
                    : hasVids
                      ? "border-gray-700/60 bg-gray-800/40 hover:border-gray-600/80"
                      : "border-gray-800/40 hover:border-gray-700/40 hover:bg-gray-900/40"
                  }`}>
                <span className={`text-[11px] font-semibold ${isToday ? "text-violet-400" : "text-gray-600"}`}>
                  {DAYS[i]}
                </span>
                <span className={`text-base font-bold ${isToday ? "text-violet-300" : isPast ? "text-gray-400" : "text-gray-700"}`}>
                  {d.getDate()}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5 min-h-[8px]">
                  {dayVids.slice(0, 4).map((_, vi) => (
                    <div key={vi} className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                  ))}
                  {!hasVids && isPast && <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center mt-4 text-[11px]" style={{ color: "#374151" }}>
          Click a date to view uploaded videos
        </p>
      </section>

      {/* ── Audio Player Popup ───────────────────────────────────────────── */}
      {playingVid && (() => {
        const url = todayUrls[playingVid.id] ?? "";
        const u   = playingVid.users as UserProfile | undefined;
        const pct = audioDur > 0 ? (audioTime / audioDur) * 100 : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: "fadeIn 0.15s ease-out" }}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setPlayingVid(null); audioRef.current?.pause(); }} />
            <div className="relative w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-6 flex flex-col gap-4"
              style={{ animation: "slideDown 0.2s ease-out" }}>

              <audio ref={audioRef} src={url} preload="metadata"
                onTimeUpdate={() => setAudioTime(audioRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setAudioDur(audioRef.current?.duration ?? 0)}
                onEnded={() => setAudioPlaying(false)} />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {u && <Avatar user={u} size={36} />}
                  <div>
                    <p className="text-sm font-bold text-white">{u ? displayName(u) : "Unknown"}</p>
                    <Stars rating={playingVid.rating} />
                  </div>
                </div>
                <button type="button" onClick={() => { setPlayingVid(null); audioRef.current?.pause(); }}
                  className="text-gray-600 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className="relative h-1.5 rounded-full bg-gray-800 cursor-pointer"
                onClick={e => {
                  if (!audioRef.current || !audioDur) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioDur;
                }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a78bfa,#e879f9)" }} />
              </div>
              <div className="flex justify-between text-[11px]" style={{ color: "#4b5563" }}>
                <span>{fmtTime(audioTime)}</span>
                <span>{fmtTime(audioDur)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioTime - 10); }}
                  className="text-gray-500 hover:text-white transition-colors text-xs">−10s</button>
                <button type="button"
                  onClick={async () => {
                    if (!audioRef.current) return;
                    if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
                    else { await audioRef.current.play(); setAudioPlaying(true); }
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center border border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 transition-all">
                  {audioPlaying
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  }
                </button>
                <button type="button" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDur, audioTime + 10); }}
                  className="text-gray-500 hover:text-white transition-colors text-xs">+10s</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// re-export accent for use in page
const ACCENT_MID = "#c084fc";
