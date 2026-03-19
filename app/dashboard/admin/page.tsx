"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CARD, SECTION_LABEL, GRADIENT_TEXT } from "@/lib/styles";
import type { UserProfile } from "@/lib/types";
import { displayName } from "@/lib/types";

type Status = "pending" | "approved" | "rejected";

function Avatar({ user, size = 36 }: { user: UserProfile; size?: number }) {
  return user.avatar_url ? (
    <img src={user.avatar_url} alt="" className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {(displayName(user))[0].toUpperCase()}
    </div>
  );
}

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  approved: { label: "Approved", className: "text-green-400 bg-green-400/10 border-green-400/20" },
  rejected: { label: "Rejected", className: "text-red-400  bg-red-400/10  border-red-400/20"  },
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("created_at");
    setMembers((data as UserProfile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("is_admin").eq("id", user.id).single()
      .then(({ data }) => {
        if (!data?.is_admin) { router.replace("/dashboard"); return; }
        setIsAdmin(true);
        fetchMembers();
      });
  }, [user, router, fetchMembers]);

  const setStatus = async (userId: string, status: Status) => {
    setUpdating(userId);
    await supabase.from("users").update({ status }).eq("id", userId);
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, status } : m));
    setUpdating(null);
  };

  const toggleAdmin = async (userId: string, current: boolean) => {
    setUpdating(userId);
    await supabase.from("users").update({ is_admin: !current }).eq("id", userId);
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_admin: !current } : m));
    setUpdating(null);
  };

  if (!isAdmin && !loading) return null;

  const pending  = members.filter(m => m.status === "pending");
  const approved = members.filter(m => m.status === "approved");
  const rejected = members.filter(m => m.status === "rejected");

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 flex flex-col gap-6"
      style={{ animation: "fadeIn 0.5s ease-out" }}>
      <div>
        <h1 className="text-3xl font-bold" style={GRADIENT_TEXT}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Manage member access requests</p>
      </div>

      {loading ? (
        <div className={`${CARD} p-6 flex items-center justify-center`}>
          <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending requests */}
          {pending.length > 0 && (
            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className={SECTION_LABEL}>Pending Requests ({pending.length})</span>
              </div>
              <div className="flex flex-col gap-3">
                {pending.map(m => (
                  <MemberRow key={m.id} member={m} updating={updating === m.id}
                    onApprove={() => setStatus(m.id, "approved")}
                    onReject={() => setStatus(m.id, "rejected")}
                    onToggleAdmin={() => toggleAdmin(m.id, m.is_admin)}
                    isSelf={m.id === user?.id} />
                ))}
              </div>
            </section>
          )}

          {pending.length === 0 && (
            <div className={`${CARD} p-6 text-center`}>
              <p className="text-sm" style={{ color: "#4b5563" }}>No pending requests</p>
            </div>
          )}

          {/* Approved members */}
          <section className={`${CARD} p-6`}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className={SECTION_LABEL}>Approved Members ({approved.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {approved.map(m => (
                <MemberRow key={m.id} member={m} updating={updating === m.id}
                  onApprove={() => setStatus(m.id, "approved")}
                  onReject={() => setStatus(m.id, "rejected")}
                  onToggleAdmin={() => toggleAdmin(m.id, m.is_admin)}
                  isSelf={m.id === user?.id} />
              ))}
            </div>
          </section>

          {/* Rejected members */}
          {rejected.length > 0 && (
            <section className={`${CARD} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className={SECTION_LABEL}>Rejected ({rejected.length})</span>
              </div>
              <div className="flex flex-col gap-3">
                {rejected.map(m => (
                  <MemberRow key={m.id} member={m} updating={updating === m.id}
                    onApprove={() => setStatus(m.id, "approved")}
                    onReject={() => setStatus(m.id, "rejected")}
                    onToggleAdmin={() => toggleAdmin(m.id, m.is_admin)}
                    isSelf={m.id === user?.id} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MemberRow({ member: m, updating, onApprove, onReject, onToggleAdmin, isSelf }: {
  member: UserProfile;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleAdmin: () => void;
  isSelf: boolean;
}) {
  const badge = STATUS_BADGE[m.status];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-800/60 bg-gray-800/20 px-4 py-3">
      <Avatar user={m} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white truncate">{displayName(m)}</p>
          {isSelf && <span className="text-[9px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full border border-violet-400/20">Me</span>}
          {m.is_admin && <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">Admin</span>}
        </div>
        <p className="text-xs truncate" style={{ color: "#6b7280" }}>{m.email}</p>
      </div>

      {/* Status badge */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badge.className}`}>
        {badge.label}
      </span>

      {/* Actions */}
      {!isSelf && (
        <div className="flex items-center gap-1.5 shrink-0">
          {updating ? (
            <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          ) : (
            <>
              {m.status !== "approved" && (
                <button type="button" onClick={onApprove}
                  className="text-[10px] font-bold text-green-400 border border-green-400/20 bg-green-400/5 hover:bg-green-400/15 px-2 py-1 rounded-lg transition-colors">
                  Approve
                </button>
              )}
              {m.status !== "rejected" && (
                <button type="button" onClick={onReject}
                  className="text-[10px] font-bold text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 px-2 py-1 rounded-lg transition-colors">
                  Reject
                </button>
              )}
              <button type="button" onClick={onToggleAdmin}
                className="text-[10px] font-bold text-gray-400 border border-gray-700/60 bg-gray-800/30 hover:bg-gray-700/30 px-2 py-1 rounded-lg transition-colors">
                {m.is_admin ? "−Admin" : "+Admin"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
