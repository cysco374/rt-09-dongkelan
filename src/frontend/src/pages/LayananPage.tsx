import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  Loader2,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import type { PortalLookup } from "../api/client";
import { Status, Status__2, Type, Type__1 } from "../backend.d";
import type { IuranData, SuratData } from "../backend.d";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const iuranLabel: Record<Type__1, string> = {
  [Type__1.monthly]: "Iuran Bulanan",
  [Type__1.security]: "Keamanan",
  [Type__1.cleaning]: "Kebersihan",
  [Type__1.social]: "Sosial",
};

const suratLabel: Record<Type, string> = {
  [Type.domicile]: "Surat Keterangan Domisili",
  [Type.poor]: "Surat Keterangan Tidak Mampu",
  [Type.ktp]: "Pengantar KTP",
  [Type.kk]: "Pengantar Kartu Keluarga",
  [Type.other]: "Surat Lainnya",
};

const statusSurat: Record<Status, { label: string; cls: string }> = {
  [Status.waiting]: { label: "Menunggu", cls: "badge-yellow" },
  [Status.processing]: { label: "Diproses", cls: "badge-blue" },
  [Status.finished]: { label: "Selesai", cls: "badge-green" },
  [Status.rejected]: { label: "Ditolak", cls: "badge-red" },
};

const rp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

