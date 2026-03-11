import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  BarChart3,
  Download,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Status__2, Type__1 } from "../../backend.d";
import { useListIuran } from "../../hooks/useQueries";
import { exportToCSV } from "../../utils/csvUtils";

const typeLabels: Record<string, string> = {
  [Type__1.monthly]: "Iuran Bulanan",
  [Type__1.security]: "Keamanan",
  [Type__1.cleaning]: "Kebersihan",
  [Type__1.social]: "Sosial",
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export default function LaporanPage() {
  const { data: iuranList = [], isLoading } = useListIuran();
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(String(currentYear));

  const years = useMemo(() => {
    const ys = new Set<number>();
    for (const i of iuranList) ys.add(Number(i.year));
    ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [iuranList, currentYear]);

  const filtered = useMemo(
    () => iuranList.filter((i) => String(Number(i.year)) === filterYear),
    [iuranList, filterYear],
  );

  const totalSaldo = useMemo(
    () =>
      iuranList
        .filter((i) => i.status === Status__2.paid)
        .reduce((s, i) => s + Number(i.total), 0),
    [iuranList],
  );
  const totalPemasukan = useMemo(
    () =>
      filtered
        .filter((i) => i.status === Status__2.paid)
        .reduce((s, i) => s + Number(i.total), 0),
    [filtered],
  );
  const totalTunggakan = useMemo(
    () =>
      filtered
        .filter((i) => i.status === Status__2.unpaid)
        .reduce((s, i) => s + Number(i.total), 0),
    [filtered],
  );
  const totalTransaksi = filtered.length;

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const map: Record<
      number,
      { lunas: number; belumLunas: number; count: number }
    > = {};
    for (const i of filtered) {
      const m = Number(i.month);
      if (!map[m]) map[m] = { lunas: 0, belumLunas: 0, count: 0 };
      map[m].count++;
      if (i.status === Status__2.paid) map[m].lunas += Number(i.total);
      else map[m].belumLunas += Number(i.total);
    }
    return Object.entries(map)
      .map(([month, v]) => ({ month: Number(month), ...v }))
      .sort((a, b) => b.month - a.month);
  }, [filtered]);

  // Per-type breakdown
  const typeData = useMemo(() => {
    const map: Record<
      string,
      { lunas: number; tunggakan: number; count: number }
    > = {};
    for (const i of filtered) {
      const t = i.iuranType as string;
      if (!map[t]) map[t] = { lunas: 0, tunggakan: 0, count: 0 };
      map[t].count++;
      if (i.status === Status__2.paid) map[t].lunas += Number(i.total);
      else map[t].tunggakan += Number(i.total);
    }
    return Object.entries(map).map(([type, v]) => ({ type, ...v }));
  }, [filtered]);

  const handleExport = () => {
    exportToCSV(
      monthlyData.map((r) => ({
        Bulan: monthNames[r.month - 1],
        Tahun: filterYear,
        "Jumlah Transaksi": r.count,
        "Total Lunas (Rp)": r.lunas,
        "Total Belum Lunas (Rp)": r.belumLunas,
        "Total Keseluruhan (Rp)": r.lunas + r.belumLunas,
      })),
      `laporan-keuangan-${filterYear}.csv`,
    );
  };

  const summaryCards = [
    {
      label: "Total Saldo (Keseluruhan)",
      value: formatRp(totalSaldo),
      icon: Wallet,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: `Pemasukan ${filterYear}`,
      value: formatRp(totalPemasukan),
      icon: TrendingUp,
      color: "bg-primary/10 text-primary",
    },
    {
      label: `Tunggakan ${filterYear}`,
      value: formatRp(totalTunggakan),
      icon: AlertCircle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: `Jumlah Transaksi ${filterYear}`,
      value: String(totalTransaksi),
      icon: BarChart3,
      color: "bg-chart-2/10 text-chart-2",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-xl text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Laporan Keuangan
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Rekap pemasukan dan tunggakan iuran warga RT 09 Dongkelan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32" data-ocid="laporan.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            data-ocid="laporan.export_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((sc) => (
          <Card key={sc.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${sc.color}`}
                >
                  <sc.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="font-bricolage font-bold text-lg text-foreground leading-tight">
                {sc.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{sc.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-bricolage text-base">
            Rekap Per Bulan — {filterYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Memuat data...
            </p>
          ) : monthlyData.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="laporan.empty_state"
            >
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada data untuk tahun {filterYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="laporan.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-center">Transaksi</TableHead>
                    <TableHead className="text-right">Total Lunas</TableHead>
                    <TableHead className="text-right">
                      Total Belum Lunas
                    </TableHead>
                    <TableHead className="text-right">
                      Total Keseluruhan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((r, i) => (
                    <TableRow key={r.month} data-ocid={`laporan.row.${i + 1}`}>
                      <TableCell className="font-medium">
                        {monthNames[r.month - 1]}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="badge-blue px-2 py-0.5 rounded-full text-xs font-semibold">
                          {r.count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatRp(r.lunas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {formatRp(r.belumLunas)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRp(r.lunas + r.belumLunas)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Type Breakdown */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-bricolage text-base">
            Rekap Per Jenis Iuran — {filterYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground text-sm">
              Tidak ada data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Jenis Iuran</TableHead>
                    <TableHead className="text-center">Jumlah Warga</TableHead>
                    <TableHead className="text-right">Total Lunas</TableHead>
                    <TableHead className="text-right">
                      Total Tunggakan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeData.map((r, i) => (
                    <TableRow
                      key={r.type}
                      data-ocid={`laporan.type.row.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {typeLabels[r.type] || r.type}
                      </TableCell>
                      <TableCell className="text-center">{r.count}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatRp(r.lunas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {formatRp(r.tunggakan)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
