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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { KKData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddKK,
  useDeleteKK,
  useListKK,
  useUpdateKK,
} from "../../hooks/useQueries";
import { exportToCSV, parseCSV } from "../../utils/csvUtils";

const emptyForm = { number: "", head: "", address: "", members: "" };

export default function KKPage() {
  const { data: kkList = [], isLoading } = useListKK();
  const addMutation = useAddKK();
  const updateMutation = useUpdateKK();
  const deleteMutation = useDeleteKK();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToCSV(
      kkList.map((k) => ({
        number: k.number,
        head: k.head,
        address: k.address,
        members: k.members.join(";"),
      })),
      "kartu-keluarga.csv",
    );
    toast.success("Data KK berhasil diekspor");
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
          number: r.number || "",
          head: r.head || "",
          address: r.address || "",
          members: r.members
            ? r.members
                .split(";")
                .map((m: string) => m.trim())
                .filter(Boolean)
            : [],
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        count++;
      } catch {}
    }
    toast.success(`${count} data KK berhasil diimpor`);
    if (importRef.current) importRef.current.value = "";
  };

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<KKData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = kkList.filter(
    (k) =>
      k.number.toLowerCase().includes(search.toLowerCase()) ||
      k.head.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: KKData) => {
    setEditData(item);
    setForm({
      number: item.number,
      head: item.head,
      address: item.address,
      members: item.members.join(", "),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.number.trim() || !form.head.trim()) {
      toast.error("Nomor KK dan Kepala Keluarga wajib diisi");
      return;
    }
    const membersArr = form.members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    try {
      if (editData) {
        await updateMutation.mutateAsync({
          ...editData,
          number: form.number,
          head: form.head,
          address: form.address,
          members: membersArr,
        });
        toast.success("KK berhasil diperbarui");
      } else {
        await addMutation.mutateAsync({
          id: crypto.randomUUID(),
          number: form.number,
          head: form.head,
          address: form.address,
          members: membersArr,
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        toast.success("KK berhasil ditambahkan");
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
      toast.success("KK berhasil dihapus");
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
            <CreditCard className="w-5 h-5 text-primary" />
            Kartu Keluarga
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {kkList.length} KK terdaftar
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
            data-ocid="kk.upload_button"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Impor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="kk.secondary_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor
          </Button>
          <Button
            onClick={openAdd}
            data-ocid="kk.add_button"
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah KK
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari no. KK atau kepala keluarga..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="kk.search_input"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="kk.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>No. KK</TableHead>
                <TableHead>Kepala Keluarga</TableHead>
                <TableHead className="hidden md:table-cell">Alamat</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows rows={4} cols={5} />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="kk.empty_state"
                  >
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data KK</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((k, i) => (
                  <TableRow key={k.id} data-ocid={`kk.row.${i + 1}`}>
                    <TableCell className="font-mono text-xs font-medium">
                      {k.number}
                    </TableCell>
                    <TableCell className="font-medium">{k.head}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-48 truncate">
                      {k.address}
                    </TableCell>
                    <TableCell>
                      <span className="badge-blue px-2 py-0.5 rounded-full text-xs font-semibold">
                        {k.members.length} anggota
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-secondary"
                          onClick={() => openEdit(k)}
                          data-ocid={`kk.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(k.id)}
                          data-ocid={`kk.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="modal.dialog">
          <DialogHeader>
            <DialogTitle className="font-bricolage">
              {editData ? "Edit Kartu Keluarga" : "Tambah Kartu Keluarga"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui data KK" : "Tambah data KK baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nomor KK *</Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="16 digit Nomor KK"
                className="mt-1"
                data-ocid="kk.input"
              />
            </div>
            <div>
              <Label>Nama Kepala Keluarga *</Label>
              <Input
                value={form.head}
                onChange={(e) => setForm({ ...form, head: e.target.value })}
                placeholder="Nama kepala keluarga"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Anggota Keluarga (pisahkan dengan koma)</Label>
              <Textarea
                value={form.members}
                onChange={(e) => setForm({ ...form, members: e.target.value })}
                placeholder="ID warga, pisahkan dengan koma"
                className="mt-1"
                rows={3}
                data-ocid="kk.textarea"
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
            <AlertDialogTitle>Hapus Kartu Keluarga?</AlertDialogTitle>
            <AlertDialogDescription>
              Data KK akan dihapus permanen.
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
