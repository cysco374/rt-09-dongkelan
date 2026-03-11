import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Category, Status__1 } from "../backend.d";
import type { PengumumanData } from "../backend.d";
import { useListActivePengumuman } from "../hooks/useQueries";

function categoryConfig(cat: Category) {
  switch (cat) {
    case Category.emergency:
      return { label: "Darurat", className: "badge-red" };
    case Category.important:
      return { label: "Penting", className: "badge-yellow" };
    default:
      return { label: "Umum", className: "badge-blue" };
  }
}

const sampleData: PengumumanData[] = [
  {
    id: "1",
    title: "Kerja Bakti Bersih Kampung",
    content:
      "Diberitahukan kepada seluruh warga RT 09 Dongkelan bahwa akan diadakan kerja bakti bersih kampung pada hari Minggu tanggal 10 Maret 2026 pukul 07.00 WIB. Mohon membawa peralatan kebersihan masing-masing. Kehadiran seluruh warga sangat diharapkan demi menjaga kebersihan dan keindahan lingkungan kita bersama.",
    category: Category.important,
    date: "2026-03-05",
    author: "Ketua RT 09",
    status: Status__1.active,
    createdAt: BigInt(0),
  },
  {
    id: "2",
    title: "Pengumuman Iuran Bulan Maret 2026",
    content:
      "Kepada seluruh warga RT 09 Dongkelan, kami mengingatkan kembali untuk segera melunasi iuran bulanan bulan Maret 2026. Iuran wajib sebesar Rp 25.000 per bulan. Pembayaran dapat dilakukan langsung kepada bendahara RT setiap hari Sabtu pukul 09.00 - 12.00 WIB.",
    category: Category.general,
    date: "2026-03-01",
    author: "Bendahara RT 09",
    status: Status__1.active,
    createdAt: BigInt(0),
  },
  {
    id: "3",
    title: "Pemasangan CCTV di Gang Utama",
    content:
      "Dalam rangka meningkatkan keamanan warga, pengurus RT 09 akan memasang CCTV di beberapa titik strategis di gang utama kampung. Pemasangan dijadwalkan mulai tanggal 15 Maret 2026. Warga diharapkan tidak menghalangi proses pemasangan.",
    category: Category.general,
    date: "2026-02-28",
    author: "Ketua RT 09",
    status: Status__1.active,
    createdAt: BigInt(0),
  },
  {
    id: "4",
    title: "PENTING: Waspada Penipuan Berkedok Petugas",
    content:
      "Telah beredar kabar adanya oknum yang mengaku sebagai petugas RT dan meminta sumbangan atau dokumen dari warga. Kami menghimbau seluruh warga agar waspada dan segera melaporkan kepada pengurus RT jika menemukan hal mencurigakan.",
    category: Category.emergency,
    date: "2026-02-25",
    author: "Ketua RT 09",
    status: Status__1.active,
    createdAt: BigInt(0),
  },
  {
    id: "5",
    title: "Pendaftaran Program Bantuan Sosial",
    content:
      "Kepada warga yang memenuhi syarat penerima bantuan sosial, silakan mendaftarkan diri ke sekretariat RT mulai tanggal 1 hingga 20 Maret 2026. Bawa KTP, KK, dan surat keterangan tidak mampu dari kelurahan.",
    category: Category.important,
    date: "2026-02-20",
    author: "Sekretaris RT 09",
    status: Status__1.active,
    createdAt: BigInt(0),
  },
];

export default function PengumumanPublicPage() {
  const { data: pengumuman, isLoading } = useListActivePengumuman();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");

  const displayData =
    pengumuman && pengumuman.length > 0 ? pengumuman : sampleData;

  const filtered = displayData.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || item.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bricolage font-bold text-2xl md:text-3xl text-foreground">
              Pengumuman
            </h1>
            <p className="text-muted-foreground text-sm">
              Informasi dan pemberitahuan resmi RT 09
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengumuman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="pengumuman.search_input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                "all",
                Category.general,
                Category.important,
                Category.emergency,
              ] as const
            ).map((cat) => {
              const labels = {
                all: "Semua",
                [Category.general]: "Umum",
                [Category.important]: "Penting",
                [Category.emergency]: "Darurat",
              };
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterCat === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {labels[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
            <div
              key={k}
              className="bg-card border border-border rounded-xl p-6"
            >
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-6 w-2/3 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="pengumuman.empty_state"
        >
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Tidak ada pengumuman ditemukan</p>
          <p className="text-sm mt-1">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, i) => {
            const cat = categoryConfig(item.category);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
                data-ocid={`pengumuman.item.${i + 1}`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.className}`}
                  >
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Oleh: {item.author}
                  </span>
                </div>
                <h2 className="font-bricolage font-bold text-lg text-foreground mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.content}
                </p>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
