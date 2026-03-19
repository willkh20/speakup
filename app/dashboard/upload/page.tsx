"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { CARD, SECTION_LABEL, GRADIENT_TEXT, ACCENT, DIFF_COLOR, DIFF_EN } from "@/lib/styles";
import { todayKST } from "@/lib/date";
import { displayName } from "@/lib/types";
import type { Video, UserProfile, Topic } from "@/lib/types";

const KST_MS = 9 * 60 * 60 * 1000;
const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MEMBER_COLORS = [
  "#818cf8", "#34d399", "#f472b6", "#fb923c", "#38bdf8",
  "#a78bfa", "#4ade80", "#f87171", "#facc15", "#2dd4bf",
];

function getMemberColor(index: number) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function Avatar({ user, size = 28 }: { user: UserProfile; size?: number }) {
  return user.avatar_url ? (
    <img src={user.avatar_url} alt="" className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}>
      {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
    </div>
  );
}

function AudioCard({ video, publicUrl, currentUserId, today, onDelete }: {
  video: Video; publicUrl: string; currentUserId?: string; today: string; onDelete?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);
  const u = video.users as UserProfile | undefined;
  const isOwner = currentUserId && currentUserId === video.user_id;
  const canDelete = isOwner && video.recorded_date === today;

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.storage.from("videos").remove([video.storage_path]);
    await supabase.from("videos").delete().eq("id", video.id);
    setDeleting(false);
    setConfirmDel(false);
    onDelete?.();
  };

  const toggle = async () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { try { await ref.current.play(); setPlaying(true); } catch { setPlaying(false); } }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-4 flex flex-col gap-3">
      <audio ref={ref} src={publicUrl} preload="metadata"
        onTimeUpdate={() => setCurrentTime(ref.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }} />

      {/* User row */}
      <div className="flex items-center gap-2">
        {u && <Avatar user={u} size={28} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{u?.full_name ?? u?.email ?? "Unknown"}</p>
          <p className="text-[11px]" style={{ color: "#6b7280" }}>{video.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a href={publicUrl} download
            className="text-xs border border-gray-700/60 hover:border-gray-500 text-gray-400 hover:text-white px-2.5 py-1 rounded-lg transition-all">
            Save
          </a>
          {canDelete && (
            <button type="button" onClick={() => setConfirmDel(true)}
              className="w-7 h-7 rounded-lg border border-gray-700/60 hover:border-red-500/50 hover:bg-red-500/10 text-gray-600 hover:text-red-400 flex items-center justify-center transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: "fadeIn 0.15s ease-out" }}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDel(false)} />
          <div className="relative rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4" style={{ animation: "slideDown 0.2s ease-out" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Delete Recording</p>
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmDel(false)}
                className="px-4 py-2 rounded-lg border border-gray-700/60 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle}
          className="w-9 h-9 rounded-full border border-gray-700/60 bg-gray-800/60 hover:border-violet-400/50 hover:bg-violet-400/10 flex items-center justify-center transition-all shrink-0">
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="relative h-1.5 rounded-full bg-gray-800 cursor-pointer"
            onClick={(e) => {
              if (!ref.current || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              ref.current.currentTime = ratio * duration;
            }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #a78bfa, #e879f9)" }} />
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: "#4b5563" }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const { user } = useAuth();
  const today = todayKST();
  const nowKST = new Date(Date.now() + KST_MS);

  const [members,        setMembers]        = useState<UserProfile[]>([]);
  const [todayVids,      setTodayVids]      = useState<Video[]>([]);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [calYear,   setCalYear]   = useState(nowKST.getFullYear());
  const [calMonth,  setCalMonth]  = useState(nowKST.getMonth());
  const [monthVids, setMonthVids] = useState<Video[]>([]);
  const [monthUrls, setMonthUrls] = useState<Record<string, string>>({});
  const [topics,    setTopics]    = useState<Topic[]>([]);

  const [selDate,   setSelDate]   = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Today's Status audio player
  const [todayAudioUrls, setTodayAudioUrls] = useState<Record<string, string>>({});
  const [uploadPlayingVid, setUploadPlayingVid] = useState<Video | null>(null);
  const uploadAudioRef = useRef<HTMLAudioElement>(null);
  const [uploadAudioPlaying, setUploadAudioPlaying] = useState(false);
  const [uploadAudioTime, setUploadAudioTime] = useState(0);
  const [uploadAudioDur, setUploadAudioDur] = useState(0);

  // Rating popup
  const [ratingVideoId, setRatingVideoId] = useState<string | null>(null);
  const [hoverStar,     setHoverStar]     = useState(0);
  const [selectedStar,  setSelectedStar]  = useState(0);
  const [savingRating,  setSavingRating]  = useState(false);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("users").select("*").eq("status", "approved").order("created_at");
    setMembers((data as UserProfile[]) ?? []);
  }, []);

  const fetchTodayVids = useCallback(async () => {
    const { data } = await supabase.from("videos").select("*, users(*)")
      .eq("recorded_date", today).order("created_at");
    const vids = (data as Video[]) ?? [];
    setTodayVids(vids);
    const urls: Record<string, string> = {};
    for (const vid of vids) {
      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(vid.storage_path);
      urls[vid.id] = publicUrl;
    }
    setTodayAudioUrls(urls);
  }, [today]);

  const fetchMonthData = useCallback(async () => {
    const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
    const lastDay  = localDateStr(new Date(calYear, calMonth + 1, 0));
    const [{ data: v }, { data: t }] = await Promise.all([
      supabase.from("videos").select("*, users(*)")
        .gte("recorded_date", firstDay).lte("recorded_date", lastDay).order("created_at"),
      supabase.from("topics").select("*").eq("is_custom", true)
        .gte("active_date", firstDay).lte("active_date", lastDay),
    ]);
    const vids = (v as Video[]) ?? [];
    setMonthVids(vids);
    setTopics((t as Topic[]) ?? []);
    const urls: Record<string, string> = {};
    for (const vid of vids) {
      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(vid.storage_path);
      urls[vid.id] = publicUrl;
    }
    setMonthUrls(urls);
  }, [calYear, calMonth]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchTodayVids(); }, [fetchTodayVids]);
  useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

  const getAudioDuration = (file: File): Promise<number | null> =>
    new Promise(resolve => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      const url = URL.createObjectURL(file);
      audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(isFinite(audio.duration) ? audio.duration : null); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      audio.src = url;
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(10);

    const [durationSeconds] = await Promise.all([getAudioDuration(file)]);

    const ext  = file.name.split(".").pop() ?? "mp3";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("videos")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (storageErr) {
      alert("Upload failed: " + storageErr.message);
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploadProgress(80);

    const { data: inserted } = await supabase.from("videos").insert({
      user_id:          user.id,
      storage_path:     path,
      recorded_date:    today,
      title:            file.name,
      duration_seconds: durationSeconds,
    }).select("id").single();

    setUploading(false);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = "";
    fetchTodayVids();
    if (calYear === nowKST.getFullYear() && calMonth === nowKST.getMonth()) fetchMonthData();

    // Open rating popup
    if (inserted?.id) {
      setSelectedStar(0);
      setHoverStar(0);
      setRatingVideoId(inserted.id);
    }
  };

  const todayVidByUser = new Map(todayVids.map(v => [v.user_id, v]));
  const todayUploaderIds = new Set(todayVids.map(v => v.user_id));
  const todayJoined = members.filter(m => todayUploaderIds.has(m.id));
  const todayMissed = members.filter(m => !todayUploaderIds.has(m.id));

  const fmtTime = (s: number) => { if (!isFinite(s)) return "0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; };

  const Stars = ({ rating }: { rating: number | null }) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-[2px]">
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="11" height="11" viewBox="0 0 24 24"
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

  const fmtDuration = (s: number | null) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const fmtUploadTime = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + KST_MS);
    return d.toISOString().slice(11, 16); // HH:MM
  };

  const videosByDate: Record<string, Video[]> = {};
  monthVids.forEach(v => { (videosByDate[v.recorded_date] ??= []).push(v); });

  const topicByDate: Record<string, Topic> = {};
  topics.forEach(t => { if (t.active_date) topicByDate[t.active_date] = t; });

  const calDays    = getCalendarDays(calYear, calMonth);
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const memberColorMap = new Map(members.map((m, i) => [m.id, getMemberColor(i)]));

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); };

  const selVids        = selDate ? (videosByDate[selDate] ?? []) : [];
  const selTopic       = selDate ? topicByDate[selDate] ?? null : null;
  const selUploaderIds = new Set(selVids.map(v => v.user_id));
  const selJoined      = members.filter(m => selUploaderIds.has(m.id));
  const selMissed      = members.filter(m => !selUploaderIds.has(m.id));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 flex flex-col gap-6 md:gap-8"
      style={{ animation: "fadeIn 0.5s ease-out" }}>

      {/* Header */}
      <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={GRADIENT_TEXT}>Upload</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Share your English speaking recording for today</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <label className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all
            ${uploading ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-white text-black hover:bg-gray-100 hover:scale-105 active:scale-95"}`}>
            {/* Mic icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            {uploading ? `Uploading${uploadProgress > 10 ? " ✓" : "..."}` : "+ Upload Recording"}
            <input ref={fileRef} type="file" accept="audio/*" className="hidden"
              onChange={handleUpload} disabled={uploading} />
          </label>
          {uploading && (
            <div className="w-44 h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #a78bfa, #e879f9)" }} />
            </div>
          )}
        </div>
      </div>

      {/* Today's Status */}
      <section className={`${CARD} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className={SECTION_LABEL}>Today&apos;s Upload Status</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-700/60 text-gray-500">
            {todayJoined.length} / {members.length} uploaded
          </span>
        </div>
        {members.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "#4b5563" }}>No members yet</p>
        ) : (
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            {todayJoined.map(m => {
              const vid = todayVidByUser.get(m.id);
              const dur = vid ? fmtDuration(vid.duration_seconds) : null;
              const uploadedAt = vid ? fmtUploadTime(vid.created_at) : null;
              return (
                <button key={m.id} type="button"
                  onClick={() => { if (vid) { setUploadPlayingVid(vid); setUploadAudioPlaying(false); setUploadAudioTime(0); setUploadAudioDur(0); } }}
                  className="flex items-center gap-3 rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-left w-full hover:bg-green-400/10 hover:border-green-400/30 transition-all">
                  <Avatar user={m} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{displayName(m)}</p>
                    <p className="text-[11px] text-green-400 font-medium">Uploaded ✓</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Stars rating={vid?.rating ?? null} />
                    {dur && (
                      <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {dur}
                      </span>
                    )}
                    {uploadedAt && (
                      <span className="text-[10px]" style={{ color: "#4b5563" }}>{uploadedAt} KST</span>
                    )}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </button>
              );
            })}
            {todayMissed.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-3">
                <Avatar user={m} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#6b7280" }}>{m.full_name ?? m.email}</p>
                  <p className="text-[11px] font-medium" style={{ color: "#f87171" }}>Not yet</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-red-400/60 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calendar */}
      <section className={`${CARD} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
            <span className={SECTION_LABEL}>Recording Calendar</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={prevMonth}
              className="w-8 h-8 rounded-lg border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-sm font-semibold text-white w-40 text-center">{monthLabel}</span>
            <button type="button" onClick={nextMonth}
              className="w-8 h-8 rounded-lg border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div className="w-24" />
        </div>

        {members.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-800/60">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getMemberColor(i) }} />
                <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>
                  {m.full_name?.split(" ")[0] ?? m.email?.split("@")[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-7 mb-1">
          {DAYS_HEADER.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-widest py-1" style={{ color: "#374151" }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 md:gap-1.5">
          {calDays.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const dateStr = localDateStr(d);
            const isToday = dateStr === today;
            const isPast  = dateStr < today;
            const vids    = videosByDate[dateStr] ?? [];
            // Deduplicate by user: one dot / one count per unique uploader per day
            const uniqueUploaderIds = [...new Set(vids.map(v => v.user_id))];
            const count   = uniqueUploaderIds.length;
            const total   = members.length;
            const full    = total > 0 && count >= total;
            const uploaderColors = uniqueUploaderIds.map(uid => memberColorMap.get(uid)).filter(Boolean) as string[];

            return (
              <button key={dateStr} type="button"
                onClick={() => { setSelDate(dateStr); setModalOpen(true); }}
                className={`flex flex-col items-center rounded-xl py-2 px-1 border transition-all hover:scale-105 active:scale-100
                  ${isToday
                    ? "border-violet-400/40 bg-violet-400/5 hover:bg-violet-400/10"
                    : count > 0
                      ? full
                        ? "border-green-400/30 bg-green-400/5 hover:border-green-400/50"
                        : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
                      : "border-transparent hover:border-gray-800/60 hover:bg-gray-900/40"
                  }`}>
                <span className={`text-sm font-bold mb-1.5
                  ${isToday ? "text-violet-300" : count > 0 ? "text-white" : isPast ? "text-gray-700" : "text-gray-600"}`}>
                  {d.getDate()}
                </span>
                <div className="flex flex-wrap justify-center gap-[3px] min-h-[10px]">
                  {uploaderColors.slice(0, 5).map((color, vi) => (
                    <div key={vi} className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  ))}
                  {uploaderColors.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
                  {count === 0 && isPast && !isToday && <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />}
                </div>
                {count > 0 && (
                  <span className="text-[9px] font-bold mt-1" style={{ color: "#6b7280" }}>{count}/{total}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-center mt-4 text-[11px]" style={{ color: "#1f2937" }}>
          Click a date to listen to recordings · Colored dots = uploaded by member
        </p>
      </section>

      {/* Day Detail Modal */}
      {modalOpen && selDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ animation: "fadeIn 0.15s ease-out" }}>
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[85vh]"
            style={{ animation: "slideDown 0.2s ease-out" }}>

            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800/60">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#6b7280" }}>
                  {new Date(selDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                {selTopic ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-white">{selTopic.title_en ?? selTopic.title_ko}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${DIFF_COLOR[selTopic.difficulty]}`}>
                      {DIFF_EN[selTopic.difficulty]}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic">No topic for this day</p>
                )}
              </div>
              <button type="button" onClick={() => setModalOpen(false)}
                className="text-gray-600 hover:text-white transition-colors shrink-0 ml-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
              <div>
                <p className={`${SECTION_LABEL} mb-3`}>Participation — {selJoined.length} / {members.length}</p>
                <div className="flex flex-wrap gap-2">
                  {selJoined.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-400/20 bg-green-400/5">
                      <Avatar user={m} size={18} />
                      <span className="text-xs font-semibold text-green-300">{m.full_name?.split(" ")[0] ?? m.email?.split("@")[0]}</span>
                      <span className="text-[10px] text-green-400">✓</span>
                    </div>
                  ))}
                  {selMissed.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-800/60 bg-gray-800/20">
                      <Avatar user={m} size={18} />
                      <span className="text-xs font-semibold" style={{ color: "#4b5563" }}>{m.full_name?.split(" ")[0] ?? m.email?.split("@")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selVids.length > 0 ? (
                <div>
                  <p className={`${SECTION_LABEL} mb-3`}>Recordings ({selVids.length})</p>
                  <div className="flex flex-col gap-3">
                    {selVids.map(v => (
                      <AudioCard key={v.id} video={v} publicUrl={monthUrls[v.id] ?? ""}
                        currentUserId={user?.id} today={today}
                        onDelete={() => { fetchTodayVids(); fetchMonthData(); }} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-sm" style={{ color: "#374151" }}>No recordings uploaded on this day</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Status Audio Player Popup ───────────────────────── */}
      {uploadPlayingVid && (() => {
        const url = todayAudioUrls[uploadPlayingVid.id] ?? "";
        const u   = uploadPlayingVid.users as UserProfile | undefined;
        const pct = uploadAudioDur > 0 ? (uploadAudioTime / uploadAudioDur) * 100 : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: "fadeIn 0.15s ease-out" }}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setUploadPlayingVid(null); uploadAudioRef.current?.pause(); }} />
            <div className="relative w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-6 flex flex-col gap-4"
              style={{ animation: "slideDown 0.2s ease-out" }}>
              <audio ref={uploadAudioRef} src={url} preload="metadata"
                onTimeUpdate={() => setUploadAudioTime(uploadAudioRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setUploadAudioDur(uploadAudioRef.current?.duration ?? 0)}
                onEnded={() => setUploadAudioPlaying(false)} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {u && <Avatar user={u} size={36} />}
                  <div>
                    <p className="text-sm font-bold text-white">{u ? displayName(u) : "Unknown"}</p>
                    <p className="text-[11px]" style={{ color: "#6b7280" }}>
                      {uploadPlayingVid.duration_seconds ? fmtTime(uploadPlayingVid.duration_seconds) : ""}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => { setUploadPlayingVid(null); uploadAudioRef.current?.pause(); }}
                  className="text-gray-600 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
              <div className="relative h-1.5 rounded-full bg-gray-800 cursor-pointer"
                onClick={e => {
                  if (!uploadAudioRef.current || !uploadAudioDur) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  uploadAudioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * uploadAudioDur;
                }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a78bfa,#e879f9)" }} />
              </div>
              <div className="flex justify-between text-[11px]" style={{ color: "#4b5563" }}>
                <span>{fmtTime(uploadAudioTime)}</span>
                <span>{fmtTime(uploadAudioDur)}</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => { if (uploadAudioRef.current) uploadAudioRef.current.currentTime = Math.max(0, uploadAudioTime - 10); }}
                  className="text-gray-500 hover:text-white transition-colors text-xs">−10s</button>
                <button type="button"
                  onClick={async () => {
                    if (!uploadAudioRef.current) return;
                    if (uploadAudioPlaying) { uploadAudioRef.current.pause(); setUploadAudioPlaying(false); }
                    else { await uploadAudioRef.current.play(); setUploadAudioPlaying(true); }
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center border border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 transition-all">
                  {uploadAudioPlaying
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  }
                </button>
                <button type="button" onClick={() => { if (uploadAudioRef.current) uploadAudioRef.current.currentTime = Math.min(uploadAudioDur, uploadAudioTime + 10); }}
                  className="text-gray-500 hover:text-white transition-colors text-xs">+10s</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Rating Popup ─────────────────────────────────────────────── */}
      {ratingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl p-7 flex flex-col items-center gap-5"
            style={{ animation: "slideDown 0.2s ease-out" }}>

            {/* Mic icon */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.15),rgba(232,121,249,0.15))", border: "1px solid rgba(167,139,250,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="11" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="text-base font-bold text-white">How was your recording?</p>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Rate your satisfaction with today&apos;s speaking</p>
            </div>

            {/* Stars */}
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => {
                const filled = star <= (hoverStar || selectedStar);
                return (
                  <button key={star} type="button"
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setSelectedStar(star)}
                    className="transition-transform hover:scale-125 active:scale-110">
                    <svg width="36" height="36" viewBox="0 0 24 24"
                      fill={filled ? "#f59e0b" : "none"}
                      stroke={filled ? "#f59e0b" : "#374151"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                );
              })}
            </div>

            {selectedStar > 0 && (
              <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                {["","😞 Poor","😐 Fair","🙂 Good","😊 Great","🤩 Perfect!"][selectedStar]}
              </p>
            )}

            <div className="flex gap-3 w-full">
              <button type="button"
                onClick={() => setRatingVideoId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700/60 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                Skip
              </button>
              <button type="button" disabled={selectedStar === 0 || savingRating}
                onClick={async () => {
                  setSavingRating(true);
                  await supabase.from("videos").update({ rating: selectedStar }).eq("id", ratingVideoId);
                  setSavingRating(false);
                  setRatingVideoId(null);
                  fetchTodayVids();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: selectedStar > 0 ? "linear-gradient(135deg,#a78bfa,#e879f9)" : "#1f2937", color: "white" }}>
                {savingRating ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
