import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareText, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";

export function fmtDate(ms: bigint | number) {
  return new Date(Number(ms)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KritikSaranPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["feedback", "public"],
    queryFn: () => api.listFeedbackPublic(),
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.submitFeedback(name.trim(), phone.trim(), message.trim());
      toast.success("Terima kasih! Masukan Anda sudah terkirim.");
      setMessage("");
      await qc.invalidateQueries({ queryKey: ["feedback"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="eyebrow">Suara Warga</p>
        <h1 className="font-bricolage font-bold text-3xl md:text-4xl text-foreground flex items-center gap-3 mt-1">
          <MessageSquareText className="w-8 h-8 text-primary" />
          Kritik &amp; Saran
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Sampaikan masukan untuk kemajuan RT 09 Dongkelan. Tidak perlu login.
          Nama dan isi masukan tampil untuk umum; nomor HP/WhatsApp hanya dapat
          dilihat pengurus.
        </p>
      </motion.div>

      <form
        onSubmit={submit}
        className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-card space-y-4"
        data-ocid="kritik.form"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ks-name">Nama</Label>
            <Input
              id="ks-name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              data-ocid="kritik.name_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ks-phone">Nomor HP / WhatsApp</Label>
            <Input
              id="ks-phone"
              required
              type="tel"
              inputMode="tel"
              maxLength={25}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              data-ocid="kritik.phone_input"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ks-msg">Kritik &amp; Saran</Label>
          <Textarea
            id="ks-msg"
            required
            minLength={5}
            maxLength={1000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis kritik atau saran Anda dengan sopan…"
            data-ocid="kritik.message_input"
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/1000
          </p>
        </div>
        <Button
          type="submit"
          disabled={sending}
          data-ocid="kritik.submit_button"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Kirim Masukan
        </Button>
      </form>

      <h2 className="font-bricolage font-semibold text-xl mt-10 mb-4">
        Masukan Warga{" "}
        <span className="text-muted-foreground font-normal text-base">
          ({data.length})
        </span>
      </h2>
      {isLoading ? (
        <div className="space-y-3">
          {["a", "b", "c"].map((k) => (
            <Skeleton key={k} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p
          className="text-center text-muted-foreground py-10 border border-dashed border-border rounded-xl"
          data-ocid="kritik.empty_state"
        >
          Belum ada masukan. Jadilah yang pertama!
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((f, i) => (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="bg-card border border-border rounded-xl p-4 shadow-card"
              data-ocid={`kritik.item.${i + 1}`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bricolage font-bold">
                    {f.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold text-sm">{f.name}</span>
                </div>
                <time className="text-xs text-muted-foreground">
                  {fmtDate(f.createdAt)}
                </time>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line break-words">
                {f.message}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
