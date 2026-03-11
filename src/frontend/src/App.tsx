import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PengumumanPublicPage from "./pages/PengumumanPublicPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import FasilitasPage from "./pages/dashboard/FasilitasPage";
import IuranPage from "./pages/dashboard/IuranPage";
import KKPage from "./pages/dashboard/KKPage";
import LaporanPage from "./pages/dashboard/LaporanPage";
import PengaturanPage from "./pages/dashboard/PengaturanPage";
import PengumumanPage from "./pages/dashboard/PengumumanPage";
import PengurusPage from "./pages/dashboard/PengurusPage";
import SuratPage from "./pages/dashboard/SuratPage";
import WargaPage from "./pages/dashboard/WargaPage";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Public layout wrapper
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: () => (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  ),
});

// Public routes
const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
});

const pengumumanPublicRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/pengumuman",
  component: PengumumanPublicPage,
});

const loginRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/login",
  component: LoginPage,
});

// Dashboard layout wrapper
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard",
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});

// Dashboard routes
const dashboardHomeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard",
  component: DashboardHome,
});

const dashboardWargaRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/warga",
  component: WargaPage,
});

const dashboardKKRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/kk",
  component: KKPage,
});

const dashboardPengumumanRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/pengumuman",
  component: PengumumanPage,
});

const dashboardIuranRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/iuran",
  component: IuranPage,
});

const dashboardSuratRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/surat",
  component: SuratPage,
});

const dashboardFasilitasRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/fasilitas",
  component: FasilitasPage,
});

const dashboardPengurusRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/pengurus",
  component: PengurusPage,
});

const dashboardLaporanRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/laporan",
  component: LaporanPage,
});

const dashboardPengaturanRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/dashboard/pengaturan",
  component: PengaturanPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([homeRoute, pengumumanPublicRoute, loginRoute]),
  dashboardLayoutRoute.addChildren([
    dashboardHomeRoute,
    dashboardWargaRoute,
    dashboardKKRoute,
    dashboardPengumumanRoute,
    dashboardIuranRoute,
    dashboardSuratRoute,
    dashboardFasilitasRoute,
    dashboardPengurusRoute,
    dashboardPengaturanRoute,
    dashboardLaporanRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </>
  );
}
