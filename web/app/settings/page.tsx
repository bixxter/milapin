"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/settings/api-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.apiKey) setApiKey(data.apiKey);
      })
      .catch(console.error);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerate your API key? The old key will stop working immediately.")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/api-key", { method: "POST" });
      const data = await res.json();
      if (data.apiKey) setApiKey(data.apiKey);
    } finally {
      setRegenerating(false);
    }
  };

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Back to board
          </Link>
        </div>

        {/* User Info */}
        <section className="mb-8 p-5 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)]">
          <h2 className="text-sm font-medium mb-4 text-[var(--color-text-secondary)] uppercase tracking-wider">
            Account
          </h2>
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-12 h-12 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">{session?.user?.email}</p>
            </div>
          </div>
        </section>

        {/* API Key */}
        <section className="mb-8 p-5 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)]">
          <h2 className="text-sm font-medium mb-4 text-[var(--color-text-secondary)] uppercase tracking-wider">
            API Key
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
            Use this key in the Chrome extension and any API integrations.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] text-sm font-mono text-[var(--color-text-secondary)] truncate">
              {apiKey || "Loading..."}
            </code>
            <button
              onClick={handleCopy}
              disabled={!apiKey}
              className="px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-3)] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-pin-rose)] transition-colors"
          >
            {regenerating ? "Regenerating..." : "Regenerate key"}
          </button>
        </section>

        {/* Extension Setup */}
        <section className="p-5 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)]">
          <h2 className="text-sm font-medium mb-4 text-[var(--color-text-secondary)] uppercase tracking-wider">
            Chrome Extension Setup
          </h2>
          <ol className="text-sm text-[var(--color-text-tertiary)] space-y-2 list-decimal list-inside">
            <li>Install the Milapin Chrome extension</li>
            <li>Click the extension icon and go to Options</li>
            <li>Paste your API key and set the backend URL</li>
            <li>Browse Pinterest and click &ldquo;Grab&rdquo; on any pin</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
