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
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Condition, Type__2 } from "../../backend.d";
import type { FasilitasData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddFasilitas,
  useDeleteFasilitas,
  useListFasilitas,
  useUpdateFasilitas,
} from "../../hooks/useQueries";

const conditionConfig = {
  [Condition.good]: { label: "Baik", className: "badge-green" },
  [Condition.lightDamage]: { label: "Rusak Ringan", className: "badge-yellow" },
  [Condition.heavyDamage]: { label: "Rusak Berat", className: "badge-red" },
};

const typeLabels = {
  [Type__2.building]: "Bangunan",
  [Type__2.equipment]: "Peralatan",
  [Type__2.vehicle]: "Kendaraan",
  [Type__2.other]: "Lainnya",
};

const emptyForm = {
  name: "",
  fasilitasType: Type__2.building as Type__2,
  condition: Condition.good as Condition,
  location: "",
  acquisitionYear: new Date().getFullYear(),
  description: "",
};

export default function FasilitasPage() {
  const { data: fasilitasList = [], isLoading } = useListFasilitas();
  const addMutation = useAddFasilitas();
  const updateMutation = useUpdateFasilitas();
  const deleteMutation = useDeleteFasilitas();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<FasilitasData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = fasilitasList.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: FasilitasData) => {
    setEditData(item);
    setForm({
      name: item.name,
      fasilitasType: item.fasilitasType,
      condition: item.condition,
      location: item.location,
      acquisitionYear: Number(item.acquisitionYear),
      description: item.description,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama fasilitas wajib diisi");
      return;
    }
    try {
      const data: FasilitasData = {
        id: editData?.id || crypto.randomUUID(),
        name: form.name,
        fasilitasType: form.fasilitasType,
        condition: form.condition,
        location: form.location,
        acquisitionYear: BigInt(form.acquisitionYear),
        description: form.description,
        createdAt:
          editData?.createdAt || BigInt(Date.now()) * BigInt(1_000_000),
      };
      if (editData) {
        await updateMutation.mutateAsync(data);
        toast.success("Fasilitas berhasil diperbarui");
      } else {
        await addMutation.mutateAsync(data);
        toast.success("Fasilitas berhasil ditambahkan");
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
      toast.success("Fasilitas berhasil dihapus");
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
            <Building2 className="w-5 h-5 text-primary" />
            Fasilitas & Aset
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {fasilitasList.length} data fasilitas
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="fasilitas.add_button"
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Fasilitas
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari fasilitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="fasilitas.search_input"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="fasilitas.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Nama Fasilitas</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                <TableHead>Tahun</TableHead>
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
                    data-ocid="fasilitas.empty_state"
                  >
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data fasilitas</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f, i) => {
                  const cond = conditionConfig[f.condition];
                  return (
                    <TableRow key={f.id} data-ocid={`fasilitas.row.${i + 1}`}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-sm">
                        {typeLabels[f.fasilitasType]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cond.className}`}
                        >
                          {cond.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {f.location}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {String(f.acquisitionYear)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(f)}
                            data-ocid={`fasilitas.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(f.id)}
                            data-ocid={`fasilitas.delete_button.${i + 1}`}
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
        <DialogContent className="max-w-lg" data-ocid="modal.dialog">
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Fasilitas" : "Tambah Fasilitas"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui data fasilitas" : "Tambah fasilitas baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Nama Fasilitas *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama fasilitas/aset"
                className="mt-1"
                data-ocid="fasilitas.input"
              />
            </div>
            <div>
              <Label>Jenis</Label>
              <Select
                value={form.fasilitasType}
                onValueChange={(v) =>
                  setForm({ ...form, fasilitasType: v as Type__2 })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Type__2.building}>Bangunan</SelectItem>
                  <SelectItem value={Type__2.equipment}>Peralatan</SelectItem>
                  <SelectItem value={Type__2.vehicle}>Kendaraan</SelectItem>
                  <SelectItem value={Type__2.other}>Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kondisi</Label>
              <Select
                value={form.condition}
                onValueChange={(v) =>
                  setForm({ ...form, condition: v as Condition })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Condition.good}>Baik</SelectItem>
                  <SelectItem value={Condition.lightDamage}>
                    Rusak Ringan
                  </SelectItem>
                  <SelectItem value={Condition.heavyDamage}>
                    Rusak Berat
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Lokasi fasilitas"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tahun Perolehan</Label>
              <Input
                type="number"
                value={form.acquisitionYear}
                onChange={(e) =>
                  setForm({ ...form, acquisitionYear: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Keterangan tambahan..."
                rows={3}
                className="mt-1"
                data-ocid="fasilitas.textarea"
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
            <AlertDialogTitle>Hapus Fasilitas?</AlertDialogTitle>
            <AlertDialogDescription>
              Data fasilitas akan dihapus permanen.
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
