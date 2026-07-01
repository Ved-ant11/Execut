"use client";
import Link from "next/link";
import NavAuth from "./NavAuth";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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
              { label: "Practice",    href: "/practice"    },
              { label: "Leaderboard", href: "/leaderboard" },
              { label: "Rooms",       href: "/rooms"       },
              { label: "Feedback",    href: "/feedback"    },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`font-mono-custom text-[10px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                  isActive(l.href)
                    ? "text-neutral-100 border-b border-neutral-500 pb-px"
                    : "text-neutral-600 hover:text-neutral-300"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/battle"
              className={`font-mono-custom text-[10px] tracking-[0.18em] uppercase transition-colors duration-200 border rounded-full px-3 py-0.5 ${
                isActive("/battle")
                  ? "text-white border-neutral-400 bg-neutral-800/60"
                  : "text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-500"
              }`}
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