function IuranTab({ iuran }: { iuran: IuranData[] }) {
  const mine = useMemo(
    () =>
      [...iuran].sort(
        (a, b) =>
          Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month),
      ),
    [iuran],
  );
  const tunggakan = mine
    .filter((i) => i.status === Status__2.unpaid)
    .reduce((s, i) => s + Number(i.total), 0);
  const lunas = mine
    .filter((i) => i.status === Status__2.paid)
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary/10 p-4">
          <p className="text-xs text-muted-foreground">Sudah dibayar</p>
          <p className="font-bricolage font-bold text-lg text-primary">
            {rp(lunas)}
          </p>
        </div>
        <div className="rounded-xl bg-destructive/10 p-4">
          <p className="text-xs text-muted-foreground">Tunggakan</p>
          <p className="font-bricolage font-bold text-lg text-destructive">
            {rp(tunggakan)}
          </p>
        </div>
      </div>
      {mine.length === 0 ? (
        <p
          className="text-center text-sm text-muted-foreground py-8"
          data-ocid="layanan.iuran.empty_state"
        >
          Belum ada catatan iuran untuk Anda.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {mine.map((i, idx) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
              data-ocid={`layanan.iuran.item.${idx + 1}`}
            >
              <div>
                <p className="text-sm font-medium">
                  {iuranLabel[i.iuranType]} ·{" "}
                  {BULAN[Number(i.month) - 1] ?? String(i.month)}{" "}
                  {String(i.year)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {i.status === Status__2.paid && i.paymentDate
                    ? `Dibayar ${i.paymentDate}`
                    : "Belum dibayar"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{rp(Number(i.total))}</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    i.status === Status__2.paid ? "badge-green" : "badge-red"
                  }`}
                >
                  {i.status === Status__2.paid ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {i.status === Status__2.paid ? "Lunas" : "Belum lunas"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SuratTab({
  nik,
  surat,
  onSubmitted,
}: { nik: string; surat: SuratData[]; onSubmitted: () => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [jenis, setJenis] = useState<Type>(Type.domicile);
  const [keperluan, setKeperluan] = useState("");

  const mine = useMemo(
    () => [...surat].sort((a, b) => b.requestDate.localeCompare(a.requestDate)),
    [surat],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keperluan.trim()) {
      toast.error("Keperluan surat wajib diisi.");
      return;
    }
    setPending(true);
    try {
      await api.portalSubmitSurat(nik, jenis, keperluan.trim());
      setKeperluan("");
      await onSubmitted();
      toast.success("Pengajuan terkirim. Pengurus RT akan memprosesnya.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengirim pengajuan.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={submit} className="space-y-4">
        <h3 className="font-bricolage font-semibold flex items-center gap-2">
          <FilePlus2 className="w-4 h-4 text-primary" /> Ajukan surat baru
        </h3>
        <div className="space-y-1.5">
          <Label>Jenis surat</Label>
          <Select value={jenis} onValueChange={(v) => setJenis(v as Type)}>
            <SelectTrigger data-ocid="layanan.surat.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Type).map((t) => (
                <SelectItem key={t} value={t}>
                  {suratLabel[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="keperluan">Keperluan</Label>
          <Textarea
            id="keperluan"
            value={keperluan}
            onChange={(e) => setKeperluan(e.target.value)}
            placeholder="Contoh: persyaratan melamar pekerjaan"
            rows={4}
            data-ocid="layanan.surat.textarea"
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="w-full"
          data-ocid="layanan.surat.submit_button"
        >
          {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Kirim pengajuan
        </Button>
      </form>

      <div>
        <h3 className="font-bricolage font-semibold flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" /> Status pengajuan Anda
        </h3>
        {mine.length === 0 ? (
          <p
            className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center"
            data-ocid="layanan.surat.empty_state"
          >
            Belum ada pengajuan surat.
          </p>
        ) : (
          <ul className="space-y-2">
            {mine.map((s, idx) => (
              <li
                key={s.id}
                className="rounded-xl border border-border bg-card p-3"
                data-ocid={`layanan.surat.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {suratLabel[s.suratType]}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusSurat[s.status].cls}`}
                  >
                    {statusSurat[s.status].label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diajukan {s.requestDate}
                  {s.completionDate ? ` · Selesai ${s.completionDate}` : ""}
                </p>
                {s.notes && (
                  <p className="text-xs mt-1 text-foreground/80">
                    Catatan RT: {s.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function LayananPage() {
  const [nik, setNik] = useState("");
  const [data, setData] = useState<PortalLookup | null>(null);
  const [checkedNik, setCheckedNik] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (n: string) => {
    const res = await api.portalLookup(n);
    setData(res);
    setCheckedNik(n);
    setError(
      res
        ? null
        : "NIK tidak ditemukan. Hubungi pengurus RT untuk pendaftaran data.",
    );
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lookup(nik.trim());
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : "Gagal memuat data. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const warga = data?.warga ?? null;
  const notFound = !!error;

  return (
    <div className="page-gradient">
      <section className="hero-mesh text-white">
        <div className="container max-w-6xl mx-auto px-4 py-14 md:py-20">
          <p className="eyebrow !text-sidebar-primary">Layanan Warga</p>
          <h1 className="font-bricolage font-bold text-3xl md:text-5xl mt-2 max-w-2xl leading-tight">
            Urus iuran dan surat tanpa antre.
          </h1>
          <p className="text-white/75 mt-3 max-w-xl">
            Masukkan NIK yang terdaftar di RT 09 untuk melihat riwayat iuran,
            mengajukan surat pengantar, dan memantau statusnya.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 -mt-8 pb-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl shadow-card-hover p-5 md:p-6"
        >
          <form onSubmit={verify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                inputMode="numeric"
                value={nik}
                onChange={(e) => {
                  setNik(e.target.value.replace(/\D/g, "").slice(0, 16));
                  setError(null);
                }}
                placeholder="Masukkan 16 digit NIK"
                className="pl-9 h-11"
                data-ocid="layanan.nik.input"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={nik.length < 16 || loading}
              data-ocid="layanan.nik.submit_button"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verifikasi
            </Button>
          </form>
          {notFound && (
            <p
              className="text-sm text-destructive mt-3"
              data-ocid="layanan.nik.error_state"
            >
              {error}
            </p>
          )}
        </motion.div>

        {warga && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-2xl shadow-card p-5 md:p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bricolage font-bold">
                {warga.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-bricolage font-semibold">{warga.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  KK {warga.kkNumber || "-"} · {warga.address}
                </p>
              </div>
            </div>
            <Tabs defaultValue="iuran">
              <TabsList className="grid grid-cols-2 w-full md:w-80">
                <TabsTrigger value="iuran" data-ocid="layanan.iuran.tab">
                  <Wallet className="w-4 h-4 mr-1.5" /> Iuran
                </TabsTrigger>
                <TabsTrigger value="surat" data-ocid="layanan.surat.tab">
                  <FilePlus2 className="w-4 h-4 mr-1.5" /> Surat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="iuran" className="mt-5">
                <IuranTab iuran={data?.iuran ?? []} />
              </TabsContent>
              <TabsContent value="surat" className="mt-5">
                <SuratTab
                  nik={checkedNik}
                  surat={data?.surat ?? []}
                  onSubmitted={() => lookup(checkedNik)}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}
