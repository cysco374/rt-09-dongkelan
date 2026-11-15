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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type AppUser, api, roleLabel } from "../../api/client";
import { sha256 } from "../../utils/hash";

const ROLE_INFO: Record<AppUser["role"], string> = {
  ketua:
    "Semua data: warga, KK, iuran, pengumuman, aset, surat, laporan, pengaturan, dan akun",
  bendahara: "Iuran dan laporan keuangan (data warga hanya dibaca)",
  sekretaris: "Warga, KK, pengumuman, aset, surat, pengurus; laporan dibaca",
};

type FormState = {
  username: string;
  name: string;
  role: AppUser["role"];
  password: string;
};
const emptyForm: FormState = {
  username: "",
  name: "",
  role: "sekretaris",
  password: "",
};

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const a = new Uint32Array(10);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => chars[n % chars.length]).join("");
}

export default function PenggunaPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.listUsers(),
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AppUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState<AppUser | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [del, setDel] = useState<AppUser | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const fail = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");

  const openAdd = () => {
    setEdit(null);
    setForm({ ...emptyForm, password: genPassword() });
    setOpen(true);
  };
  const openEdit = (u: AppUser) => {
    setEdit(u);
    setForm({ username: u.username, name: u.name, role: u.role, password: "" });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (edit) {
        await api.updateUser({
          username: edit.username,
          name: form.name.trim(),
          role: form.role,
        });
        toast.success("Akun diperbarui");
      } else {
        if (form.password.length < 6) {
          toast.error("Password minimal 6 karakter");
          return;
        }
        await api.addUser({
          username: form.username.trim().toLowerCase(),
          name: form.name.trim(),
          role: form.role,
          passwordHash: await sha256(form.password),
        });
        toast.success(`Akun dibuat. Catat password awal: ${form.password}`, {
          duration: 15000,
        });
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (u: AppUser) => {
    try {
      await api.updateUser({ username: u.username, disabled: !u.disabled });
      toast.success(u.disabled ? "Akun diaktifkan" : "Akun dinonaktifkan");
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const doReset = async () => {
    if (!reset) return;
    if (resetPw.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setBusy(true);
    try {
      await api.resetUserPassword(reset.username, await sha256(resetPw));
      toast.success(`Password ${reset.username} direset: ${resetPw}`, {
        duration: 15000,
      });
      setReset(null);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!del) return;
    try {
      await api.deleteUser(del.username);
      toast.success("Akun dihapus");
      setDel(null);
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Akun Pengurus
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Beri akses login untuk Ketua RT, Bendahara, dan Sekretaris.
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="pengguna.add_button">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Akun
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(ROLE_INFO) as AppUser["role"][]).map((r) => (
          <div key={r} className="rounded-xl border border-border bg-card p-4">
            <p className="font-bricolage font-semibold">{roleLabel[r]}</p>
            <p className="text-xs text-muted-foreground mt-1">{ROLE_INFO[r]}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="pengguna.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                    data-ocid="pengguna.empty_state"
                  >
                    Belum ada akun pengurus. Klik “Tambah Akun”.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, i) => (
                  <TableRow
                    key={u.username}
                    data-ocid={`pengguna.row.${i + 1}`}
                  >
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.username}
                    </TableCell>
                    <TableCell>{roleLabel[u.role]}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.disabled ? "badge-red" : "badge-green"
                        }`}
                      >
                        {u.disabled ? "Nonaktif" : "Aktif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ubah"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset password"
                        onClick={() => {
                          setReset(u);
                          setResetPw(genPassword());
                        }}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(u)}
                      >
                        {u.disabled ? "Aktifkan" : "Nonaktifkan"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus"
                        className="text-destructive"
                        onClick={() => setDel(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{edit ? "Ubah Akun" : "Tambah Akun"}</DialogTitle>
              <DialogDescription>
                {edit
                  ? "Ubah nama dan peran. Perubahan peran berlaku seketika."
                  : "Username dipakai untuk login (huruf kecil, angka, titik)."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Nama lengkap</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-ocid="pengguna.name_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                required
                disabled={!!edit}
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/\s/g, ""),
                  })
                }
                placeholder="mis. bendahara.rt09"
                autoComplete="off"
                data-ocid="pengguna.username_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm({ ...form, role: v as AppUser["role"] })
                }
              >
                <SelectTrigger data-ocid="pengguna.role_select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_INFO) as AppUser["role"][]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_INFO[form.role]}
              </p>
            </div>
            {!edit && (
              <div className="space-y-1.5">
                <Label>Password awal</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    autoComplete="off"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm({ ...form, password: genPassword() })
                    }
                  >
                    Acak
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Berikan ke yang bersangkutan; ia bisa menggantinya di menu
                  Pengaturan.
                </p>
              </div>
            )}
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
                data-ocid="pengguna.save_button"
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reset} onOpenChange={(o) => !o && setReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Password baru untuk {reset?.name} ({reset?.username}).
            </DialogDescription>
          </DialogHeader>
          <Input
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            className="font-mono"
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReset(null)}>
              Batal
            </Button>
            <Button onClick={doReset} disabled={busy}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun {del?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun tidak bisa login lagi. Untuk sementara, lebih aman memakai
              “Nonaktifkan”.
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
