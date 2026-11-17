import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Images } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { type GaleriItem, api, galeriImg } from "../api/client";

export const fmtTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function GaleriPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["galeri"],
    queryFn: () => api.listGaleri(),
  });
  const [open, setOpen] = useState<GaleriItem | null>(null);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="eyebrow">Dokumentasi</p>
        <h1 className="font-bricolage font-bold text-3xl md:text-4xl text-foreground flex items-center gap-3 mt-1">
          <Images className="w-8 h-8 text-primary" />
          Galeri Kegiatan Warga
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Momen kebersamaan warga RT 09 Dongkelan: kerja bakti, ronda, hingga
          perayaan kampung.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p
          className="text-center text-muted-foreground py-16 border border-dashed border-border rounded-2xl"
          data-ocid="galeri.empty_state"
        >
          Belum ada foto kegiatan.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((g, i) => (
            <motion.button
              type="button"
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.05 }}
              onClick={() => setOpen(g)}
              className="group text-left bg-card border border-border rounded-2xl overflow-hidden shadow-card card-lift"
              data-ocid={`galeri.item.${i + 1}`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={galeriImg(g)}
                  alt={g.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {fmtTanggal(g.date)}
                </p>
                <h3 className="font-bricolage font-semibold text-lg mt-1">
                  {g.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {g.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {open && (
            <>
              <img
                src={galeriImg(open)}
                alt={open.title}
                className="w-full max-h-[70vh] object-contain bg-black/90"
              />
              <div className="p-5">
                <DialogTitle className="font-bricolage text-xl">
                  {open.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmtTanggal(open.date)}
                </p>
                <DialogDescription className="text-sm text-foreground/80 mt-2 whitespace-pre-line">
                  {open.description}
                </DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
