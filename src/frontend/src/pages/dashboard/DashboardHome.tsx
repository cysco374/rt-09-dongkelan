import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Bell,
  FileText,
  Home,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Category, Status__1, Status__2 } from "../../backend.d";
import {
  useListIuran,
  useListPengumuman,
  useStatistics,
} from "../../hooks/useQueries";

function categoryLabel(cat: Category) {
  switch (cat) {
    case Category.emergency:
      return (
        <span className="badge-red px-2 py-0.5 rounded-full text-xs font-semibold">
          Darurat
        </span>
      );
    case Category.important:
      return (
        <span className="badge-yellow px-2 py-0.5 rounded-full text-xs font-semibold">
          Penting
        </span>
      );
    default:
      return (
        <span className="badge-blue px-2 py-0.5 rounded-full text-xs font-semibold">
          Umum
        </span>
      );
  }
}

const statsConfig = [
  {
    key: "totalWarga",
    label: "Total Warga",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    key: "totalKK",
    label: "Kartu Keluarga",
    icon: Home,
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    key: "totalActivePengumuman",
    label: "Pengumuman Aktif",
    icon: Bell,
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    key: "totalWaitingSurat",
    label: "Surat Menunggu",
    icon: FileText,
    color: "bg-chart-5/10 text-chart-5",
  },
  {
    key: "totalPaidIuranThisMonth",
    label: "Iuran Lunas Bulan Ini",
    icon: Wallet,
    color: "bg-chart-1/10 text-chart-1",
  },
];

export default function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: pengumuman, isLoading: pengumumanLoading } =
    useListPengumuman();

  const { data: iuranList = [] } = useListIuran();

  const totalSaldo = useMemo(
    () =>
      iuranList
        .filter((i) => i.status === Status__2.paid)
        .reduce((s, i) => s + Number(i.total), 0),
    [iuranList],
  );
  const totalTunggakan = useMemo(
    () =>
      iuranList
        .filter((i) => i.status === Status__2.unpaid)
        .reduce((s, i) => s + Number(i.total), 0),
    [iuranList],
  );

  const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const latest5 = (pengumuman || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="font-bricolage font-bold text-2xl text-foreground">
          Selamat Datang di Panel Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          RT 09 Kampung Dongkelan — Ringkasan statistik terkini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statsConfig.map((sc, i) => (
          <motion.div
            key={sc.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${sc.color}`}
                  >
                    <sc.icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground/50" />
                </div>
                {statsLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <div className="font-bricolage font-bold text-2xl text-foreground">
                      {stats
                        ? String(stats[sc.key as keyof typeof stats])
                        : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sc.label}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="font-bricolage font-bold text-xl text-emerald-600">
                {formatRp(totalSaldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Saldo Kas
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="font-bricolage font-bold text-xl">
                {iuranList.filter((i) => i.status === Status__2.paid).length}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transaksi Iuran Lunas
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <div className="font-bricolage font-bold text-xl text-destructive">
                {formatRp(totalTunggakan)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Tunggakan Iuran
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Announcements */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-bricolage text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Pengumuman Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pengumumanLoading ? (
            <div className="space-y-3">
              {["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : latest5.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="pengumuman.empty_state"
            >
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada pengumuman</p>
            </div>
          ) : (
            <Table data-ocid="pengumuman.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest5.map((item, i) => (
                  <TableRow key={item.id} data-ocid={`pengumuman.row.${i + 1}`}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {item.title}
                    </TableCell>
                    <TableCell>{categoryLabel(item.category)}</TableCell>
                    <TableCell>
                      {item.status === Status__1.active ? (
                        <span className="badge-green px-2 py-0.5 rounded-full text-xs font-semibold">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Diarsipkan
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
