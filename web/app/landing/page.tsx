"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Pin card data ────────────────────────────────────────────────────────────
const HERO_PINS = [
  {
    id: 1,
    color: "from-rose-500/30 to-rose-900/10",
    border: "#f43f5e40",
    glow: "#f43f5e",
    tag: "Inspiration",
    w: 180,
    h: 240,
    x: 0,
    y: 20,
    rotate: -3,
    delay: "0s",
  },
  {
    id: 2,
    color: "from-indigo-500/30 to-indigo-900/10",
    border: "#6366f140",
    glow: "#6366f1",
    tag: "Design",
    w: 200,
    h: 160,
    x: 200,
    y: 0,
    rotate: 2,
    delay: "0.15s",
  },
  {
    id: 3,
    color: "from-amber-500/30 to-amber-900/10",
    border: "#f59e0b40",
    glow: "#f59e0b",
    tag: "Architecture",
    w: 180,
    h: 240,
    x: 480,
    y: 30,
    rotate: -1.5,
    delay: "0.3s",
  },
  {
    id: 4,
    color: "from-emerald-500/30 to-emerald-900/10",
    border: "#10b98140",
    glow: "#10b981",
    tag: "Nature",
    w: 200,
    h: 150,
    x: 220,
    y: 200,
    rotate: 1,
    delay: "0.45s",
  },
  {
    id: 5,
    color: "from-violet-500/30 to-violet-900/10",
    border: "#8b5cf640",
    glow: "#8b5cf6",
    tag: "Typography",
    w: 170,
    h: 110,
    x: 0,
    y: 300,
    rotate: 2.5,
    delay: "0.6s",
  },
  {
    id: 6,
    color: "from-sky-500/30 to-sky-900/10",
    border: "#0ea5e940",
    glow: "#0ea5e9",
    tag: "Motion",
    w: 185,
    h: 140,
    x: 480,
    y: 295,
    rotate: -2,
    delay: "0.75s",
  },
];

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    ),
    label: "Save from Pinterest",
    desc: "Hover any Pinterest pin — a save button appears. One click and it lands on your board. Images, GIFs, videos.",
    accent: "#6366f1",
    muted: "#6366f115",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    label: "Upload your own files",
    desc: "Not just Pinterest. Drag and drop your own images, GIFs, and videos straight onto the canvas from your device.",
    accent: "#f43f5e",
    muted: "#f43f5e15",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: "Infinite canvas",
    desc: "A boundless visual workspace. Drag, resize, and arrange everything exactly the way you think. No grid limits.",
    accent: "#f59e0b",
    muted: "#f59e0b15",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    label: "Cloud sync",
    desc: "Your boards live in the cloud. Open from any device, pick up exactly where you left off. Nothing gets lost.",
    accent: "#10b981",
    muted: "#10b98115",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create an account",
    desc: "Sign up for free at board.bixxter.com. Install the Chrome extension and paste your API token — takes under a minute.",
    color: "#6366f1",
  },
  {
    num: "02",
    title: "Collect from anywhere",
    desc: "Save pins from Pinterest with one click, or upload your own images, GIFs, and videos. Everything goes to your board.",
    color: "#f43f5e",
  },
  {
    num: "03",
    title: "Arrange & explore",
    desc: "Open your canvas and build your visual world. Drag, resize, group — see your whole collection at a glance.",
    color: "#10b981",
  },
];

const STATS = [
  { value: "50K+", label: "Media saved" },
  { value: "2,400+", label: "Creators" },
  { value: "4.9★", label: "Chrome Web Store" },
  { value: "∞", label: "Canvas space" },
];

