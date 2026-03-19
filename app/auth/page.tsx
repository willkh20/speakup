"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const ArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function useIsInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsInApp(/KAKAOTALK|Instagram|NAVER|Line|FB_IAB|FB4A|FBAN|Twitter/i.test(ua));
  }, []);
  return isInApp;
}

export default function AuthPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const isInApp = useIsInAppBrowser();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Go Back */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft />
        Go Back
      </Link>

      <div
        className="relative w-full max-w-sm flex flex-col items-center"
        style={{ animation: "fadeIn 0.5s ease-out" }}
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="text-4xl font-bold text-white tracking-tight">Speak Up</span>
          <p className="mt-1 text-sm text-gray-500 tracking-widest uppercase">Where We Grow</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md px-8 py-10 flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-sm text-gray-400">
              Sign in to keep up with your group&apos;s progress
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-800" />

          {/* In-app browser warning */}
          {isInApp && (
            <div className="w-full rounded-xl border border-amber-400/30 bg-amber-400/8 px-4 py-3 flex flex-col gap-1.5">
              <p className="text-xs font-bold text-amber-400">⚠️ 앱 내 브라우저 감지</p>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                카카오톡·인스타그램 등 앱 내 브라우저에서는 Google 로그인이 차단됩니다.
              </p>
              <p className="text-xs font-semibold text-white mt-0.5">
                링크를 복사해서 <span className="text-amber-400">Chrome / Safari</span> 에서 열어주세요.
              </p>
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-700/60 active:scale-95 transition-all px-4 py-3 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-gray-600 text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
