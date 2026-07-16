"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: "◆" },
  { href: "/contacts", label: "Contacts", icon: "◈" },
  { href: "/calls", label: "Calls", icon: "☎" },
  { href: "/appointments", label: "Appointments", icon: "◷" },
  { href: "/availability", label: "Availability", icon: "▦" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-base-700 bg-base-900/60 backdrop-blur-xl">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-glow flex items-center justify-center">
          <span className="text-white font-extrabold">D</span>
        </div>
        <div>
          <div className="text-white font-bold leading-tight">DevClan</div>
          <div className="text-base-500 text-xs leading-tight">AI Calling</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-500/15 text-white border border-accent-500/30"
                  : "text-base-500 hover:text-white hover:bg-base-800"
              }`}
            >
              <span className={`text-base ${active ? "text-accent-400" : ""}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-base-700">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-base-500 hover:text-coral-400 hover:bg-base-800 transition-colors"
        >
          ⏻ Sign out
        </button>
      </div>
    </aside>
  );
}