// ─── Floating pin card (hero mock) ────────────────────────────────────────────
function HeroPin({
  pin,
  visible,
}: {
  pin: (typeof HERO_PINS)[0];
  visible: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: pin.x,
        top: pin.y,
        width: pin.w,
        height: pin.h,
        transform: `rotate(${pin.rotate}deg) translateY(${visible ? "0" : "24px"})`,
        opacity: visible ? 1 : 0,
        transition: `opacity 0.7s ease ${pin.delay}, transform 0.7s ease ${pin.delay}`,
        animationDelay: pin.delay,
      }}
    >
      {/* Card */}
      <div
        className={`w-full h-full rounded-2xl bg-gradient-to-br ${pin.color} relative overflow-hidden`}
        style={{
          border: `1px solid ${pin.border}`,
          boxShadow: `0 0 30px ${pin.glow}20, inset 0 1px 0 ${pin.border}`,
          animation: `heroPinFloat${pin.id} ${3 + pin.id * 0.4}s ease-in-out infinite`,
        }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Shimmer lines */}
        <div
          className="absolute inset-x-4 top-4 h-2 rounded-full opacity-30"
          style={{ background: `linear-gradient(90deg, ${pin.glow}60, transparent)` }}
        />
        <div
          className="absolute inset-x-6 top-8 h-1.5 rounded-full opacity-20"
          style={{ background: `linear-gradient(90deg, ${pin.glow}40, transparent)` }}
        />
        {/* Bottom tag */}
        <div
          className="absolute bottom-3 left-3 right-3 flex items-center justify-between"
        >
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${pin.glow}25`,
              color: pin.glow,
              border: `1px solid ${pin.glow}30`,
            }}
          >
            {pin.tag}
          </span>
          {/* Save button mock */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: pin.glow, boxShadow: `0 0 12px ${pin.glow}60` }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [navVisible, setNavVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const howRef = useRef<HTMLElement>(null);
  const [howInView, setHowInView] = useState(false);

  const featRef = useRef<HTMLElement>(null);
  const [featInView, setFeatInView] = useState(false);

  const statsRef = useRef<HTMLElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  const ctaRef = useRef<HTMLElement>(null);
  const [ctaInView, setCtaInView] = useState(false);

  // Navbar scroll listener
  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Section IntersectionObservers
  useEffect(() => {
    const sections = [
      { el: howRef.current, setter: setHowInView },
      { el: featRef.current, setter: setFeatInView },
      { el: statsRef.current, setter: setStatsInView },
      { el: ctaRef.current, setter: setCtaInView },
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const match = sections.find((s) => s.el === e.target);
          if (match && e.isIntersecting) {
            match.setter(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach((s) => s.el && obs.observe(s.el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ── Global overrides for this page ── */}
      <style>{`
        html, body {
          overflow: auto !important;
          height: auto !important;
        }

        /* Floating keyframes for hero pins */
        @keyframes heroPinFloat1 { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-10px)} }
        @keyframes heroPinFloat2 { 0%,100%{transform:rotate(2deg) translateY(0)} 50%{transform:rotate(2deg) translateY(-8px)} }
        @keyframes heroPinFloat3 { 0%,100%{transform:rotate(-1.5deg) translateY(0)} 50%{transform:rotate(-1.5deg) translateY(-12px)} }
        @keyframes heroPinFloat4 { 0%,100%{transform:rotate(1deg) translateY(0)} 50%{transform:rotate(1deg) translateY(-7px)} }
        @keyframes heroPinFloat5 { 0%,100%{transform:rotate(2.5deg) translateY(0)} 50%{transform:rotate(2.5deg) translateY(-9px)} }
        @keyframes heroPinFloat6 { 0%,100%{transform:rotate(-2deg) translateY(0)} 50%{transform:rotate(-2deg) translateY(-11px)} }

        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.08); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-50px, 20px) scale(1.1); }
          66%       { transform: translate(30px, -40px) scale(0.92); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(25px, 35px) scale(1.05); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .shine-text {
          background: linear-gradient(
            105deg,
            #e8e8ed 30%,
            #ffffff 50%,
            #e8e8ed 70%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .accent-gradient-text {
          background: linear-gradient(135deg, #6366f1, #818cf8, #a78bfa);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 6s ease infinite;
        }

        .cta-btn {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          background-size: 200% 200%;
          transition: all 0.3s ease;
          animation: gradientShift 4s ease infinite;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px #6366f160;
        }

        .feature-card {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
        }

        .step-line::after {
          content: '';
          position: absolute;
          left: 20px;
          top: 48px;
          bottom: -24px;
          width: 1px;
          background: linear-gradient(to bottom, var(--step-color), transparent);
          opacity: 0.3;
        }

        .canvas-mock-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* ── Milapin AI teaser ── */
        @keyframes particleDrift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-120px) translateX(20px); opacity: 0; }
        }
        @keyframes particleDrift2 {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          15%  { opacity: 0.8; }
          85%  { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(-15px); opacity: 0; }
        }
        @keyframes particleDrift3 {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-80px) translateX(30px); opacity: 0; }
        }
        @keyframes noiseShift {
          0%   { background-position: 0 0; }
          100% { background-position: 200px 200px; }
        }
        @keyframes aiGlowPulse {
          0%, 100% { opacity: 0.04; filter: blur(80px); }
          50%       { opacity: 0.08; filter: blur(60px); }
        }
      `}</style>

      {/* ── Frosted navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: navVisible ? "rgba(10,10,11,0.85)" : "transparent",
          backdropFilter: navVisible ? "blur(20px) saturate(180%)" : "none",
          borderBottom: navVisible ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          transform: "translateZ(0)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-10 lg:px-16 xl:px-24 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                boxShadow: "0 0 16px #6366f160",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="8" rx="1.5" fill="white" opacity="0.9" />
                <rect x="9" y="1" width="6" height="5" rx="1.5" fill="white" opacity="0.6" />
                <rect x="9" y="8" width="6" height="7" rx="1.5" fill="white" opacity="0.75" />
                <rect x="1" y="11" width="6" height="4" rx="1.5" fill="white" opacity="0.5" />
              </svg>
            </div>
            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: "#e8e8ed" }}
            >
              milapin
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["How it works", "Features", "Pricing"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-sm transition-colors duration-200"
                style={{ color: "#8b8b9e" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#e8e8ed")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#8b8b9e")
                }
              >
                {l}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="cta-btn text-white text-sm font-medium px-4 py-2 rounded-lg"
            style={{ boxShadow: "0 4px 20px #6366f140" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Page wrapper ── */}
      <main
        className="min-h-screen"
        style={{ background: "var(--color-surface-0)", color: "var(--color-text-primary)", overflowY: "auto", height: "100vh" }}
      >
        {/* ════════════════════════════════
            HERO
        ════════════════════════════════ */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-32"
          style={{ scrollSnapAlign: "none" }}
        >
          {/* Background orbs */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "10%",
              left: "20%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, #6366f130 0%, transparent 70%)",
              filter: "blur(60px)",
              animation: "orb1 14s ease-in-out infinite",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "15%",
              right: "15%",
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "radial-gradient(circle, #f43f5e20 0%, transparent 70%)",
              filter: "blur(70px)",
              animation: "orb2 18s ease-in-out infinite",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "40%",
              right: "30%",
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "radial-gradient(circle, #f59e0b18 0%, transparent 70%)",
              filter: "blur(50px)",
              animation: "orb3 22s ease-in-out infinite",
            }}
          />

          {/* Dot grid */}
          <div className="canvas-mock-grid absolute inset-0 pointer-events-none" />

          {/* Vignette edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #0a0a0b 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-10 lg:px-16 xl:px-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-20 xl:gap-28">
            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
                style={{
                  background: "#6366f115",
                  border: "1px solid #6366f130",
                  color: "#818cf8",
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(12px)",
                  transition: "all 0.6s ease 0s",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#6366f1", animation: "glowPulse 2s ease infinite" }}
                />
                Visual board for Pinterest & your files
              </div>

              {/* Headline */}
              <h1
                className="font-semibold leading-[1.05] mb-6"
                style={{
                  fontSize: "clamp(3rem, 6vw, 5.5rem)",
                  letterSpacing: "-0.04em",
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.7s ease 0.1s",
                }}
              >
                <span className="shine-text">All your visuals.</span>
                <br />
                <span className="accent-gradient-text">One canvas.</span>
              </h1>

              {/* Sub */}
              <p
                className="text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0"
                style={{
                  color: "#8b8b9e",
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.7s ease 0.2s",
                }}
              >
                Save pins from Pinterest with one click or upload your own images,
                GIFs, and videos. Arrange everything on an infinite visual canvas —
                drag, resize, group — exactly the way your mind works.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row items-center lg:items-start gap-3"
                style={{
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.7s ease 0.3s",
                }}
              >
                <Link
                  href="/login"
                  className="cta-btn text-white font-semibold px-7 py-3.5 rounded-xl text-sm w-full sm:w-auto text-center"
                  style={{ boxShadow: "0 8px 30px #6366f150" }}
                >
                  Get Started Free
                </Link>
                <a
                  href="#how"
                  className="flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-xl w-full sm:w-auto justify-center"
                  style={{
                    color: "#8b8b9e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#e8e8ed";
                    el.style.borderColor = "rgba(255,255,255,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#8b8b9e";
                    el.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  See how it works
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right — canvas mock */}
            <div
              className="flex-1 relative"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateX(0)" : "translateX(40px)",
                transition: "all 0.9s ease 0.35s",
              }}
            >
              {/* Canvas frame */}
              <div
                className="relative rounded-2xl overflow-hidden canvas-mock-grid"
                style={{
                  width: "100%",
                  maxWidth: 720,
                  height: 480,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#111113",
                  boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* Canvas toolbar mock */}
                <div
                  className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 h-10"
                  style={{
                    background: "rgba(17,17,19,0.9)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="flex gap-1.5">
                    {["#f43f5e", "#f59e0b", "#10b981"].map((c) => (
                      <div
                        key={c}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: c, opacity: 0.7 }}
                      />
                    ))}
                  </div>
                  <div className="flex-1" />
                  <span className="text-xs" style={{ color: "#5a5a6e" }}>
                    board.bixxter.com
                  </span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-5 rounded"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Pin cards on canvas */}
                <div className="absolute inset-0 pt-10">
                  <div className="relative w-full h-full">
                    {HERO_PINS.map((pin) => (
                      <HeroPin key={pin.id} pin={pin} visible={heroVisible} />
                    ))}

                    {/* Connection lines between pins (decorative) */}
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      style={{ width: "100%", height: "100%", opacity: 0.15 }}
                    >
                      <line x1="90" y1="140" x2="220" y2="80" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="320" y1="80" x2="480" y2="140" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="220" y1="280" x2="90" y2="340" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>

                    {/* Zoom badge */}
                    <div
                      className="absolute bottom-4 right-4 text-xs px-2.5 py-1 rounded-md font-mono"
                      style={{
                        background: "rgba(17,17,19,0.9)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#5a5a6e",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      75%
                    </div>

                    {/* Cursor mock */}
                    <div
                      className="absolute pointer-events-none"
                      style={{ left: 295, top: 175, opacity: heroVisible ? 1 : 0, transition: "opacity 1s ease 1.2s" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M3 3l6 14 2.5-5.5L17 9 3 3z" fill="white" stroke="#0a0a0b" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Glow edge at bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, #111113, transparent)",
                  }}
                />
              </div>

              {/* Floating save-button bubble */}
              <div
                className="absolute flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{
                  top: 80,
                  right: -20,
                  background: "rgba(99,102,241,0.95)",
                  color: "white",
                  boxShadow: "0 8px 32px #6366f170",
                  backdropFilter: "blur(8px)",
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateX(0)" : "translateX(16px)",
                  transition: "all 0.7s ease 0.9s",
                  zIndex: 10,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Saved to board
              </div>

              {/* Stat bubble */}
              <div
                className="absolute flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  bottom: 40,
                  left: -24,
                  background: "rgba(17,17,19,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e8e8ed",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(12px)",
                  opacity: heroVisible ? 1 : 0,
                  transform: heroVisible ? "translateX(0)" : "translateX(-16px)",
                  transition: "all 0.7s ease 1.1s",
                  zIndex: 10,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: "#10b981", animation: "glowPulse 2s ease infinite" }} />
                <span style={{ color: "#8b8b9e" }}>6 pins on canvas</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{
              opacity: heroVisible ? 0.4 : 0,
              transition: "opacity 1s ease 1.5s",
            }}
          >
            <span className="text-xs tracking-widest uppercase" style={{ color: "#5a5a6e" }}>
              scroll
            </span>
            <div
              className="w-px h-10"
              style={{
                background: "linear-gradient(to bottom, #5a5a6e, transparent)",
              }}
            />
          </div>
        </section>

        {/* ════════════════════════════════
            PROMO VIDEO
        ════════════════════════════════ */}
        <section className="relative py-24 overflow-hidden">
          {/* bg glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 50%, #6366f10a, transparent 70%)",
            }}
          />

          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
                style={{
                  color: "#6366f1",
                  background: "#6366f110",
                  border: "1px solid #6366f125",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#6366f1", boxShadow: "0 0 6px #6366f1" }}
                />
                See it in action
              </span>
              <h2
                className="font-semibold leading-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                From Pinterest or your device{" "}
                <span style={{ color: "#6366f1" }}>to the canvas in seconds</span>
              </h2>
            </div>

            {/* Video container */}
            <div
              className="relative mx-auto overflow-hidden"
              style={{
                borderRadius: 20,
                border: "1px solid #ffffff12",
                boxShadow: "0 0 80px #6366f110, 0 20px 60px rgba(0,0,0,0.4)",
                aspectRatio: "16 / 9",
                background: "#111113",
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              >
                <source src="/promo.mp4" type="video/mp4" />
              </video>

              {/* Corner frame accent */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: 20,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════ */}
        <section
          id="how"
          ref={howRef as React.RefObject<HTMLElement>}
          className="relative py-32 overflow-hidden"
        >
          {/* bg accent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 0%, #6366f108, transparent 70%)",
            }}
          />

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            {/* Section label */}
            <div
              className="flex items-center gap-3 mb-4"
              style={{
                opacity: howInView ? 1 : 0,
                transform: howInView ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0s",
              }}
            >
              <div className="h-px flex-1 max-w-12" style={{ background: "linear-gradient(to right, transparent, #6366f1)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "#6366f1" }}>
                How it works
              </span>
            </div>

            <h2
              className="font-semibold leading-tight mb-16"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                letterSpacing: "-0.03em",
                opacity: howInView ? 1 : 0,
                transform: howInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease 0.1s",
              }}
            >
              Three steps.<br />
              <span className="accent-gradient-text">Then you're building.</span>
            </h2>

            <div className="flex flex-col gap-0">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="relative flex items-start gap-6 pb-12 step-line"
                  style={
                    {
                      "--step-color": step.color,
                      opacity: howInView ? 1 : 0,
                      transform: howInView ? "translateX(0)" : "translateX(-24px)",
                      transition: `all 0.6s ease ${0.2 + i * 0.15}s`,
                    } as React.CSSProperties
                  }
                >
                  {/* Number circle */}
                  <div
                    className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-semibold"
                    style={{
                      background: `${step.color}20`,
                      border: `1px solid ${step.color}40`,
                      color: step.color,
                    }}
                  >
                    {step.num}
                  </div>

                  {/* Text */}
                  <div className="pt-1.5">
                    <h3
                      className="font-semibold mb-2 text-xl"
                      style={{ color: "#e8e8ed", letterSpacing: "-0.02em" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: "#8b8b9e" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            FEATURES
        ════════════════════════════════ */}
        <section
          id="features"
          ref={featRef as React.RefObject<HTMLElement>}
          className="relative py-32 overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 100%, #f43f5e06, transparent 70%)",
            }}
          />

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            {/* Label */}
            <div
              className="flex items-center gap-3 mb-4"
              style={{
                opacity: featInView ? 1 : 0,
                transform: featInView ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0s",
              }}
            >
              <div className="h-px flex-1 max-w-12" style={{ background: "linear-gradient(to right, transparent, #6366f1)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "#6366f1" }}>
                Features
              </span>
            </div>

            <h2
              className="font-semibold leading-tight mb-4"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                letterSpacing: "-0.03em",
                opacity: featInView ? 1 : 0,
                transform: featInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease 0.1s",
              }}
            >
              Everything you need.
              <br />
              <span className="shine-text">Nothing you don't.</span>
            </h2>

            <p
              className="text-lg mb-16 max-w-xl"
              style={{
                color: "#8b8b9e",
                opacity: featInView ? 1 : 0,
                transform: featInView ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.6s ease 0.15s",
              }}
            >
              Pinterest pins, your own uploads, all media types — one workspace
              built for how visual thinkers actually work.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURE_CARDS.map((card, i) => (
                <div
                  key={card.label}
                  className="feature-card rounded-2xl p-6 flex flex-col gap-4"
                  style={{
                    background: `${card.muted}`,
                    border: `1px solid ${card.accent}18`,
                    boxShadow: `0 0 0 0 ${card.accent}00`,
                    opacity: featInView ? 1 : 0,
                    transform: featInView ? "translateY(0)" : "translateY(24px)",
                    transition: `opacity 0.6s ease ${0.2 + i * 0.1}s, transform 0.6s ease ${0.2 + i * 0.1}s, box-shadow 0.3s ease, border-color 0.3s ease`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 0 30px ${card.accent}20, inset 0 1px 0 ${card.accent}20`;
                    el.style.borderColor = `${card.accent}35`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 0 0 0 ${card.accent}00`;
                    el.style.borderColor = `${card.accent}18`;
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${card.accent}18`,
                      color: card.accent,
                      border: `1px solid ${card.accent}25`,
                    }}
                  >
                    {card.icon}
                  </div>

                  <div>
                    <h3
                      className="font-semibold mb-2 text-base"
                      style={{ color: "#e8e8ed", letterSpacing: "-0.01em" }}
                    >
                      {card.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#8b8b9e" }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            STATS / SOCIAL PROOF
        ════════════════════════════════ */}
        <section
          ref={statsRef as React.RefObject<HTMLElement>}
          className="relative py-24 overflow-hidden"
        >
          {/* Divider line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.3), transparent)" }}
          />

          <div className="max-w-5xl mx-auto px-6">
            {/* Testimonial quote */}
            <div
              className="text-center mb-20"
              style={{
                opacity: statsInView ? 1 : 0,
                transform: statsInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.7s ease 0s",
              }}
            >
              <div className="text-4xl mb-6" style={{ color: "#6366f1", opacity: 0.6, lineHeight: 1 }}>&ldquo;</div>
              <p
                className="text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto mb-6"
                style={{ color: "#e8e8ed", letterSpacing: "-0.02em" }}
              >
                I dump Pinterest pins and my own reference photos in one place.
                Seeing them all together on the canvas changed how I plan projects.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ background: "linear-gradient(135deg, #6366f1, #f43f5e)" }}
                />
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: "#e8e8ed" }}>
                    Sofia M.
                  </p>
                  <p className="text-xs" style={{ color: "#5a5a6e" }}>
                    Creative Director
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════
            FINAL CTA
        ════════════════════════════════ */}
        <section
          ref={ctaRef as React.RefObject<HTMLElement>}
          className="relative py-40 overflow-hidden"
        >
          {/* Gradient blob bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, #6366f118 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "20%",
              left: "10%",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, #f43f5e0c, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "10%",
              right: "5%",
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "radial-gradient(circle, #10b9810c, transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          {/* Top border line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.4))",
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            {/* Icon */}
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8 mx-auto"
              style={{
                background: "linear-gradient(135deg, #6366f125, #7c3aed25)",
                border: "1px solid #6366f130",
                boxShadow: "0 0 40px #6366f130",
                opacity: ctaInView ? 1 : 0,
                transform: ctaInView ? "scale(1)" : "scale(0.8)",
                transition: "all 0.6s ease 0s",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>

            <h2
              className="font-semibold leading-[1.05] mb-6"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                letterSpacing: "-0.04em",
                opacity: ctaInView ? 1 : 0,
                transform: ctaInView ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.7s ease 0.1s",
              }}
            >
              <span className="shine-text">Your visual world.</span>
              <br />
              <span className="accent-gradient-text">All in one place.</span>
            </h2>

            <p
              className="text-lg leading-relaxed mb-10 max-w-lg mx-auto"
              style={{
                color: "#8b8b9e",
                opacity: ctaInView ? 1 : 0,
                transform: ctaInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.7s ease 0.2s",
              }}
            >
              Grab pins from Pinterest, upload your own files, arrange them on
              a canvas. Free to start — no credit card needed.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              style={{
                opacity: ctaInView ? 1 : 0,
                transform: ctaInView ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.7s ease 0.3s",
              }}
            >
              <Link
                href="/login"
                className="cta-btn text-white font-semibold px-10 py-4 rounded-xl text-base"
                style={{ boxShadow: "0 12px 40px #6366f155" }}
              >
                Get Started — Free
              </Link>

              {/* Chrome extension icon badge */}
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "#5a5a6e" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="21.17" y1="8" x2="12" y2="8" />
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                </svg>
                Chrome Extension · Free
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            MILAPIN AI — COMING SOON TEASER
        ════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{
            height: 420,
            background: "#08080a",
          }}
        >
          {/* Deep glow behind text */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              width: 600,
              height: 300,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: "radial-gradient(circle, #818cf8, transparent 70%)",
              animation: "aiGlowPulse 6s ease-in-out infinite",
            }}
          />

          {/* The text — barely visible beneath the noise */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
            style={{ zIndex: 1 }}
          >
            <p
              className="font-semibold tracking-tight"
              style={{
                fontSize: "clamp(4rem, 10vw, 9rem)",
                letterSpacing: "-0.05em",
                lineHeight: 0.9,
                color: "#ffffff",
                opacity: 0.04,
                textAlign: "center",
              }}
            >
              milapin ai
            </p>
          </div>

          {/* Dense particle field — obscures the text */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {/* Animated noise texture overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                backgroundSize: "200px 200px",
                opacity: 0.35,
                animation: "noiseShift 20s linear infinite",
                mixBlendMode: "overlay",
              }}
            />

            {/* Particle dots scattered across — using pseudo-random CSS positioning */}
            {Array.from({ length: 60 }).map((_, i) => {
              const left = ((i * 37 + 13) % 100);
              const top = ((i * 53 + 7) % 100);
              const size = (i % 3 === 0) ? 2 : 1;
              const delay = (i * 0.3) % 8;
              const duration = 4 + (i % 5);
              const anim = i % 3 === 0 ? "particleDrift" : i % 3 === 1 ? "particleDrift2" : "particleDrift3";
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    background: i % 4 === 0 ? "#818cf8" : "#ffffff",
                    opacity: 0,
                    animation: `${anim} ${duration}s ease-in-out ${delay}s infinite`,
                  }}
                />
              );
            })}
          </div>

          {/* Top & bottom vignette to blend into page */}
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, #0a0a0b, transparent)", zIndex: 3 }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to top, #0a0a0b, transparent)", zIndex: 3 }}
          />

          {/* "Coming soon" chip — the only readable element */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              zIndex: 4,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#818cf8", boxShadow: "0 0 6px #818cf8", animation: "glowPulse 3s ease infinite" }}
            />
            <span className="text-xs font-medium tracking-wide" style={{ color: "#5a5a6e" }}>
              Coming soon
            </span>
          </div>
        </section>

        {/* ════════════════════════════════
            FOOTER
        ════════════════════════════════ */}
        <footer
          className="relative py-12"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="8" rx="1.5" fill="white" opacity="0.9" />
                  <rect x="9" y="1" width="6" height="5" rx="1.5" fill="white" opacity="0.6" />
                  <rect x="9" y="8" width="6" height="7" rx="1.5" fill="white" opacity="0.75" />
                  <rect x="1" y="11" width="6" height="4" rx="1.5" fill="white" opacity="0.5" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: "#e8e8ed" }}>
                milapin
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 flex-wrap justify-center">
              {[
                ["Privacy", "#"],
                ["Terms", "#"],
                ["Chrome Web Store", "https://chrome.google.com/webstore"],
                ["Sign in", "/login"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm transition-colors duration-200"
                  style={{ color: "#5a5a6e" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#8b8b9e")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#5a5a6e")
                  }
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-sm" style={{ color: "#5a5a6e" }}>
              &copy; {new Date().getFullYear()} milapin
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
