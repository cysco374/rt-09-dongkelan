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
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FilePen,
  FolderOpen,
  Hash,
  Loader2,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";
import { type SuratKeluar, api, getSession } from "../../api/client";
import SuratPreview from "../../components/SuratPreview";
import {
  type SuratType,
  TEMPLATES,
  templateById,
  tglPanjang,
} from "../../lib/suratTemplates";

const LOGO = "/assets/logo-kop.png";
const TTD_KEY = "rt09_ttd";

const todayWib = () =>
  new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

function defaultsFor(type: SuratType, role?: string, name?: string) {
  const t = templateById(type);
  return {
    ...t.defaults,
    signerTitle: role === "ketua" ? "Ketua RT 09" : "Sekretaris",
    signerName: name && name !== "admin" ? name : "",
  } as Record<string, string>;
}

function printLetter(html: string) {
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const doc = f.contentDocument;
  const win = f.contentWindow;
  if (!doc || !win) return;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Surat</title>
<style>@page{size:A4;margin:0}html,body{margin:0;padding:0}img{max-width:100%}</style></head><body>${html}</body></html>`,
  );
  doc.close();
  const go = () => {
    win.focus();
    win.print();
    setTimeout(() => f.remove(), 1500);
  };
  const imgs = Array.from(doc.images);
  if (imgs.every((i) => i.complete)) setTimeout(go, 150);
  else {
    let n = imgs.filter((i) => !i.complete).length;
    const done = () => --n <= 0 && setTimeout(go, 100);
    for (const i of imgs) {
      if (!i.complete) {
        i.onload = done;
        i.onerror = done;
      }
    }
  }
}

export default function TemplateSuratPage() {
  const qc = useQueryClient();
  const session = getSession();
  const [type, setType] = useState<SuratType>("rapat");
  const [fields, setFields] = useState<Record<string, string>>(() =>
    defaultsFor("rapat", session?.r, session?.n),
  );
  const [saved, setSaved] = useState<SuratKeluar | null>(null);
  const [busy, setBusy] = useState(false);
  const [ttd, setTtd] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(TTD_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  });
  const [del, setDel] = useState<SuratKeluar | null>(null);
  const [numOpen, setNumOpen] = useState(false);
  const [numVal, setNumVal] = useState("");
  const ttdRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  const { data: arsip = [] } = useQuery({
    queryKey: ["suratkeluar"],
    queryFn: async () => (await api.listSuratkeluar()).reverse(),
  });
  const { data: peek } = useQuery({
    queryKey: ["suratkeluar", "peek", arsip.length],
    queryFn: () => api.peekNomorSurat(),
  });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setScale(Math.min(1, (el.clientWidth - 8) / 794)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tpl = templateById(type);
  const set = (k: string, val: string) =>
    setFields((f) => ({ ...f, [k]: val }));

  const switchType = (t: SuratType) => {
    setType(t);
    setSaved(null);
    setFields(defaultsFor(t, session?.r, session?.n));
  };

  const nomor = saved?.nomor ?? (peek ? `${peek.nomor}` : "………/……/………");
  const tanggal = saved?.tanggal ?? todayWib();

  const props = useMemo(
    () => ({
      type,
      fields,
      nomor,
      tanggal,
      signerTitle: fields.signerTitle ?? "",
      signerName: fields.signerName ?? "",
      signatureUrl: ttd,
      logoUrl: `${window.location.origin}${LOGO}`,
    }),
    [type, fields, nomor, tanggal, ttd],
  );

  const persist = async (): Promise<SuratKeluar | null> => {
    if (!fields.hal?.trim()) {
      toast.error("Isi kolom Hal terlebih dahulu");
      return null;
    }
    setBusy(true);
    try {
      const rec = await api.saveSuratKeluar({ id: saved?.id, type, fields });
      const next: SuratKeluar = { ...rec, fields };
      setSaved(next);
      await qc.invalidateQueries({ queryKey: ["suratkeluar"] });
      return next;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const doSave = async () => {
    const r = await persist();
    if (r) toast.success(`Surat tersimpan · Nomor ${r.nomor}`);
  };

  const doPrint = async () => {
    const r = await persist();
    if (!r) return;
    printLetter(
      renderToStaticMarkup(
        <SuratPreview {...props} nomor={r.nomor} tanggal={r.tanggal} />,
      ),
    );
  };

  const openRec = (r: SuratKeluar) => {
    setType(r.type);
    setFields(r.fields);
    setSaved(r);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const printRec = (r: SuratKeluar) =>
    printLetter(
      renderToStaticMarkup(
        <SuratPreview
          type={r.type}
          fields={r.fields}
          nomor={r.nomor}
          tanggal={r.tanggal}
          signerTitle={r.fields.signerTitle ?? ""}
          signerName={r.fields.signerName ?? ""}
          signatureUrl={ttd}
          logoUrl={`${window.location.origin}${LOGO}`}
        />,
      ),
    );

  const pickTtd = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 400_000)
      return toast.error("Pilih gambar tanda tangan (PNG/JPG, maks 400 KB)");
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      setTtd(url);
      try {
        localStorage.setItem(TTD_KEY, url);
      } catch {
        toast.message("Tanda tangan dipakai untuk sesi ini saja");
      }
    };
    r.readAsDataURL(f);
  };

  const saveNum = async () => {
    try {
      const n = await api.setNomorSuratBerikutnya(Number(numVal));
      toast.success(`Nomor berikutnya: ${n}`);
      setNumOpen(false);
      await qc.invalidateQueries({ queryKey: ["suratkeluar"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    }
  };

  const doDelete = async () => {
    if (!del) return;
    try {
      await api.deleteSuratkeluar(del.id);
      if (saved?.id === del.id) setSaved(null);
      toast.success("Surat dihapus dari arsip");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["suratkeluar"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-xl flex items-center gap-2">
            <FilePen className="w-5 h-5 text-primary" />
            Template Surat
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Isi data, nomor dan tanggal terisi otomatis. Cetak atau simpan
            sebagai PDF.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNumVal(String(peek?.seq ?? 1));
            setNumOpen(true);
          }}
        >
          <Hash className="w-4 h-4 mr-1.5" />
          Nomor berikutnya: {peek?.nomor ?? "…"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => switchType(t.id)}
            className={`text-left rounded-xl border p-3.5 transition-colors ${
              type === t.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
            data-ocid={`template.${t.id}`}
          >
            <p className="font-bricolage font-semibold text-sm">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl shadow-card p-4 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">
              {saved ? `Surat ${saved.nomor}` : "Surat baru"}
            </p>
            {saved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchType(type)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Surat baru
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Hal</Label>
            <Input
              value={fields.hal ?? ""}
              onChange={(e) => set("hal", e.target.value)}
              data-ocid="template.hal_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kepada</Label>
            <Input
              value={fields.kepada ?? ""}
              placeholder="Yth. Bpk/ Ibu/ Sdr./ Sdri"
              onChange={(e) => set("kepada", e.target.value)}
            />
          </div>
          {tpl.fields.map((fd) => (
            <div className="space-y-1.5" key={fd.key}>
              <Label>{fd.label}</Label>
              {fd.kind === "date" ? (
                <Input
                  type="date"
                  value={fields[fd.key] ?? ""}
                  onChange={(e) => set(fd.key, e.target.value)}
                />
              ) : (
                <Input
                  value={fields[fd.key] ?? ""}
                  placeholder={fd.placeholder}
                  onChange={(e) => set(fd.key, e.target.value)}
                />
              )}
              {fd.kind === "date" && fields[fd.key] && (
                <p className="text-xs text-muted-foreground">
                  {tglPanjang(fields[fd.key])}
                </p>
              )}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Note (satu baris per catatan)</Label>
            <Textarea
              rows={4}
              value={fields.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
              data-ocid="template.note_input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label>Jabatan penandatangan</Label>
              <Input
                value={fields.signerTitle ?? ""}
                onChange={(e) => set("signerTitle", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nama penandatangan</Label>
              <Input
                value={fields.signerName ?? ""}
                onChange={(e) => set("signerName", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={ttdRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => pickTtd(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => ttdRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {ttd ? "Ganti tanda tangan" : "Unggah tanda tangan"}
            </Button>
            {ttd && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTtd(undefined);
                  try {
                    localStorage.removeItem(TTD_KEY);
                  } catch {
                    /* abaikan */
                  }
                }}
              >
                Hapus
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Gambar tanda tangan (PNG transparan paling bagus) hanya disimpan di
            browser ini.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={doPrint}
              disabled={busy}
              className="flex-1"
              data-ocid="template.print_button"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Simpan &amp; Cetak
            </Button>
            <Button
              variant="outline"
              onClick={doSave}
              disabled={busy}
              data-ocid="template.save_button"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Di jendela cetak pilih “Simpan sebagai PDF” untuk berkas PDF. Nomor
            baru dipakai saat surat disimpan.
          </p>
        </div>

        {/* Pratinjau */}
        <div ref={boxRef} className="min-w-0">
          <div className="rounded-xl border border-border bg-muted/40 p-1 overflow-hidden">
            <div
              style={{
                width: 794 * scale,
                height: 1123 * scale,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: 794,
                }}
                className="shadow-lg"
              >
                <SuratPreview {...props} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arsip */}
      <div>
        <h2 className="font-bricolage font-semibold text-lg mb-3">
          Arsip Surat Keluar
        </h2>
        {arsip.length === 0 ? (
          <p
            className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl"
            data-ocid="template.empty_state"
          >
            Belum ada surat tersimpan.
          </p>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card divide-y divide-border">
            {arsip.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
                data-ocid={`template.arsip.${i + 1}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {r.nomor}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {templateById(r.type).label}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.fields.hal} · {tglPanjang(r.tanggal)} · {r.createdBy}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRec(r)}
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1" />
                    Buka
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printRec(r)}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Cetak
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDel(r)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={numOpen} onOpenChange={setNumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur nomor surat berikutnya</DialogTitle>
            <DialogDescription>
              Untuk melanjutkan penomoran dari buku agenda lama. Berlaku untuk
              tahun ini; tahun baru kembali mulai dari 0001.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            min={1}
            max={9999}
            value={numVal}
            onChange={(e) => setNumVal(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNumOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveNum}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus surat {del?.nomor}?</AlertDialogTitle>
            <AlertDialogDescription>
              Surat dihapus dari arsip. Nomornya tidak dipakai ulang otomatis.
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
