import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { logout as adminLogout, isLoggedIn } from "../hooks/useAdminAuth";

const sidebarItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    ocid: "dashboard.nav_link.home",
  },
  {
    label: "Warga",
    to: "/dashboard/warga",
    icon: Users,
    ocid: "dashboard.nav_link.warga",
  },
  {
    label: "Kartu Keluarga",
    to: "/dashboard/kk",
    icon: CreditCard,
    ocid: "dashboard.nav_link.kk",
  },
  {
    label: "Pengumuman",
    to: "/dashboard/pengumuman",
    icon: Megaphone,
    ocid: "dashboard.nav_link.pengumuman",
  },
  {
    label: "Iuran",
    to: "/dashboard/iuran",
    icon: Wallet,
    ocid: "dashboard.nav_link.iuran",
  },
  {
    label: "Laporan",
    to: "/dashboard/laporan",
    icon: BarChart3,
    ocid: "dashboard.nav_link.laporan",
  },
  {
    label: "Surat",
    to: "/dashboard/surat",
    icon: FileText,
    ocid: "dashboard.nav_link.surat",
  },
  {
    label: "Fasilitas",
    to: "/dashboard/fasilitas",
    icon: Building2,
    ocid: "dashboard.nav_link.fasilitas",
  },
  {
    label: "Pengurus",
    to: "/dashboard/pengurus",
    icon: UserCog,
    ocid: "dashboard.nav_link.pengurus",
  },
  {
    label: "Pengaturan",
    to: "/dashboard/pengaturan",
    icon: Settings,
    ocid: "dashboard.nav_link.pengaturan",
  },
];

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Guard: redirect to login if no session
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate({ to: "/login" });
  };

  const currentItem = sidebarItems.find(
    (item) => location.pathname === item.to,
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Toaster position="top-right" />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        } min-h-screen sticky top-0 h-screen`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bricolage font-bold text-sm">
                RT
              </div>
              <div>
                <div className="font-bricolage font-bold text-sm leading-tight">
                  RT 09
                </div>
                <div className="text-sidebar-foreground/50 text-xs">
                  Dongkelan
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
          >
            {sidebarOpen ? (
              <ChevronRight className="w-4 h-4 rotate-180" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={item.ocid}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${!sidebarOpen ? "justify-center" : ""}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              !sidebarOpen ? "justify-center px-0" : "justify-start"
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="ml-2">Keluar</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bricolage font-bold">
                    RT
                  </div>
                  <div>
                    <div className="font-bricolage font-bold">
                      RT 09 Dongkelan
                    </div>
                    <div className="text-sidebar-foreground/50 text-xs">
                      Panel Admin
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      data-ocid={item.ocid}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Breadcrumb */}
            <div>
              <h1 className="font-bricolage font-semibold text-foreground text-sm md:text-base">
                {currentItem?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                RT 09 Dongkelan — Panel Admin
              </p>
            </div>
          </div>

          {/* Admin Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-foreground">Admin</div>
              <div className="text-xs text-muted-foreground">Administrator</div>
            </div>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground font-bricolage text-sm">
                AD
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>

        {/* Dashboard Footer */}
        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
