"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";
import { displayName } from "@/lib/types";

const MenuIcon  = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
  </svg>
);
const CloseIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const PersonIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const tabs = [
  { label: "Home",    href: "/dashboard"         },
  { label: "Upload",  href: "/dashboard/upload"  },
  { label: "Topics",  href: "/dashboard/topics"  },
  { label: "Members", href: "/dashboard/members" },
  { label: "Fines",   href: "/dashboard/fines"   },
];
const adminTab = { label: "Admin", href: "/dashboard/admin" };

const Logo = () => (
  <span className="text-xl font-black tracking-tight select-none"
    style={{ background: "linear-gradient(135deg, #ffffff 30%, #a78bfa 65%, #e879f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
    SpeakUp
  </span>
);

// ── Onboarding Modal ───────────────────────────────────────────────────────
function OnboardingModal({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [nickname,   setNickname]   = useState("");
  const [goal,       setGoal]       = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [fullName,   setFullName]   = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("users").select("full_name, avatar_url").eq("id", userId).single()
      .then(({ data }) => {
        if (data) {
          setFullName((data as { full_name: string | null }).full_name);
          setAvatarUrl((data as { avatar_url: string | null }).avatar_url);
        }
      });
  }, [userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    await supabase.storage.from("avatars").remove([path]);
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
      setAvatarUrl(url);
    }
    setUploading(false);
    if (avatarRef.current) avatarRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("users").update({
      nickname:           nickname.trim() || null,
      goal:               goal.trim() || null,
      weekly_goal:        weeklyGoal,
      weekly_goal_set_at: new Date().toISOString(),
      onboarding_done:    true,
    }).eq("id", userId);
    setSaving(false);
    onDone();
  };

  const initials = (nickname || fullName || "?")[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-700/60 bg-gray-950 shadow-2xl overflow-hidden flex flex-col"
        style={{ animation: "slideDown 0.3s ease-out", maxHeight: "92vh" }}>

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-gray-800/60 text-center">
          <div className="text-2xl mb-1">👋</div>
          <h2 className="text-xl font-bold text-white">Welcome to Speak Up!</h2>
          <p className="text-sm mt-1.5" style={{ color: "#6b7280" }}>Set up your profile before you get started</p>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500/30" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}>
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                }
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-xs" style={{ color: "#4b5563" }}>{uploading ? "Uploading..." : "Click to add a photo (optional)"}</p>
          </div>

          {/* Nickname */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>
              Nickname <span style={{ color: "#374151" }}>(optional)</span>
            </label>
            <input
              type="text" value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder={fullName ?? "Your nickname"}
              className="w-full bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
            />
            <p className="text-[11px]" style={{ color: "#374151" }}>Displayed instead of your Google name</p>
          </div>

          {/* My Goal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>
              My Goal <span style={{ color: "#374151" }}>(optional)</span>
            </label>
            <textarea
              value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Pass OPIc AL by June"
              rows={2}
              className="w-full bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
          </div>

          {/* Weekly Goal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>Weekly Goal</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setWeeklyGoal(g => Math.max(1, g - 1))}
                className="w-9 h-9 rounded-full border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all font-bold text-base flex items-center justify-center">
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-white">{weeklyGoal}</span>
                <span className="text-sm ml-1" style={{ color: "#6b7280" }}>/ 7 days</span>
              </div>
              <button type="button" onClick={() => setWeeklyGoal(g => Math.min(7, g + 1))}
                className="w-9 h-9 rounded-full border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all font-bold text-base flex items-center justify-center">
                +
              </button>
            </div>
            <p className="text-[11px] text-center" style={{ color: "#4b5563" }}>
              🔒 Weekly Goal은 설정 후 30일 동안 변경할 수 없어요
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-800/60">
          <button type="button" onClick={handleSave} disabled={saving || uploading}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)", color: "white" }}>
            {saving ? "Saving..." : "Get Started →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile panel ──────────────────────────────────────────────────────────
function ProfilePanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [nickname,    setNickname]    = useState("");
  const [goal,        setGoal]        = useState("");
  const [weeklyGoal,  setWeeklyGoal]  = useState(7);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [goalLockedDaysLeft, setGoalLockedDaysLeft] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("users").select("*").eq("id", userId).single()
      .then(({ data }) => {
        if (!data) return;
        const p = data as UserProfile;
        setProfile(p);
        setNickname(p.nickname ?? "");
        setGoal(p.goal ?? "");
        setWeeklyGoal(p.weekly_goal ?? 7);
        setAvatarUrl(p.avatar_url ?? null);
        // Check lock: 30 days from when weekly_goal was last set
        if (p.weekly_goal_set_at) {
          const setAt  = new Date(p.weekly_goal_set_at).getTime();
          const unlock = setAt + 30 * 24 * 60 * 60 * 1000;
          const daysLeft = Math.ceil((unlock - Date.now()) / (24 * 60 * 60 * 1000));
          setGoalLockedDaysLeft(daysLeft > 0 ? daysLeft : 0);
        }
      });
  }, [userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    // Remove old avatar first (ignore error)
    await supabase.storage.from("avatars").remove([path]);
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      // Add cache-busting param so browser refreshes the image
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
      setAvatarUrl(url);
    }
    setUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const weeklyGoalLocked = goalLockedDaysLeft > 0;

  const save = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {
      nickname: nickname.trim() || null,
      goal:     goal.trim() || null,
    };
    // Only update weekly_goal if not locked, and record the timestamp when it changes
    if (!weeklyGoalLocked) {
      const originalGoal = profile?.weekly_goal ?? 7;
      updates.weekly_goal = weeklyGoal;
      if (weeklyGoal !== originalGoal) {
        updates.weekly_goal_set_at = new Date().toISOString();
      }
    }
    await supabase.from("users").update(updates).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = (nickname || profile?.full_name || profile?.email || "?")[0].toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-gray-950 border-l border-gray-800/60 shadow-2xl flex flex-col"
        style={{ animation: "slideInRight 0.25s ease-out" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/60">
          <div>
            <p className="text-sm font-bold text-white">Profile Settings</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#4b5563" }}>{profile?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-2 py-6 border-b border-gray-800/60">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}>
                {initials}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
              }
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-[11px]" style={{ color: "#4b5563" }}>
            {uploading ? "Uploading..." : "Click to change photo"}
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* Nickname */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>Nickname</label>
            <input
              type="text" value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder={profile?.full_name ?? "Your nickname"}
              className="w-full bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
            />
            <p className="text-[11px]" style={{ color: "#4b5563" }}>Displayed instead of your real name</p>
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>My Goal</label>
            <textarea
              value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Pass OPIc AL by June"
              rows={2}
              className="w-full bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
            />
          </div>

          {/* Weekly Goal */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#6b7280" }}>Weekly Goal</label>
              {weeklyGoalLocked && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-400/20 bg-amber-400/5" style={{ color: "#f59e0b" }}>
                  🔒 {goalLockedDaysLeft}d left
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setWeeklyGoal(g => Math.max(1, g - 1))}
                disabled={weeklyGoalLocked}
                className="w-9 h-9 rounded-full border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-700/60">
                −
              </button>
              <div className="flex-1 text-center">
                <span className={`text-2xl font-bold ${weeklyGoalLocked ? "text-gray-500" : "text-white"}`}>{weeklyGoal}</span>
                <span className="text-sm ml-1" style={{ color: "#6b7280" }}>/ 7</span>
              </div>
              <button type="button" onClick={() => setWeeklyGoal(g => Math.min(7, g + 1))}
                disabled={weeklyGoalLocked}
                className="w-9 h-9 rounded-full border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-500 transition-all font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-700/60">
                +
              </button>
            </div>
            <p className="text-[11px] text-center" style={{ color: "#4b5563" }}>
              {weeklyGoalLocked ? "Locked for 30 days after last change" : "recordings per week"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-800/60 flex flex-col gap-3">
          <button type="button" onClick={save} disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50
              bg-white text-black hover:bg-gray-100 active:scale-95">
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main nav ───────────────────────────────────────────────────────────────
export default function DashboardNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [myProfile,     setMyProfile]     = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load profile for nav display name + admin status
  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (!data) return;
        const profile = data as UserProfile;
        setMyProfile(profile);
        // Show onboarding only on very first login
        if (!profile.onboarding_done) setShowOnboarding(true);
      });
  }, [user, profileOpen]); // re-fetch after panel closes

  const allTabs = myProfile?.is_admin ? [...tabs, adminTab] : tabs;

  const name = myProfile ? displayName(myProfile)
    : (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
      ?? user?.email?.split("@")[0] ?? "Member";
  // DB avatar_url takes priority over Google profile photo
  const avatarUrl = myProfile?.avatar_url
    ?? (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <>
      <header className="fixed top-0 w-full z-40 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/dashboard" className="shrink-0"><Logo /></Link>

            {/* Center tabs — desktop */}
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {allTabs.map(t => {
                const active = pathname === t.href;
                return (
                  <Link key={t.href} href={t.href}
                    className={`px-4 py-1.5 rounded-full text-base font-medium transition-all
                      ${active
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                        : "text-white/50 hover:text-white border border-transparent hover:border-white/10"
                      }`}>
                    {t.label}
                  </Link>
                );
              })}
            </div>

            {/* Right — desktop */}
            <div className="hidden md:flex items-center gap-2">
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover ring-1 ring-violet-500/30" />
                : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}>
                    {name[0].toUpperCase()}
                  </div>
              }
              <span className="text-sm text-white/60 mr-1">{name}</span>

              {/* Profile button */}
              <button type="button" onClick={() => setProfileOpen(true)}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded-md transition-all">
                <PersonIcon size={13} />
                Profile
              </button>

              <button type="button" onClick={signOut}
                className="text-xs text-white hover:text-white/70 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-md transition-colors">
                Sign out
              </button>
            </div>

            {/* Mobile toggle */}
            <button type="button" className="md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50"
            style={{ animation: "slideDown 0.25s ease-out" }}>
            <div className="px-6 py-4 flex flex-col gap-1">
              {allTabs.map(t => {
                const active = pathname === t.href;
                return (
                  <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${active ? "bg-violet-500/15 text-violet-300" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                    {t.label}
                  </Link>
                );
              })}
              <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}>{name[0]}</div>
                  }
                  <span className="text-sm text-white/60">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
                    className="text-xs text-white/40 hover:text-white transition-colors">Profile</button>
                  <button type="button" onClick={signOut}
                    className="text-xs text-white/30 hover:text-white/70 transition-colors">Sign out</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Onboarding modal — first login only */}
      {showOnboarding && user && (
        <OnboardingModal userId={user.id} onDone={() => {
          setShowOnboarding(false);
          // Re-fetch profile so nav shows updated name/avatar
          supabase.from("users").select("*").eq("id", user.id).single()
            .then(({ data }) => { if (data) setMyProfile(data as UserProfile); });
        }} />
      )}

      {/* Profile panel */}
      {profileOpen && user && (
        <ProfilePanel userId={user.id} onClose={() => setProfileOpen(false)} />
      )}
    </>
  );
}
