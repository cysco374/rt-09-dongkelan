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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil, Phone, Plus, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PengurusData } from "../../backend.d";
import {
  useAddPengurus,
  useDeletePengurus,
  useListPengurus,
  useUpdatePengurus,
} from "../../hooks/useQueries";

const emptyForm = { name: "", position: "", phone: "", period: "", photo: "" };

export default function PengurusPage() {
  const { data: pengurusList = [], isLoading } = useListPengurus();
  const addMutation = useAddPengurus();
  const updateMutation = useUpdatePengurus();
  const deleteMutation = useDeletePengurus();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PengurusData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: PengurusData) => {
    setEditData(item);
    setForm({
      name: item.name,
      position: item.position,
      phone: item.phone,
      period: item.period,
      photo: item.photo,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.position.trim()) {
      toast.error("Nama dan jabatan wajib diisi");
      return;
    }
    try {
      if (editData) {
        await updateMutation.mutateAsync({ ...editData, ...form });
        toast.success("Pengurus berhasil diperbarui");
      } else {
        await addMutation.mutateAsync({
          ...form,
          id: crypto.randomUUID(),
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        toast.success("Pengurus berhasil ditambahkan");
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
      toast.success("Pengurus berhasil dihapus");
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
            <UserCog className="w-5 h-5 text-primary" />
            Pengurus RT
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pengurusList.length} pengurus terdaftar
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="pengurus.add_button"
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Pengurus
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"].map((k) => (
            <div
              key={k}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : pengurusList.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="pengurus.empty_state"
        >
          <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Belum ada pengurus terdaftar</p>
          <p className="text-sm mt-1">
            Klik "Tambah Pengurus" untuk menambahkan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pengurusList.map((p, i) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
              data-ocid={`pengurus.card.${i + 1}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bricolage font-bold text-xl flex-shrink-0 overflow-hidden">
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {p.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bricolage font-semibold text-foreground truncate">
                    {p.name}
                  </h3>
                  <p className="text-sm text-primary font-medium mt-0.5">
                    {p.position}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.period}
                  </p>
                  {p.phone && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {p.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-secondary"
                    onClick={() => openEdit(p)}
                    data-ocid={`pengurus.edit_button.${i + 1}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(p.id)}
                    data-ocid={`pengurus.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="modal.dialog">
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Pengurus" : "Tambah Pengurus"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui data pengurus" : "Tambah pengurus RT baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama pengurus"
                className="mt-1"
                data-ocid="pengurus.input"
              />
            </div>
            <div>
              <Label>Jabatan *</Label>
              <Input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Ketua RT, Sekretaris, dll"
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
              <Label>Periode</Label>
              <Input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="2024-2027"
                className="mt-1"
              />
            </div>
            <div>
              <Label>URL Foto (opsional)</Label>
              <Input
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                placeholder="https://..."
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
            <AlertDialogTitle>Hapus Pengurus?</AlertDialogTitle>
            <AlertDialogDescription>
              Data pengurus akan dihapus permanen.
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
