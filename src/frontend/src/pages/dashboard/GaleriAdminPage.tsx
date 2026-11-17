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
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Images, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type GaleriItem, api, galeriImg } from "../../api/client";
import { fmtTanggal } from "../GaleriPage";

const MAX_BYTES = 500 * 1024;

/** Perkecil & kompres foto di browser agar ringan (maks 1600px, JPEG ≤ ~500 KB). */
async function compress(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.85;
  let url = c.toDataURL("image/jpeg", q);
  while (url.length * 0.75 > MAX_BYTES && q > 0.4) {
    q -= 0.1;
    url = c.toDataURL("image/jpeg", q);
  }
  if (url.length * 0.75 > MAX_BYTES * 1.15)
    throw new Error("Foto terlalu besar, pilih foto lain");
  return url;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function GaleriAdminPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["galeri"],
    queryFn: () => api.listGaleri(),
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<GaleriItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: today(),
  });
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<GaleriItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEdit(null);
    setForm({ title: "", description: "", date: today() });
    setImage(undefined);
    setOpen(true);
  };
  const openEdit = (g: GaleriItem) => {
    setEdit(g);
    setForm({ title: g.title, description: g.description, date: g.date });
    setImage(undefined);
    setOpen(true);
  };

  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Pilih berkas gambar");
    try {
      setImage(await compress(f));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses foto");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit && !image) return toast.error("Pilih foto terlebih dahulu");
    setBusy(true);
    try {
      await api.saveGaleri({ ...form, id: edit?.id }, image);
      toast.success(edit ? "Galeri diperbarui" : "Foto ditambahkan");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["galeri"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!del) return;
    try {
      await api.deleteGaleri(del.id);
      toast.success("Foto dihapus");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["galeri"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-xl flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Galeri Kegiatan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foto kegiatan warga yang tampil di halaman Galeri portal.
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="galeri_admin.add_button">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Foto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p
          className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-xl"
          data-ocid="galeri_admin.empty_state"
        >
          Belum ada foto. Klik “Tambah Foto”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((g, i) => (
            <div
              key={g.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-card"
              data-ocid={`galeri_admin.item.${i + 1}`}
            >
              <img
                src={galeriImg(g)}
                alt={g.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover bg-muted"
              />
              <div className="p-3">
                <p className="text-xs text-muted-foreground">
                  {fmtTanggal(g.date)}
                </p>
                <p className="font-semibold text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {g.description}
                </p>
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(g)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Ubah
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDel(g)}
                    data-ocid={`galeri_admin.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{edit ? "Ubah Foto" : "Tambah Foto"}</DialogTitle>
              <DialogDescription>
                Foto otomatis diperkecil agar ringan dibuka.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Foto{edit && " (kosongkan jika tidak diganti)"}</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden"
                data-ocid="galeri_admin.upload_button"
              >
                {image || edit ? (
                  <img
                    src={image ?? galeriImg(edit as GaleriItem)}
                    alt="Pratinjau"
                    className="w-full max-h-56 object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 py-8 text-sm text-muted-foreground">
                    <ImagePlus className="w-6 h-6" />
                    Pilih foto
                  </span>
                )}
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Judul</Label>
              <Input
                required
                minLength={3}
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-ocid="galeri_admin.title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi singkat</Label>
              <Textarea
                required
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                data-ocid="galeri_admin.description_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal kegiatan</Label>
              <Input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={busy}
                data-ocid="galeri_admin.save_button"
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus “{del?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto akan hilang dari galeri dan tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
