import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, Star, LogOut, Sprout } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-sidebar">
        <div className="flex items-center gap-2 px-6 pt-6">
          <Sprout className="text-lavender" size={26} />
          <span className="font-serif text-2xl font-semibold text-white">Connectly</span>
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
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-line bg-topbar px-8">
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink">
              {getGreeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-ink/70">Let's keep your connections strong.</p>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="min-w-0 flex-1 p-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}