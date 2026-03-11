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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Gender, StatusWarga } from "../../backend.d";
import type { WargaData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddWarga,
  useDeleteWarga,
  useListWarga,
  useUpdateWarga,
} from "../../hooks/useQueries";
import { exportToCSV, parseCSV } from "../../utils/csvUtils";

const statusConfig = {
  [StatusWarga.tetap]: { label: "Tetap", className: "badge-green" },
  [StatusWarga.kontrak]: { label: "Kontrak", className: "badge-yellow" },
  [StatusWarga.kos]: { label: "Kos", className: "badge-blue" },
};

const emptyForm: Omit<WargaData, "id" | "createdAt"> = {
  fullName: "",
  nik: "",
  dob: "",
  gender: Gender.male,
  address: "",
  phone: "",
  maritalStatus: "",
  job: "",
  status: StatusWarga.tetap,
  kkNumber: "",
};

export default function WargaPage() {
  const { data: warga = [], isLoading } = useListWarga();
  const addMutation = useAddWarga();
  const updateMutation = useUpdateWarga();
  const deleteMutation = useDeleteWarga();

  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToCSV(
      warga.map((w) => ({
        nik: w.nik,
        fullName: w.fullName,
        dob: w.dob,
        gender: w.gender,
        address: w.address,
        phone: w.phone,
        status: w.status,
        kkNumber: w.kkNumber,
        maritalStatus: w.maritalStatus,
        job: w.job,
      })),
      "warga.csv",
    );
    toast.success("Data warga berhasil diekspor");
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
          nik: r.nik || "",
          fullName: r.fullName || "",
          dob: r.dob || "",
          gender: (r.gender as Gender) || Gender.male,
          address: r.address || "",
          phone: r.phone || "",
          status: (r.status as StatusWarga) || StatusWarga.tetap,
          kkNumber: r.kkNumber || "",
          maritalStatus: r.maritalStatus || "",
          job: r.job || "",
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        count++;
      } catch {}
    }
    toast.success(`${count} data warga berhasil diimpor`);
    if (importRef.current) importRef.current.value = "";
  };

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusWarga | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<WargaData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = warga.filter((w) => {
    const matchSearch =
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.nik.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: WargaData) => {
    setEditData(item);
    setForm({
      fullName: item.fullName,
      nik: item.nik,
      dob: item.dob,
      gender: item.gender,
      address: item.address,
      phone: item.phone,
      maritalStatus: item.maritalStatus,
      job: item.job,
      status: item.status,
      kkNumber: item.kkNumber,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.nik.trim()) {
      toast.error("Nama dan NIK wajib diisi");
      return;
    }
    try {
      if (editData) {
        await updateMutation.mutateAsync({ ...editData, ...form });
        toast.success("Data warga berhasil diperbarui");
      } else {
        const newData: WargaData = {
          ...form,
          id: crypto.randomUUID(),
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        };
        await addMutation.mutateAsync(newData);
        toast.success("Warga berhasil ditambahkan");
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
      toast.success("Warga berhasil dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bricolage font-bold text-xl text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Data Warga
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {warga.length} total warga terdaftar
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
            data-ocid="warga.upload_button"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Impor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="warga.secondary_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor
          </Button>
          <Button
            onClick={openAdd}
            data-ocid="warga.add_button"
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Warga
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="warga.search_input"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as StatusWarga | "all")}
        >
          <SelectTrigger className="w-40" data-ocid="warga.select">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={StatusWarga.tetap}>Tetap</SelectItem>
            <SelectItem value={StatusWarga.kontrak}>Kontrak</SelectItem>
            <SelectItem value={StatusWarga.kos}>Kos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="warga.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Nama</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead className="hidden md:table-cell">Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">No. HP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="warga.empty_state"
                  >
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data warga</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w, i) => {
                  const statusCfg = statusConfig[w.status];
                  return (
                    <TableRow key={w.id} data-ocid={`warga.row.${i + 1}`}>
                      <TableCell className="font-medium">
                        {w.fullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {w.nik}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-48 truncate">
                        {w.address}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {w.phone}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary"
                            onClick={() => openEdit(w)}
                            data-ocid={`warga.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(w.id)}
                            data-ocid={`warga.delete_button.${i + 1}`}
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="modal.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Data Warga" : "Tambah Warga Baru"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui informasi warga" : "Isi data warga baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nama lengkap"
                className="mt-1"
                data-ocid="warga.input"
              />
            </div>
            <div>
              <Label>NIK *</Label>
              <Input
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                placeholder="16 digit NIK"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tanggal Lahir</Label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jenis Kelamin</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.male}>Laki-laki</SelectItem>
                  <SelectItem value={Gender.female}>Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status Warga</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as StatusWarga })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StatusWarga.tetap}>Tetap</SelectItem>
                  <SelectItem value={StatusWarga.kontrak}>Kontrak</SelectItem>
                  <SelectItem value={StatusWarga.kos}>Kos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Alamat</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat lengkap"
                className="mt-1"
              />
            </div>
            <div>
              <Label>No. HP</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08xx-xxxx-xxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label>No. KK</Label>
              <Input
                value={form.kkNumber}
                onChange={(e) => setForm({ ...form, kkNumber: e.target.value })}
                placeholder="No. Kartu Keluarga"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status Menikah</Label>
              <Select
                value={form.maritalStatus}
                onValueChange={(v) => setForm({ ...form, maritalStatus: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="belum-kawin">Belum Kawin</SelectItem>
                  <SelectItem value="kawin">Kawin</SelectItem>
                  <SelectItem value="cerai-hidup">Cerai Hidup</SelectItem>
                  <SelectItem value="cerai-mati">Cerai Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pekerjaan</Label>
              <Input
                value={form.job}
                onChange={(e) => setForm({ ...form, job: e.target.value })}
                placeholder="Pekerjaan"
                className="mt-1"
              />
            </div>
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

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="modal.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Warga?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data warga akan dihapus
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="modal.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
