import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  FolderOpen,
  Heart,
  Search,
  Sparkles,
  Sprout,
  Star,
  Tag,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import heroBg from "../assets/hero-bg.png";

const features = [
  {
    icon: Users,
    title: "Organize Your Contacts",
    text: "Keep all your important people in one place, neatly organized.",
    tint: "bg-primary-soft text-primary-dark",
  },
  {
    icon: Search,
    title: "Smart Search & Filters",
    text: "Find anyone fast by name, email, company or tag.",
    tint: "bg-lavender/60 text-accent",
  },
  {
    icon: Tag,
    title: "Tags & Groups",
    text: "Label contacts as client, recruiter or friend and filter in one click.",
    tint: "bg-primary-soft text-primary-dark",
  },
  {
    icon: Star,
    title: "Favourites",
    text: "Pin the people who matter most so they are always close.",
    tint: "bg-lavender/60 text-accent",
  },
];

const whyCards = [
  {
    icon: FolderOpen,
    title: "One organized space",
    text: "Store names, emails, companies, phone numbers and notes in one place.",
  },
  {
    icon: Tags,
    title: "Smart search & tags",
    text: "Find the right contact without scrolling endlessly.",
  },
  {
    icon: Heart,
    title: "Your favourite people",
    text: "Keep important contacts close at hand.",
  },
];

const steps = [
  { title: "Create your account", text: "Sign up in seconds with your email and a strong password." },
  { title: "Add your contacts", text: "Save names, companies, tags and notes for the people you know." },
  { title: "Search and stay organized", text: "Find anyone instantly and mark your favourites." },
];

export default function Landing() {
  const { user } = useAuth();
     const startLink = user ? "/dashboard" : "/signup";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("revealed", entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-page/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#home" className="flex items-center gap-2">
            <Sprout className="text-primary" size={26} />
            <span className="font-serif text-2xl font-semibold text-primary-dark">Connectly</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#home" className="text-ink hover:text-primary-dark">Home</a>
            <a href="#features" className="hover:text-primary-dark">Features</a>
            <a href="#how" className="hover:text-primary-dark">How It Works</a>
            <a href="#about" className="hover:text-primary-dark">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-sidebar px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open App <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-3 text-sm font-medium text-muted hover:text-ink">
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 rounded-xl bg-sidebar px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Get Started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--color-page) 0%, var(--color-page) 30%, transparent 62%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center px-6 py-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-lavender/60 px-4 py-1.5 text-xs font-medium text-accent">
              <Sparkles size={14} /> Your Contacts · Your Network · Your Growth
            </span>

            <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.1] text-ink lg:text-6xl">
              Manage Your
              <br />
              <span className="text-accent">Contacts Smarter.</span>
            </h1>

            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-ink/80">
              Connectly helps you organize your contacts, search and filter them in seconds, and keep
              your favourite people close, all in one place. Simple, powerful and built for your growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={startLink}
                className="flex items-center gap-2 rounded-xl bg-sidebar px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Get Started Free <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-line bg-white/70 px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-b border-line/60 bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {features.map(({ icon: Icon, title, text, tint }, i) => (
            <div
              key={title}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` }}
              className={`lg:px-8 ${i > 0 ? "lg:border-l lg:border-line" : "lg:pl-0"}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${tint}`}>
                <Icon size={24} />
              </div>
              <h3 className="mt-5 font-serif text-xl font-semibold text-primary-dark">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div data-reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="rounded-full bg-lavender/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent">
                Why Connectly
              </span>
              <h2 className="mt-4 max-w-md font-serif text-4xl font-semibold leading-tight text-primary-dark">
                Everything you need to build <span className="text-accent">lasting connections.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              From students to professionals, Connectly helps you keep contact details organized,
              searchable and easy to manage.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {whyCards.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                data-reveal
                style={{ "--reveal-delay": `${i * 120}ms` }}
                className="rounded-2xl border border-line bg-card p-6 shadow-sm"
              >
                <Icon className="text-primary" size={22} />
                <h3 className="mt-4 font-serif text-xl font-semibold text-primary-dark">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2
            data-reveal
            className="text-center font-serif text-4xl font-semibold text-primary-dark"
          >
            How It Works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
               <div
                key={s.title}
                data-reveal
                style={{ "--reveal-delay": `${i * 150}ms` }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sidebar">
        <div data-reveal className="mx-auto max-w-7xl px-6 py-16 text-center">
          <Sprout className="mx-auto text-lavender" size={28} />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-white">
            Your next connection starts here.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Bring your people together in one thoughtfully organized space.
          </p>
          <Link
            to={startLink}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-lavender px-7 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            {user ? "Open Your Contacts" : "Create Your Account"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <Sprout className="text-primary" size={20} />
            <span className="font-serif text-lg font-semibold text-primary-dark">Connectly</span>
            <span className="ml-3 hidden sm:inline">Connections, thoughtfully organized.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>© {new Date().getFullYear()} Connectly</span>
            <a href="#home" className="hover:text-ink">Home</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <Link to="/login" className="hover:text-ink">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}