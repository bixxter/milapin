import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="h-screen w-screen flex items-center justify-center bg-[var(--color-surface-0)]">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[var(--color-pin-rose)]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            milapin
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Pinterest media canvas board
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-3)] hover:border-[var(--color-border-strong)] transition-all duration-200 text-sm text-[var(--color-text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
