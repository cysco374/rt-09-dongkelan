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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { WebsiteSettings } from "../../backend.d";
import {
  useSetAdminCredentials,
  useSetWebsiteSettings,
  useWebsiteSettings,
} from "../../hooks/useQueries";
import { sha256 } from "../../utils/hash";

const defaultSettings: WebsiteSettings = {
  name: "RT 09 Dongkelan",
  description:
    "Sistem Informasi RT 09 Kampung Dongkelan — Melayani warga dengan transparan dan profesional.",
  fullAddress: "Kampung Dongkelan RT 09, Yogyakarta, DIY 55152",
  headPhone: "0812-3456-7890",
  email: "rt09.dongkelan@gmail.com",
  vision:
    "Mewujudkan kampung Dongkelan RT 09 yang aman, bersih, tertib, dan sejahtera.",
  mission:
    "Meningkatkan kualitas pelayanan, keamanan lingkungan, dan kesejahteraan warga melalui program yang terorganisir.",
  history:
    "RT 09 Kampung Dongkelan berdiri sejak lama dan terus berkembang bersama masyarakatnya yang gotong royong.",
};

export default function PengaturanPage() {
  const { data: settings, isLoading } = useWebsiteSettings();
  const saveMutation = useSetWebsiteSettings();
  const setCredentialsMutation = useSetAdminCredentials();

  const [form, setForm] = useState<WebsiteSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Credentials form state
  const [credForm, setCredForm] = useState({
    currentPassword: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [credError, setCredError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof WebsiteSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(form);
      toast.success("Pengaturan berhasil disimpan");
      setHasChanges(false);
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    }
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);

    if (!credForm.currentPassword) {
      setCredError("Password saat ini tidak boleh kosong.");
      return;
    }
    if (!credForm.username.trim()) {
      setCredError("Username baru tidak boleh kosong.");
      return;
    }
    if (!credForm.password) {
      setCredError("Password baru tidak boleh kosong.");
      return;
    }
    if (credForm.password !== credForm.confirmPassword) {
      setCredError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      const currentPasswordHash = await sha256(credForm.currentPassword);
      const passwordHash = await sha256(credForm.password);
      const success = await setCredentialsMutation.mutateAsync({
        username: credForm.username.trim(),
        passwordHash,
        currentPasswordHash,
      });
      if (success) {
        toast.success("Kredensial berhasil diubah");
        setCredForm({
          currentPassword: "",
          username: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setCredError("Password saat ini salah.");
      }
    } catch {
      toast.error("Gagal mengubah kredensial");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"].map((k) => (
            <div key={k}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bricolage font-bold text-xl text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Pengaturan Website
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Kelola informasi dan pengaturan website RT 09
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || !hasChanges}
          data-ocid="pengaturan.save_button"
          className="bg-primary text-primary-foreground"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Pengaturan
        </Button>
      </div>

      {/* Informasi Umum */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bricolage">
            Informasi Umum
          </CardTitle>
          <CardDescription>Nama, deskripsi, dan kontak RT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nama RT</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nama RT"
              className="mt-1"
              data-ocid="pengaturan.input"
            />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Deskripsi singkat RT..."
              rows={3}
              className="mt-1"
              data-ocid="pengaturan.textarea"
            />
          </div>
          <div>
            <Label>Alamat Lengkap</Label>
            <Textarea
              value={form.fullAddress}
              onChange={(e) => handleChange("fullAddress", e.target.value)}
              placeholder="Alamat lengkap RT..."
              rows={2}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>No. HP Ketua RT</Label>
              <Input
                value={form.headPhone}
                onChange={(e) => handleChange("headPhone", e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visi & Misi */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bricolage">
            Visi & Misi
          </CardTitle>
          <CardDescription>Visi, misi, dan sejarah RT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Visi</Label>
            <Textarea
              value={form.vision}
              onChange={(e) => handleChange("vision", e.target.value)}
              placeholder="Visi RT..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Misi</Label>
            <Textarea
              value={form.mission}
              onChange={(e) => handleChange("mission", e.target.value)}
              placeholder="Misi RT..."
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Sejarah</Label>
            <Textarea
              value={form.history}
              onChange={(e) => handleChange("history", e.target.value)}
              placeholder="Sejarah singkat RT..."
              rows={4}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Keamanan Akun */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bricolage flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Keamanan Akun
          </CardTitle>
          <CardDescription>
            Ubah username dan password login admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeCredentials} className="space-y-4">
            <div>
              <Label htmlFor="cred-current">Password Saat Ini</Label>
              <Input
                id="cred-current"
                type="password"
                value={credForm.currentPassword}
                onChange={(e) => {
                  setCredForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }));
                  setCredError(null);
                }}
                placeholder="Masukkan password saat ini"
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
            <div>
              <Label htmlFor="cred-username">Username Baru</Label>
              <Input
                id="cred-username"
                type="text"
                value={credForm.username}
                onChange={(e) => {
                  setCredForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                  setCredError(null);
                }}
                placeholder="Masukkan username baru"
                className="mt-1"
                autoComplete="username"
                data-ocid="pengaturan.input"
              />
            </div>
            <div>
              <Label htmlFor="cred-password">Password Baru</Label>
              <Input
                id="cred-password"
                type="password"
                value={credForm.password}
                onChange={(e) => {
                  setCredForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                  setCredError(null);
                }}
                placeholder="Masukkan password baru"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="cred-confirm">Konfirmasi Password</Label>
              <Input
                id="cred-confirm"
                type="password"
                value={credForm.confirmPassword}
                onChange={(e) => {
                  setCredForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  setCredError(null);
                }}
                placeholder="Ulangi password baru"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>

            {credError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {credError}
              </p>
            )}

            <Button
              type="submit"
              disabled={setCredentialsMutation.isPending}
              className="bg-primary text-primary-foreground"
              data-ocid="pengaturan.kredensial.save_button"
            >
              {setCredentialsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Ubah Kredensial
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Save Button Bottom */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || !hasChanges}
          data-ocid="pengaturan.save_button"
          className="bg-primary text-primary-foreground"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Semua Perubahan
        </Button>
      </div>
    </div>
  );
}
