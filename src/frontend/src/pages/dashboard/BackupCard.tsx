import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type RestoreSummary, api } from "../../api/client";

const LABEL: Record<string, string> = {
  warga: "Warga",
  kk: "Kartu Keluarga",
  iuran: "Iuran",
  pengumuman: "Pengumuman",
  surat: "Surat",
  fasilitas: "Fasilitas & Aset",
  pengurus: "Pengurus",
  feedback: "Kritik & Saran",
  galeri: "Galeri",
  "galeri-img": "Foto galeri lama",
  user: "Akun pengurus",
  settings: "Pengaturan situs",
};

export default function BackupCard() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"" | "export" | "check" | "restore">("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [preview, setPreview] = useState<RestoreSummary | null>(null);
  const [confirm, setConfirm] = useState("");

  const fail = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");

  const doExport = async () => {
    setBusy("export");
    try {
      const json = await api.exportBackup();
      const url = URL.createObjectURL(
        new Blob([json], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-rt09-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        "Backup diunduh. Simpan di tempat aman (berisi data pribadi warga).",
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  const check = async (t: string, m: "replace" | "merge") => {
    setBusy("check");
    try {
      setPreview(await api.restoreBackup(t, m, true));
    } catch (e) {
      setPreview(null);
      fail(e);
    } finally {
      setBusy("");
    }
  };

  const pick = async (f?: File) => {
    if (!f) return;
    if (f.size > 4_500_000)
      return toast.error("Berkas terlalu besar (maks 4,5 MB)");
    const t = await f.text();
    setText(t);
    setFileName(f.name);
    setConfirm("");
    await check(t, mode);
  };

  const changeMode = async (m: "replace" | "merge") => {
    setMode(m);
    if (text) await check(text, m);
  };

  const doRestore = async () => {
    setBusy("restore");
    try {
      const r = await api.restoreBackup(text, mode, false);
      toast.success(
        `Restore selesai${r.dihapus ? `, ${r.dihapus} data lain dihapus` : ""}.`,
      );
      setPreview(null);
      setText("");
      setFileName("");
      setConfirm("");
      if (fileRef.current) fileRef.current.value = "";
      await qc.invalidateQueries();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bricolage flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4 text-primary" />
          Backup &amp; Restore Data
        </CardTitle>
        <CardDescription>
          Unduh salinan seluruh data, atau pulihkan dari berkas backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Button
            onClick={doExport}
            disabled={busy !== ""}
            data-ocid="backup.export_button"
          >
            {busy === "export" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Unduh Backup (.json)
          </Button>
          <p className="text-xs text-muted-foreground">
            Berisi NIK dan nomor HP warga — simpan di tempat aman. Kata sandi
            admin tidak ikut; foto galeri tetap di Cloudinary.
          </p>
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <Label>Restore dari berkas backup</Label>
          <Input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => pick(e.target.files?.[0])}
            data-ocid="backup.file_input"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [
                  "replace",
                  "Timpa penuh",
                  "Data yang tidak ada di backup dihapus. Persis seperti saat backup.",
                ],
                [
                  "merge",
                  "Gabung",
                  "Hanya menambah dan memperbarui. Tidak ada yang dihapus.",
                ],
              ] as const
            ).map(([v, t, d]) => (
              <button
                type="button"
                key={v}
                onClick={() => changeMode(v)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  mode === v
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-semibold text-sm">{t}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{d}</p>
              </button>
            ))}
          </div>

          {busy === "check" && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa berkas…
            </p>
          )}
          {preview && (
            <div className="rounded-xl bg-secondary/60 p-4 text-sm space-y-2">
              <p className="font-semibold">
                {fileName}
                {preview.exportedAt &&
                  ` · dibuat ${new Date(preview.exportedAt).toLocaleString("id-ID")}`}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                {Object.entries(preview.jumlah).map(([k, n]) => (
                  <li key={k} className="flex justify-between">
                    <span>{LABEL[k] ?? k}</span>
                    <b>{n}</b>
                  </li>
                ))}
              </ul>
              {mode === "replace" && (
                <p className="text-xs text-destructive font-medium">
                  {preview.dihapus} data yang ada sekarang tidak ada di backup
                  dan akan DIHAPUS. Akun pengurus juga ikut diganti; jika akun
                  Anda tidak ada di backup, Anda harus login ulang sebagai
                  admin.
                </p>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirm(" ")}
                disabled={busy !== ""}
                data-ocid="backup.restore_button"
              >
                <Upload className="w-4 h-4 mr-2" />
                Pulihkan Data…
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog
        open={confirm !== ""}
        onOpenChange={(o) => !o && setConfirm("")}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan data dari backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Mode <b>{mode === "replace" ? "Timpa penuh" : "Gabung"}</b>.
              Tindakan ini tidak bisa dibatalkan. Disarankan{" "}
              <b>unduh backup terbaru</b> dulu. Ketik <b>PULIHKAN</b> untuk
              melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirm.trim() === "" ? "" : confirm}
            onChange={(e) => setConfirm(e.target.value || " ")}
            placeholder="PULIHKAN"
            autoComplete="off"
            data-ocid="backup.confirm_input"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirm.trim() !== "PULIHKAN" || busy !== ""}
              onClick={doRestore}
              data-ocid="backup.confirm_button"
            >
              {busy === "restore" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Pulihkan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
