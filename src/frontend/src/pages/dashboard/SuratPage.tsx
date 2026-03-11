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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Status, Type } from "../../backend.d";
import type { SuratData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddSurat,
  useDeleteSurat,
  useListSurat,
  useUpdateSurat,
} from "../../hooks/useQueries";

const statusConfig = {
  [Status.waiting]: { label: "Menunggu", className: "badge-yellow" },
  [Status.processing]: { label: "Diproses", className: "badge-blue" },
  [Status.finished]: { label: "Selesai", className: "badge-green" },
  [Status.rejected]: { label: "Ditolak", className: "badge-red" },
};

const typeLabels = {
  [Type.domicile]: "Surat Domisili",
  [Type.poor]: "Surat Tidak Mampu",
  [Type.ktp]: "KTP",
  [Type.kk]: "Kartu Keluarga",
  [Type.other]: "Lainnya",
};

const emptyForm = {
  wargaId: "",
  applicant: "",
  suratType: Type.domicile as Type,
  purpose: "",
  status: Status.waiting as Status,
  requestDate: new Date().toISOString().split("T")[0],
  completionDate: "",
  notes: "",
};

export default function SuratPage() {
  const { data: suratList = [], isLoading } = useListSurat();
  const addMutation = useAddSurat();
  const updateMutation = useUpdateSurat();
  const deleteMutation = useDeleteSurat();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<SuratData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = suratList.filter((s) => {
    const matchSearch = s.applicant
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: SuratData) => {
    setEditData(item);
    setForm({
      wargaId: item.wargaId,
      applicant: item.applicant,
      suratType: item.suratType,
      purpose: item.purpose,
      status: item.status,
      requestDate: item.requestDate,
      completionDate: item.completionDate || "",
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.applicant.trim()) {
      toast.error("Nama pemohon wajib diisi");
      return;
    }
    try {
      const data: SuratData = {
        id: editData?.id || crypto.randomUUID(),
        wargaId: form.wargaId,
        applicant: form.applicant,
        suratType: form.suratType,
        purpose: form.purpose,
        status: form.status,
        requestDate: form.requestDate,
        completionDate: form.completionDate || undefined,
        notes: form.notes || undefined,
        createdAt:
          editData?.createdAt || BigInt(Date.now()) * BigInt(1_000_000),
      };
      if (editData) {
        await updateMutation.mutateAsync(data);
        toast.success("Surat berhasil diperbarui");
      } else {
        await addMutation.mutateAsync(data);
        toast.success("Surat berhasil ditambahkan");
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
      toast.success("Surat berhasil dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bricolage font-bold text-xl text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Surat & Dokumen
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {suratList.length} permohonan surat
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="surat.add_button"
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Surat
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pemohon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="surat.search_input"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as Status | "all")}
        >
          <SelectTrigger className="w-40" data-ocid="surat.select">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={Status.waiting}>Menunggu</SelectItem>
            <SelectItem value={Status.processing}>Diproses</SelectItem>
            <SelectItem value={Status.finished}>Selesai</SelectItem>
            <SelectItem value={Status.rejected}>Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="surat.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Pemohon</TableHead>
                <TableHead>Jenis Surat</TableHead>
                <TableHead className="hidden md:table-cell">
                  Keperluan
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
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
                    data-ocid="surat.empty_state"
                  >
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada permohonan surat</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s, i) => {
                  const st = statusConfig[s.status];
                  return (
                    <TableRow key={s.id} data-ocid={`surat.row.${i + 1}`}>
                      <TableCell className="font-medium">
                        {s.applicant}
                      </TableCell>
                      <TableCell className="text-sm">
                        {typeLabels[s.suratType]}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-32 truncate">
                        {s.purpose}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.requestDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(s)}
                            data-ocid={`surat.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(s.id)}
                            data-ocid={`surat.delete_button.${i + 1}`}
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
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="modal.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Surat" : "Tambah Permohonan Surat"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui data surat" : "Buat permohonan surat baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Nama Pemohon *</Label>
              <Input
                value={form.applicant}
                onChange={(e) =>
                  setForm({ ...form, applicant: e.target.value })
                }
                placeholder="Nama pemohon"
                className="mt-1"
                data-ocid="surat.input"
              />
            </div>
            <div>
              <Label>Jenis Surat</Label>
              <Select
                value={form.suratType}
                onValueChange={(v) =>
                  setForm({ ...form, suratType: v as Type })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type.domicile}>Surat Domisili</SelectItem>
                  <SelectItem value={Type.poor}>Surat Tidak Mampu</SelectItem>
                  <SelectItem value={Type.ktp}>KTP</SelectItem>
                  <SelectItem value={Type.kk}>Kartu Keluarga</SelectItem>
                  <SelectItem value={Type.other}>Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as Status })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.waiting}>Menunggu</SelectItem>
                  <SelectItem value={Status.processing}>Diproses</SelectItem>
                  <SelectItem value={Status.finished}>Selesai</SelectItem>
                  <SelectItem value={Status.rejected}>Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal Permohonan</Label>
              <Input
                type="date"
                value={form.requestDate}
                onChange={(e) =>
                  setForm({ ...form, requestDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={form.completionDate}
                onChange={(e) =>
                  setForm({ ...form, completionDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Keperluan</Label>
              <Textarea
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="Tujuan/keperluan surat..."
                rows={2}
                className="mt-1"
                data-ocid="surat.textarea"
              />
            </div>
            <div className="col-span-2">
              <Label>Catatan</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={2}
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="modal.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Permohonan Surat?</AlertDialogTitle>
            <AlertDialogDescription>
              Data surat akan dihapus permanen.
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
