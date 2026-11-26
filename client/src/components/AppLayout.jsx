import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, Star, Trash2, LogOut, Sprout, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";


const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    active: (p) => p === "/dashboard",
  },
  {
    to: "/contacts",
    label: "Contacts",
    icon: Users,
    active: (p, fav) =>
      (p === "/contacts" && !fav) || (p.startsWith("/contacts/") && p !== "/contacts/new"),
  },
  {
    to: "/contacts/new",
    label: "Add Contact",
    icon: UserPlus,
    active: (p) => p === "/contacts/new",
  },
  {
    to: "/contacts?view=favourites",
    label: "Favourites",
    icon: Star,
    active: (p, fav) => p === "/contacts" && fav,
  },
  {
    to: "/trash",
    label: "Trash",
    icon: Trash2,
    active: (p) => p === "/trash",
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isFavView = new URLSearchParams(search).get("view") === "favourites";
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-page">
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <Sprout className="text-lavender" size={26} />
            <span className="font-serif text-2xl font-semibold text-white">Connectly</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="text-white/70 hover:text-white lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col items-center border-b border-white/10 px-6 pb-6 pt-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender text-2xl font-semibold text-accent">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-3 text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/60">{user.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            Overview
          </p>
          <div className="space-y-1">
            {links.map(({ to, label, icon: Icon, active }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active(pathname, isFavView)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-topbar px-4 sm:h-20 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-ink hover:bg-white/60 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-lg font-semibold text-ink sm:text-xl">
                {getGreeting()}, {user.name.split(" ")[0]}
              </h1>
              <p className="hidden text-sm text-ink/70 sm:block">Let's keep your connections strong.</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />
            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 pb-16 sm:p-8 sm:pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}