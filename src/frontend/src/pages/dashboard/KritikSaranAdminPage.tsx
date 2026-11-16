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
import { Input } from "@/components/ui/input";
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
import { MessageSquareText, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type FeedbackFull, api, getSession } from "../../api/client";
import { fmtDate } from "../KritikSaranPage";

function waLink(phone: string) {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.startsWith("0") ? `62${d.slice(1)}` : d}`;
}

export default function KritikSaranAdminPage() {
  const qc = useQueryClient();
  const role = getSession()?.r;
  const canDelete =
    role === "admin" || role === "ketua" || role === "sekretaris";
  const { data = [], isLoading } = useQuery({
    queryKey: ["feedback", "full"],
    queryFn: async () => (await api.listFeedback()).reverse(),
  });
  const [q, setQ] = useState("");
  const [del, setDel] = useState<FeedbackFull | null>(null);

  const rows = data.filter((f) =>
    `${f.name} ${f.phone} ${f.message}`.toLowerCase().includes(q.toLowerCase()),
  );

  const doDelete = async () => {
    if (!del) return;
    try {
      await api.deleteFeedback(del.id);
      toast.success("Masukan dihapus");
      setDel(null);
      await qc.invalidateQueries({ queryKey: ["feedback"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bricolage font-bold text-xl flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-primary" />
          Kritik &amp; Saran
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Masukan warga langsung tampil di portal.{" "}
          {canDelete
            ? "Hapus yang bernada negatif atau tidak pantas."
            : "Peran Anda hanya dapat melihat."}
        </p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari nama, nomor, atau isi…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-ocid="kritik_admin.search_input"
        />
      </div>
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table data-ocid="kritik_admin.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>HP / WhatsApp</TableHead>
                <TableHead>Isi</TableHead>
                {canDelete && (
                  <TableHead className="text-right">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                    data-ocid="kritik_admin.empty_state"
                  >
                    Belum ada masukan.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((f, i) => (
                  <TableRow key={f.id} data-ocid={`kritik_admin.row.${i + 1}`}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {fmtDate(f.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <a
                        href={waLink(f.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {f.phone}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-pre-line break-words text-sm">
                      {f.message}
                    </TableCell>
                    {canDelete && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          title="Hapus"
                          onClick={() => setDel(f)}
                          data-ocid={`kritik_admin.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus masukan dari {del?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Masukan akan hilang dari portal publik dan tidak bisa
              dikembalikan.
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
