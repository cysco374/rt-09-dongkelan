import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, KeyRound, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { login as saveSession } from "../hooks/useAdminAuth";
import { sha256 } from "../utils/hash";

export default function LoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setLoginError("Koneksi backend belum siap. Coba beberapa saat lagi.");
      return;
    }
    if (!username.trim() || !password.trim()) {
      setLoginError("Username dan password tidak boleh kosong.");
      return;
    }

    setIsVerifying(true);
    setLoginError(null);

    try {
      const passwordHash = await sha256(password);
      const token = await actor.login(username.trim(), passwordHash);
      saveSession(token);
      navigate({ to: "/dashboard" });
    } catch (err) {
      const status = (err as { status?: number }).status;
      setLoginError(
        status === 401
          ? "Username atau password salah. Silakan coba lagi."
          : status === 429
            ? "Terlalu banyak percobaan. Coba lagi sebentar lagi."
            : "Gagal memverifikasi kredensial. Silakan coba lagi.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex hero-mesh-batik text-white p-12 flex-col justify-between">
        <p className="eyebrow !text-sidebar-primary">Panel Pengurus</p>
        <div>
          <h2 className="font-bricolage font-bold text-4xl leading-tight max-w-md">
            Kelola data warga, iuran, dan surat dalam satu tempat.
          </h2>
          <p className="text-white/70 mt-4 max-w-sm text-sm leading-relaxed">
            Akses khusus pengurus RT 09 Dongkelan. Semua perubahan langsung
            tampil di portal warga.
          </p>
        </div>
        <p className="text-white/40 text-xs">RT 09 Kampung Dongkelan</p>
      </div>
      <div className="flex items-center justify-center px-4 py-16 page-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-card-hover overflow-hidden">
            {/* Green Top Bar */}
            <div className="hero-mesh px-8 py-8 text-white text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-bricolage font-bold text-2xl mb-1">
                Login Admin
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                Panel Manajemen RT 09 Dongkelan
              </p>
            </div>

            {/* Form Area */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Masukkan username"
                      className="pl-9"
                      autoComplete="username"
                      disabled={isVerifying}
                      data-ocid="login.username.input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={isVerifying}
                    data-ocid="login.password.input"
                  />
                </div>

                {/* Error State */}
                {loginError && (
                  <Alert variant="destructive" data-ocid="login.error_state">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isVerifying || !actor}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  data-ocid="login.primary_button"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Masuk
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Back link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <a href="/" className="hover:text-foreground transition-colors">
              ← Kembali ke Beranda
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
