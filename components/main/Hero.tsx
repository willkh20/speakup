"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const DashboardMockup = () => (
  <svg
    viewBox="0 0 900 520"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto rounded-lg"
    style={{ background: "#0d0d0d" }}
  >
    {/* Background */}
    <rect width="900" height="520" fill="#0d0d0d" rx="12" />

    {/* Top bar */}
    <rect width="900" height="48" fill="#161616" rx="0" />
    <rect width="900" height="1" y="48" fill="#2a2a2a" />
    <text x="24" y="30" fill="#ffffff" fontSize="14" fontWeight="600" fontFamily="sans-serif">Speak Up</text>
    {/* Nav dots */}
    <rect x="200" y="18" width="60" height="12" rx="6" fill="#2a2a2a" />
    <rect x="274" y="18" width="60" height="12" rx="6" fill="#2a2a2a" />
    <rect x="348" y="18" width="60" height="12" rx="6" fill="#2a2a2a" />
    {/* Avatar */}
    <circle cx="862" cy="24" r="14" fill="#333" />
    <circle cx="862" cy="20" r="6" fill="#555" />
    <ellipse cx="862" cy="32" rx="9" ry="5" fill="#555" />

    {/* ── LEFT PANEL: Leaderboard ── */}
    <rect x="20" y="68" width="260" height="200" rx="10" fill="#161616" stroke="#2a2a2a" strokeWidth="1" />
    <text x="36" y="94" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">Leaderboard</text>
    <text x="36" y="108" fill="#555" fontSize="9" fontFamily="sans-serif">This Week's Rankings</text>

    {/* Rank rows */}
    {[
      { rank: "1", name: "김민준", score: "5/5", bar: 220, color: "#facc15" },
      { rank: "2", name: "이서연", score: "4/5", bar: 176, color: "#94a3b8" },
      { rank: "3", name: "박지호", score: "3/5", bar: 132, color: "#cd7c3a" },
      { rank: "4", name: "최다은", score: "2/5", bar:  88, color: "#ef4444" },
    ].map((r, i) => (
      <g key={i}>
        <text x="36" y={136 + i * 34} fill={r.color} fontSize="11" fontWeight="700" fontFamily="sans-serif">{r.rank}</text>
        <circle cx="60" cy={128 + i * 34} r="10" fill="#2a2a2a" />
        <text x="76" y={132 + i * 34} fill="#e2e8f0" fontSize="11" fontFamily="sans-serif">{r.name}</text>
        {/* progress bar bg */}
        <rect x="148" y={124 + i * 34} width="110" height="6" rx="3" fill="#2a2a2a" />
        {/* progress bar fill */}
        <rect x="148" y={124 + i * 34} width={r.bar / 2} height="6" rx="3" fill={r.color} opacity="0.8" />
        <text x="264" y={132 + i * 34} fill="#9ca3af" fontSize="9" fontFamily="sans-serif">{r.score}</text>
      </g>
    ))}

    {/* ── CENTER PANEL: Mission Feed ── */}
    <rect x="296" y="68" width="320" height="200" rx="10" fill="#161616" stroke="#2a2a2a" strokeWidth="1" />
    <text x="312" y="94" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">Mission Feed</text>
    <text x="312" y="108" fill="#555" fontSize="9" fontFamily="sans-serif">Recent Submissions</text>

    {[
      { name: "Minjun",  time: "just now",  label: "Day 5 submitted", done: true  },
      { name: "Seoyeon", time: "1 hr ago",  label: "Day 4 submitted", done: true  },
      { name: "Jiho",    time: "3 hrs ago", label: "Day 3 submitted", done: true  },
      { name: "Daeun",   time: "pending",   label: "Day 3 not yet",   done: false },
    ].map((item, i) => (
      <g key={i}>
        <circle cx="322" cy={130 + i * 36} r="10" fill="#2a2a2a" />
        <text x="338" y={134 + i * 36} fill="#e2e8f0" fontSize="11" fontFamily="sans-serif">{item.name}</text>
        <text x="338" y={146 + i * 36} fill="#9ca3af" fontSize="9" fontFamily="sans-serif">{item.label}</text>
        {/* badge */}
        <rect
          x="490" y={120 + i * 36}
          width={item.done ? 48 : 52} height="16" rx="8"
          fill={item.done ? "#16a34a22" : "#ef444422"}
        />
        <text
          x={item.done ? 514 : 516} y={132 + i * 36}
          fill={item.done ? "#4ade80" : "#f87171"}
          fontSize="9" fontFamily="sans-serif" textAnchor="middle"
        >
          {item.done ? "Done" : "Pending"}
        </text>
        <text x="556" y={132 + i * 36} fill="#555" fontSize="9" fontFamily="sans-serif">{item.time}</text>
      </g>
    ))}

    {/* ── RIGHT PANEL: Fine Tracker ── */}
    <rect x="632" y="68" width="248" height="200" rx="10" fill="#161616" stroke="#2a2a2a" strokeWidth="1" />
    <text x="648" y="94" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">Fine Tracker</text>
    <text x="648" y="108" fill="#555" fontSize="9" fontFamily="sans-serif">Missed sessions · stay motivated</text>

    {[
      { name: "Minjun",  fine: "₩0",     color: "#4ade80" },
      { name: "Seoyeon", fine: "₩1,000", color: "#facc15" },
      { name: "Jiho",    fine: "₩2,000", color: "#fb923c" },
      { name: "Daeun",   fine: "₩3,000", color: "#ef4444" },
    ].map((item, i) => (
      <g key={i}>
        <circle cx="660" cy={130 + i * 34} r="10" fill="#2a2a2a" />
        <text x="676" y={134 + i * 34} fill="#e2e8f0" fontSize="11" fontFamily="sans-serif">{item.name}</text>
        <text x="818" y={134 + i * 34} fill={item.color} fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="end">{item.fine}</text>
      </g>
    ))}

    {/* Total fine */}
    <rect x="632" y="248" width="248" height="1" fill="#2a2a2a" />
    <text x="648" y="266" fill="#9ca3af" fontSize="10" fontFamily="sans-serif">Total accumulated fines</text>
    <text x="868" y="266" fill="#ffffff" fontSize="13" fontWeight="700" fontFamily="sans-serif" textAnchor="end">₩6,000</text>

    {/* ── BOTTOM: Video Upload Area ── */}
    <rect x="20" y="284" width="860" height="216" rx="10" fill="#161616" stroke="#2a2a2a" strokeWidth="1" />
    <text x="36" y="310" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">This Week's Videos</text>
    <text x="36" y="324" fill="#555" fontSize="9" fontFamily="sans-serif">Keep the streak alive</text>

    {/* Week progress bar */}
    <text x="720" y="310" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">Weekly progress</text>
    <rect x="720" y="316" width="144" height="6" rx="3" fill="#2a2a2a" />
    <rect x="720" y="316" width="86" height="6" rx="3" fill="#6366f1" />
    <text x="870" y="323" fill="#6366f1" fontSize="9" fontFamily="sans-serif" textAnchor="end">3/5주</text>

    {/* Video cards */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={36 + i * 216} y="338" width="200" height="112" rx="8" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="1" />
        {/* Thumbnail area */}
        <rect x={36 + i * 216} y="338" width="200" height="72" rx="8" fill="#252525" />
        {/* Play button */}
        <circle cx={136 + i * 216} cy="374" r="18" fill="#ffffff11" />
        <polygon
          points={`${128 + i * 216},366 ${128 + i * 216},382 ${148 + i * 216},374`}
          fill="#ffffff66"
        />
        {/* Duration badge */}
        <rect x={180 + i * 216} y="354" width="40" height="14" rx="4" fill="#000000aa" />
        <text x={200 + i * 216} y="364" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
          {["0:42", "1:05", "0:58", "1:12"][i]}
        </text>
        {/* Card info */}
        <text x={48 + i * 216} y="428" fill="#e2e8f0" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          {["Minjun · Day 5", "Seoyeon · Day 4", "Jiho · Day 3", "Seoyeon · Day 3"][i]}
        </text>
        <text x={48 + i * 216} y="442" fill="#555" fontSize="8" fontFamily="sans-serif">
          {["Today 9:12 AM", "Today 11:34 AM", "Yesterday 8:05 PM", "Yesterday 2:47 PM"][i]}
        </text>
      </g>
    ))}
  </svg>
);

