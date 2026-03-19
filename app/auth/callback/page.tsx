"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/auth");
      }
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"
          aria-label="Loading"
        />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </main>
  );
}
