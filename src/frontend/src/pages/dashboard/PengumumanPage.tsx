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
import {
  Download,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Category, Status__1 } from "../../backend.d";
import type { PengumumanData } from "../../backend.d";
import { SkeletonTableRows } from "../../components/SkeletonRows";
import {
  useAddPengumuman,
  useDeletePengumuman,
  useListPengumuman,
  useUpdatePengumuman,
} from "../../hooks/useQueries";
import { exportToCSV, parseCSV } from "../../utils/csvUtils";

const categoryConfig = {
  [Category.general]: { label: "Umum", className: "badge-blue" },
  [Category.important]: { label: "Penting", className: "badge-yellow" },
  [Category.emergency]: { label: "Darurat", className: "badge-red" },
};

const emptyForm = {
  title: "",
  content: "",
  category: Category.general as Category,
  date: new Date().toISOString().split("T")[0],
  status: Status__1.active as Status__1,
  author: "",
};

export default function PengumumanPage() {
  const { data: pengumuman = [], isLoading } = useListPengumuman();
  const addMutation = useAddPengumuman();
  const updateMutation = useUpdatePengumuman();
  const deleteMutation = useDeletePengumuman();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToCSV(
      pengumuman.map((p) => ({
        title: p.title,
        content: p.content,
        category: p.category,
        date: p.date,
        status: p.status,
        author: p.author,
      })),
      "pengumuman.csv",
    );
    toast.success("Data pengumuman berhasil diekspor");
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
          title: r.title || "",
          content: r.content || "",
          category: (r.category as Category) || Category.general,
          date: r.date || new Date().toISOString().split("T")[0],
          status: (r.status as Status__1) || Status__1.active,
          author: r.author || "",
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        count++;
      } catch {}
    }
    toast.success(`${count} pengumuman berhasil diimpor`);
    if (importRef.current) importRef.current.value = "";
  };

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PengumumanData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = pengumuman.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: PengumumanData) => {
    setEditData(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      date: item.date,
      status: item.status,
      author: item.author,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Judul dan konten wajib diisi");
      return;
    }
    try {
      if (editData) {
        await updateMutation.mutateAsync({ ...editData, ...form });
        toast.success("Pengumuman berhasil diperbarui");
      } else {
        await addMutation.mutateAsync({
          ...form,
          id: crypto.randomUUID(),
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        toast.success("Pengumuman berhasil ditambahkan");
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
      toast.success("Pengumuman berhasil dihapus");
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
            <Megaphone className="w-5 h-5 text-primary" />
            Pengumuman
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pengumuman.length} pengumuman
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
            data-ocid="pengumuman.upload_button"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Impor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-ocid="pengumuman.secondary_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor
          </Button>
          <Button
            onClick={openAdd}
            data-ocid="pengumuman.add_button"
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Pengumuman
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari pengumuman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="pengumuman.search_input"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="pengumuman.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="hidden sm:table-cell">Penulis</TableHead>
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
                    data-ocid="pengumuman.empty_state"
                  >
                    <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada pengumuman</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => {
                  const cat = categoryConfig[p.category];
                  return (
                    <TableRow key={p.id} data-ocid={`pengumuman.row.${i + 1}`}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {p.title}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.className}`}
                        >
                          {cat.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.status === Status__1.active ? (
                          <span className="badge-green px-2 py-0.5 rounded-full text-xs font-semibold">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Diarsipkan
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.date}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {p.author}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(p)}
                            data-ocid={`pengumuman.edit_button.${i + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(p.id)}
                            data-ocid={`pengumuman.delete_button.${i + 1}`}
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
              {editData ? "Edit Pengumuman" : "Tambah Pengumuman"}
            </DialogTitle>
            <DialogDescription>
              {editData ? "Perbarui pengumuman" : "Buat pengumuman baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Judul *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul pengumuman"
                className="mt-1"
                data-ocid="pengumuman.input"
              />
            </div>
            <div>
              <Label>Konten *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Isi pengumuman..."
                rows={5}
                className="mt-1"
                data-ocid="pengumuman.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as Category })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Category.general}>Umum</SelectItem>
                    <SelectItem value={Category.important}>Penting</SelectItem>
                    <SelectItem value={Category.emergency}>Darurat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Status__1 })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Status__1.active}>Aktif</SelectItem>
                    <SelectItem value={Status__1.archived}>
                      Diarsipkan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Penulis</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Nama penulis"
                  className="mt-1"
                />
              </div>
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
            <AlertDialogTitle>Hapus Pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengumuman ini akan dihapus permanen.
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