const Hero = React.memo(() => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start px-6 py-20 md:py-24"
      style={{ animation: "fadeIn 0.6s ease-out" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Badge */}
      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm max-w-full">
        <span className="text-xs text-center whitespace-nowrap text-gray-400">
          English speaking study, built for your crew
        </span>
        <a
          href="#how-it-works"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-all active:scale-95 whitespace-nowrap"
          aria-label="Learn how it works"
        >
          How it works
          <ArrowRight size={12} />
        </a>
      </aside>

      {/* Headline */}
      <h1
        className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6"
        style={{
          background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.05em",
        }}
      >
        Grow together,
        <br />
        Every single Week
      </h1>

      {/* Sub-description */}
      <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10 text-gray-400">
        Upload your English speaking videos each week and watch the growth.
        <br />
        Track progress, celebrate consistency, and keep each other accountable.
      </p>

      {/* CTA */}
      <div className="flex items-center gap-4 relative z-10 mb-16">
        <Link href="/auth">
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className="rounded-lg"
            aria-label="Get started with Speak Up"
          >
            Get Started
          </Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="rounded-lg"
          aria-label="View leaderboard"
        >
          View Rankings
        </Button>
      </div>

      {/* Dashboard Preview */}
      <div className="w-full max-w-5xl relative pb-20">
        {/* Glow effect */}
        <div
          className="absolute left-1/2 w-[80%] pointer-events-none z-0 blur-3xl opacity-30"
          style={{
            top: "-10%",
            transform: "translateX(-50%)",
            height: "200px",
            background: "radial-gradient(ellipse, #6366f1 0%, #a855f7 50%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-gray-800/60">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
