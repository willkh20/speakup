"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardNav from "@/components/dashboard/DashboardNav";

type ApprovalStatus = "loading" | "approved" | "pending" | "rejected";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalStatus>("loading");

  useEffect(() => {
    if (!loading && !user) { router.replace("/auth"); return; }
    if (!user) return;
    supabase.from("users").select("status").eq("id", user.id).single()
      .then(({ data }) => {
        if (!data) { setApproval("pending"); return; }
        setApproval((data as { status: ApprovalStatus }).status ?? "pending");
      });
  }, [user, loading, router]);

  if (loading || !user || approval === "loading") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </main>
    );
  }

  if (approval === "pending") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'); * { font-family: 'Poppins', sans-serif; }`}</style>
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div>
            <span className="text-4xl font-bold text-white tracking-tight">Speak Up</span>
            <p className="mt-1 text-sm text-gray-500 tracking-widest uppercase">Where We Grow</p>
          </div>
          <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md px-8 py-10 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center text-2xl">⏳</div>
            <div>
              <h1 className="text-lg font-bold text-white mb-2">Awaiting Approval</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your account is pending admin approval.<br />
                You&apos;ll be notified once access is granted.
              </p>
            </div>
            <div className="w-full h-px bg-gray-800" />
            <p className="text-xs text-gray-600">{user.email}</p>
            <button type="button" onClick={signOut}
              className="text-xs text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg">
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (approval === "rejected") {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'); * { font-family: 'Poppins', sans-serif; }`}</style>
        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div>
            <span className="text-4xl font-bold text-white tracking-tight">Speak Up</span>
          </div>
          <div className="w-full rounded-2xl border border-red-900/40 bg-gray-900/60 backdrop-blur-md px-8 py-10 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border border-red-400/30 bg-red-400/10 flex items-center justify-center text-2xl">🚫</div>
            <div>
              <h1 className="text-lg font-bold text-white mb-2">Access Denied</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your access request was not approved.<br />
                Contact the group admin for assistance.
              </p>
            </div>
            <div className="w-full h-px bg-gray-800" />
            <p className="text-xs text-gray-600">{user.email}</p>
            <button type="button" onClick={signOut}
              className="text-xs text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg">
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap');
        * { font-family: 'Poppins', sans-serif; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      <DashboardNav />
      <div className="relative">{children}</div>
    </div>
  );
}
