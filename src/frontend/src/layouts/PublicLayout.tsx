import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Home, LogIn, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const navItems = [
  { label: "Beranda", to: "/", icon: Home, ocid: "nav.home_link" },
  {
    label: "Pengumuman",
    to: "/pengumuman",
    icon: Bell,
    ocid: "nav.pengumuman_link",
  },
  { label: "Login Admin", to: "/login", icon: LogIn, ocid: "nav.login_link" },
];

export default function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Name */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              data-ocid="nav.home_link"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bricolage font-bold text-lg shadow-xs transition-transform group-hover:scale-105">
                RT
              </div>
              <div className="hidden sm:block">
                <div className="font-bricolage font-bold text-foreground text-sm leading-tight">
                  RT 09 Dongkelan
                </div>
                <div className="text-muted-foreground text-xs">
                  Kampung Dongkelan
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-ocid={item.ocid}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-secondary hover:text-secondary-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Toggle */}
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

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card"
            >
              <nav className="container px-4 py-3 flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      data-ocid={item.ocid}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
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

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-10 mt-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bricolage font-bold text-lg">
                  RT
                </div>
                <div>
                  <div className="font-bricolage font-bold text-lg">
                    RT 09 Dongkelan
                  </div>
                  <div className="text-sidebar-foreground/70 text-xs">
                    Kampung Dongkelan
                  </div>
                </div>
              </div>
              <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
                Melayani warga dengan sepenuh hati untuk kampung yang lebih
                baik.
              </p>
            </div>
            <div>
              <h4 className="font-bricolage font-semibold mb-3 text-sm uppercase tracking-wider text-sidebar-foreground/60">
                Navigasi
              </h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bricolage font-semibold mb-3 text-sm uppercase tracking-wider text-sidebar-foreground/60">
                Kontak
              </h4>
              <p className="text-sm text-sidebar-foreground/80 leading-relaxed">
                Kampung Dongkelan, RT 09
                <br />
                Yogyakarta, DIY
              </p>
            </div>
          </div>
          <div className="border-t border-sidebar-border mt-8 pt-6 text-center text-xs text-sidebar-foreground/50">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sidebar-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
