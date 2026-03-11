import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Status__2, Type__1 } from "../../backend.d";
import type { IuranData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddIuran,
  useDeleteIuran,
  useListIuran,
  useUpdateIuran,
} from "../../hooks/useQueries";
import { exportToCSV, parseCSV } from "../../utils/csvUtils";

const statusConfig = {
  [Status__2.paid]: { label: "Lunas", className: "badge-green" },
  [Status__2.unpaid]: { label: "Belum Lunas", className: "badge-red" },
};

const typeLabels = {
  [Type__1.monthly]: "Iuran Bulanan",
  [Type__1.security]: "Keamanan",
  [Type__1.cleaning]: "Kebersihan",
  [Type__1.social]: "Sosial",
};

const months = [
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

const emptyForm = {
  wargaId: "",
  wargaName: "",
  iuranType: Type__1.monthly as Type__1,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  total: 25000,
  status: Status__2.unpaid as Status__2,
  paymentDate: "",
};

function formatRupiah(n: number | bigint) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

export default function IuranPage() {
  const { data: iuranList = [], isLoading } = useListIuran();
  const addMutation = useAddIuran();
  const updateMutation = useUpdateIuran();
  const deleteMutation = useDeleteIuran();
  const importRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status__2 | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<IuranData | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const filtered = iuranList.filter((item) => {
    const matchSearch = item.wargaName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: IuranData) => {
    setEditData(item);
    setForm({
      wargaId: item.wargaId,
      wargaName: item.wargaName,
      iuranType: item.iuranType,
      month: Number(item.month),
      year: Number(item.year),
      total: Number(item.total),
      status: item.status,
      paymentDate: item.paymentDate || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.wargaName.trim()) {
      toast.error("Nama warga wajib diisi");
      return;
    }
    try {
      const data: IuranData = {
        id: editData?.id || crypto.randomUUID(),
        wargaId: form.wargaId,
        wargaName: form.wargaName,
        iuranType: form.iuranType,
        month: BigInt(form.month),
        year: BigInt(form.year),
        total: BigInt(form.total),
        status: form.status,
        paymentDate: form.paymentDate || undefined,
        createdAt:
          editData?.createdAt || BigInt(Date.now()) * BigInt(1_000_000),
      };
      if (editData) {
        await updateMutation.mutateAsync(data);
        toast.success("Iuran berhasil diperbarui");
      } else {
        await addMutation.mutateAsync(data);
        toast.success("Iuran berhasil ditambahkan");
      }
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan data");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Iuran berhasil dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  const handleExport = () => {
    exportToCSV(
      iuranList.map((i) => ({
        wargaName: i.wargaName,
        iuranType: i.iuranType,
        month: String(i.month),
        year: String(i.year),
        total: String(i.total),
        status: i.status,
        paymentDate: i.paymentDate || "",
      })),
      "iuran.csv",
    );
    toast.success("Data iuran berhasil diekspor");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    let count = 0;
    for (const r of rows) {
      try {
        await addMutation.mutateAsync({
          id: crypto.randomUUID(),
          wargaId: "",
          wargaName: r.wargaName || "",
          iuranType: (r.iuranType as Type__1) || Type__1.monthly,
          month: BigInt(r.month || "1"),
          year: BigInt(r.year || String(new Date().getFullYear())),
          total: BigInt(r.total || "0"),
          status: (r.status as Status__2) || Status__2.unpaid,
          paymentDate: r.paymentDate || undefined,
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        count++;
      } catch {
        /* skip */
      }
    }
    toast.success(`${count} data iuran berhasil diimpor`);
    if (importRef.current) importRef.current.value = "";
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-xl text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Iuran Warga
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {iuranList.length} data iuran
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={importRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
            data-ocid="iuran.upload_button"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Impor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="iuran.secondary_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor
          </Button>
          <Button
            onClick={openAdd}
            data-ocid="iuran.add_button"
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Iuran
          </Button>
        </div>
      </div>

      {/* Saldo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bricolage font-bold text-base text-emerald-600">
                {formatRupiah(totalSaldo)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Saldo (Lunas)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-bricolage font-bold text-base">
                {iuranList.filter((i) => i.status === Status__2.paid).length}
              </div>
              <p className="text-xs text-muted-foreground">Transaksi Lunas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="font-bricolage font-bold text-base text-destructive">
                {formatRupiah(totalTunggakan)}
              </div>
              <p className="text-xs text-muted-foreground">Total Tunggakan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama warga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="iuran.search_input"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as Status__2 | "all")}
        >
          <SelectTrigger className="w-40" data-ocid="iuran.select">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={Status__2.paid}>Lunas</SelectItem>
            <SelectItem value={Status__2.unpaid}>Belum Lunas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="iuran.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Nama Warga</TableHead>
                <TableHead>Jenis Iuran</TableHead>
                <TableHead>Bulan/Tahun</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={4} cols={6} />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="iuran.empty_state"
                  >
                    <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data iuran</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, i) => {
                  const st = statusConfig[item.status];
                  return (
                    <TableRow key={item.id} data-ocid={`iuran.row.${i + 1}`}>
                      <TableCell className="font-medium">
                        {item.wargaName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {typeLabels[item.iuranType]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {months[Number(item.month) - 1]} {String(item.year)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatRupiah(item.total)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(item)}
                            data-ocid={`iuran.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(item.id)}
                            data-ocid={`iuran.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="modal.dialog">
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Iuran" : "Tambah Iuran"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui data iuran" : "Tambah data iuran baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Nama Warga *</Label>
              <Input
                value={form.wargaName}
                onChange={(e) =>
                  setForm({ ...form, wargaName: e.target.value })
                }
                placeholder="Nama warga"
                className="mt-1"
                data-ocid="iuran.input"
              />
            </div>
            <div className="col-span-2">
              <Label>Jenis Iuran</Label>
              <Select
                value={form.iuranType}
                onValueChange={(v) =>
                  setForm({ ...form, iuranType: v as Type__1 })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type__1.monthly}>Iuran Bulanan</SelectItem>
                  <SelectItem value={Type__1.security}>Keamanan</SelectItem>
                  <SelectItem value={Type__1.cleaning}>Kebersihan</SelectItem>
                  <SelectItem value={Type__1.social}>Sosial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bulan</Label>
              <Select
                value={String(form.month)}
                onValueChange={(v) => setForm({ ...form, month: Number(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, idx) => (
                    <SelectItem key={m} value={String(idx + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahun</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={form.total}
                onChange={(e) =>
                  setForm({ ...form, total: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Status__2 })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status__2.unpaid}>Belum Lunas</SelectItem>
                  <SelectItem value={Status__2.paid}>Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === Status__2.paid && (
              <div className="col-span-2">
                <Label>Tanggal Pembayaran</Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm({ ...form, paymentDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="modal.cancel_button"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              data-ocid="modal.confirm_button"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="modal.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Iuran?</AlertDialogTitle>
            <AlertDialogDescription>
              Data iuran akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="modal.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="modal.confirm_button"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
