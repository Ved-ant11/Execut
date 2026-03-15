import Link from "next/link";
import NavAuth from "./NavAuth";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-12 border-b border-neutral-800/60 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-8">

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-sans text-[15px] font-bold tracking-[-0.04em] text-white"
          >
            Execut<span className="text-neutral-600">.</span>
          </Link>

          <div className="h-3.5 w-px bg-neutral-800" />

          <div className="flex items-center gap-5">
            {[
              { label: "Problems",    href: "/problems"    },
              { label: "Contribute",  href: "/contribute"  },
              { label: "Leaderboard", href: "/leaderboard" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-600 hover:text-neutral-300 transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/battle"
              className="font-mono-custom text-[10px] tracking-[0.18em] uppercase text-neutral-300 hover:text-white transition-colors duration-200 border border-neutral-700 hover:border-neutral-500 rounded-full px-3 py-0.5"
            >
              Match
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavAuth />
        </div>
      </div>
    </nav>
  );
}