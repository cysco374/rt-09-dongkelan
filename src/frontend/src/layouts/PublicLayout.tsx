import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { Bell, ConciergeBell, Home, LogIn, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Beranda", to: "/", icon: Home, ocid: "nav.home_link" },
  {
    label: "Pengumuman",
    to: "/pengumuman",
    icon: Bell,
    ocid: "nav.pengumuman_link",
  },
  {
    label: "Layanan Warga",
    to: "/layanan",
    icon: ConciergeBell,
    ocid: "nav.layanan_link",
  },
];

export default function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close menu on route change
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-card/90 backdrop-blur-xl border-b border-border shadow-xs"
            : "bg-card/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-3 group"
              data-ocid="nav.logo_link"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-primary-foreground font-bricolage font-bold shadow-card transition-transform group-hover:rotate-[-4deg] group-hover:scale-105">
                09
              </div>
              <div className="hidden sm:block">
                <div className="font-bricolage font-bold text-foreground leading-tight">
                  RT 09 Dongkelan
                </div>
                <div className="text-muted-foreground text-xs">
                  Sistem Informasi Warga
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-ocid={item.ocid}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground/80 hover:bg-secondary hover:text-secondary-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="ml-2 rounded-full"
              >
                <Link to="/login" data-ocid="nav.login_link">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Admin
                </Link>
              </Button>
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card overflow-hidden"
            >
              <nav className="container px-4 py-3 flex flex-col gap-1">
                {[
                  ...navItems,
                  {
                    label: "Login Admin",
                    to: "/login",
                    icon: LogIn,
                    ocid: "nav.login_link",
                  },
                ].map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      data-ocid={`${item.ocid}.mobile`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="hero-mesh text-sidebar-foreground mt-16">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bricolage font-bold">
                  09
                </div>
                <div>
                  <div className="font-bricolage font-bold text-lg text-white">
                    RT 09 Dongkelan
                  </div>
                  <div className="text-white/60 text-xs">Kampung Dongkelan</div>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Melayani warga dengan transparan, cepat, dan penuh kebersamaan.
              </p>
            </div>
            <div>
              <h4 className="font-bricolage font-semibold mb-3 text-xs uppercase tracking-[0.18em] text-white/50">
                Navigasi
              </h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bricolage font-semibold mb-3 text-xs uppercase tracking-[0.18em] text-white/50">
                Kontak
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                Kampung Dongkelan, RT 09
                <br />
                Yogyakarta, DIY
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/50">
            © {new Date().getFullYear()} RT 09 Dongkelan. Dibuat dengan ❤️ untuk
            warga.
          </div>
        </div>
      </footer>
    </div>
  );
}
