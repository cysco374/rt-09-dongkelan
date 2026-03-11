import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { Category, Status__1 } from "../backend.d";
import type { PengumumanData, PengurusData } from "../backend.d";
import {
  useListActivePengumuman,
  useListPengurus,
  useStatistics,
  useWebsiteSettings,
} from "../hooks/useQueries";

function categoryLabel(cat: Category) {
  switch (cat) {
    case Category.emergency:
      return { label: "Darurat", class: "badge-red" };
    case Category.important:
      return { label: "Penting", class: "badge-yellow" };
    default:
      return { label: "Umum", class: "badge-blue" };
  }
}

function PengumumanCard({
  item,
  index,
}: { item: PengumumanData; index: number }) {
  const cat = categoryLabel(item.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.class}`}
        >
          {cat.label}
        </span>
        <span className="text-xs text-muted-foreground">{item.date}</span>
      </div>
      <h3 className="font-bricolage font-semibold text-foreground mb-2 line-clamp-2">
        {item.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {item.content}
      </p>
      <div className="mt-3 text-xs text-muted-foreground">
        Oleh: {item.author}
      </div>
    </motion.div>
  );
}

function PengurusCard({ p, index }: { p: PengurusData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-5 text-center shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bricolage font-bold text-xl">
        {p.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)}
      </div>
      <h3 className="font-bricolage font-semibold text-foreground">{p.name}</h3>
      <p className="text-sm text-primary font-medium mt-1">{p.position}</p>
      <p className="text-xs text-muted-foreground mt-1">{p.period}</p>
      {p.phone && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
          <Phone className="w-3 h-3" />
          {p.phone}
        </p>
      )}
    </motion.div>
  );
}

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: pengumuman, isLoading: pengumumanLoading } =
    useListActivePengumuman();
  const { data: settings, isLoading: settingsLoading } = useWebsiteSettings();
  const { data: pengurus, isLoading: pengurusLoading } = useListPengurus();

  const latestPengumuman = (pengumuman || []).slice(0, 3);
  const pengurusList = (pengurus || []).slice(0, 6);

  // Fallback content
  const samplePengumuman: PengumumanData[] = [
    {
      id: "1",
      title: "Kerja Bakti Bersih Kampung",
      content:
        "Diberitahukan kepada seluruh warga RT 09 Dongkelan bahwa akan diadakan kerja bakti bersih kampung pada hari Minggu tanggal 10 Maret 2026 pukul 07.00 WIB. Kehadiran seluruh warga sangat diharapkan.",
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
        "Kepada seluruh warga RT 09 Dongkelan, kami mengingatkan kembali untuk segera melunasi iuran bulanan bulan Maret 2026. Pembayaran dapat dilakukan langsung kepada bendahara RT.",
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
        "Dalam rangka meningkatkan keamanan warga, pengurus RT 09 akan memasang CCTV di beberapa titik strategis di gang utama kampung. Pemasangan dijadwalkan mulai tanggal 15 Maret 2026.",
      category: Category.general,
      date: "2026-02-28",
      author: "Ketua RT 09",
      status: Status__1.active,
      createdAt: BigInt(0),
    },
  ];

  const samplePengurus: PengurusData[] = [
    {
      id: "1",
      name: "Bapak Suharto",
      position: "Ketua RT",
      phone: "0812-3456-7890",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
    {
      id: "2",
      name: "Ibu Sunarti",
      position: "Sekretaris",
      phone: "0813-4567-8901",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
    {
      id: "3",
      name: "Bapak Mulyadi",
      position: "Bendahara",
      phone: "0814-5678-9012",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
    {
      id: "4",
      name: "Bapak Hartono",
      position: "Seksi Keamanan",
      phone: "0815-6789-0123",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
    {
      id: "5",
      name: "Ibu Sari",
      position: "Seksi Sosial",
      phone: "0816-7890-1234",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
    {
      id: "6",
      name: "Bapak Agus",
      position: "Seksi Kebersihan",
      phone: "0817-8901-2345",
      period: "2024-2027",
      photo: "",
      createdAt: BigInt(0),
    },
  ];

  const displayPengumuman =
    latestPengumuman.length > 0 ? latestPengumuman : samplePengumuman;
  const displayPengurus =
    pengurusList.length > 0 ? pengurusList : samplePengurus;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-rt09-dongkelan.dim_1200x500.jpg')",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/80 to-sidebar/40" />
        {/* Batik pattern overlay */}
        <div className="absolute inset-0 batik-bg opacity-40" />

        <div className="relative container max-w-6xl mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 text-sidebar-primary mb-6 text-sm font-medium">
              <Home className="w-4 h-4" />
              Kampung Dongkelan
            </div>
            <h1 className="font-bricolage font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-4">
              RT 09
              <br />
              <span className="text-sidebar-primary">Dongkelan</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">
              {settings?.description ||
                "Sistem Informasi dan Manajemen RT 09 Kampung Dongkelan — Melayani warga dengan transparan, cepat, dan profesional."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-lg"
              >
                <Link to="/pengumuman">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Lihat Pengumuman
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link to="/login">
                  Login Admin
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsLoading ? (
              ["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
                <div key={k} className="text-center">
                  <Skeleton className="h-10 w-24 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-4 w-20 mx-auto bg-white/20" />
                </div>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="font-bricolage font-bold text-3xl text-primary-foreground">
                    {stats ? String(stats.totalWarga) : "247"}
                  </div>
                  <div className="text-primary-foreground/70 text-sm mt-1 flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    Total Warga
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <div className="font-bricolage font-bold text-3xl text-primary-foreground">
                    {stats ? String(stats.totalKK) : "83"}
                  </div>
                  <div className="text-primary-foreground/70 text-sm mt-1 flex items-center justify-center gap-1">
                    <Home className="w-4 h-4" />
                    Kartu Keluarga
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="font-bricolage font-bold text-3xl text-primary-foreground">
                    {stats ? String(stats.totalActivePengumuman) : "5"}
                  </div>
                  <div className="text-primary-foreground/70 text-sm mt-1 flex items-center justify-center gap-1">
                    <Bell className="w-4 h-4" />
                    Pengumuman Aktif
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="font-bricolage font-bold text-3xl text-primary-foreground">
                    RT 09
                  </div>
                  <div className="text-primary-foreground/70 text-sm mt-1">
                    Kampung Dongkelan
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Latest Announcements */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-bricolage font-bold text-2xl md:text-3xl text-foreground">
              Pengumuman Terbaru
            </h2>
            <p className="text-muted-foreground mt-1">
              Informasi penting untuk warga RT 09
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/pengumuman" data-ocid="nav.pengumuman_link">
              Lihat Semua
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {pengumumanLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["sk-a", "sk-b", "sk-c"].map((k) => (
              <div
                key={k}
                className="bg-card border border-border rounded-xl p-5"
              >
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayPengumuman.map((item, i) => (
              <PengumumanCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Vision & Mission */}
      {!settingsLoading && (
        <section className="batik-bg bg-secondary/30 py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-bricolage font-bold text-2xl md:text-3xl text-foreground">
                Tentang RT 09 Dongkelan
              </h2>
              <p className="text-muted-foreground mt-1 max-w-xl mx-auto">
                {settings?.description ||
                  "Bersama membangun kampung yang lebih baik"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="font-bricolage font-bold text-lg">V</span>
                </div>
                <h3 className="font-bricolage font-bold text-lg mb-3 text-foreground">
                  Visi
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {settings?.vision ||
                    "Mewujudkan kampung Dongkelan RT 09 yang aman, bersih, tertib, dan sejahtera dengan semangat kebersamaan dan gotong royong."}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="font-bricolage font-bold text-lg">M</span>
                </div>
                <h3 className="font-bricolage font-bold text-lg mb-3 text-foreground">
                  Misi
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {settings?.mission ||
                    "Meningkatkan kualitas pelayanan, keamanan lingkungan, dan kesejahteraan warga melalui program-program yang terorganisir dan transparan."}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* RT Officials */}
      <section className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-bricolage font-bold text-2xl md:text-3xl text-foreground">
            Pengurus RT 09
          </h2>
          <p className="text-muted-foreground mt-1">Periode 2024–2027</p>
        </div>

        {pengurusLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"].map((k) => (
              <div
                key={k}
                className="bg-card border border-border rounded-xl p-5 text-center"
              >
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayPengurus.map((p, i) => (
              <PengurusCard key={p.id} p={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="bg-sidebar text-sidebar-foreground py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-bricolage font-bold text-2xl md:text-3xl">
              Hubungi Kami
            </h2>
            <p className="text-sidebar-foreground/70 mt-1">
              Kami siap melayani pertanyaan dan kebutuhan Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-5 rounded-xl bg-sidebar-accent"
            >
              <MapPin className="w-8 h-8 text-sidebar-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Alamat</h3>
              <p className="text-sidebar-foreground/70 text-sm">
                {settings?.fullAddress ||
                  "Kampung Dongkelan RT 09, Yogyakarta, DIY 55152"}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-5 rounded-xl bg-sidebar-accent"
            >
              <Phone className="w-8 h-8 text-sidebar-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Telepon</h3>
              <p className="text-sidebar-foreground/70 text-sm">
                {settings?.headPhone || "0812-3456-7890"}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-5 rounded-xl bg-sidebar-accent"
            >
              <Mail className="w-8 h-8 text-sidebar-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sidebar-foreground/70 text-sm">
                {settings?.email || "rt09.dongkelan@gmail.com"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
