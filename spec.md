# RT 09 Dongkelan

## Current State
Aplikasi manajemen RT dengan dashboard admin berisi menu: Warga, KK, Pengumuman, Iuran, Surat, Fasilitas, Pengurus, Pengaturan. Semua CRUD sudah berfungsi. Dashboard menampilkan statistik dasar dan pengumuman terbaru.

## Requested Changes (Diff)

### Add
- Tombol Ekspor CSV dan Impor CSV di halaman Warga, KK, Iuran, dan Pengumuman
- Kartu Total Saldo (jumlah uang dari iuran berstatus lunas) di halaman Iuran
- Statistik keuangan di Dashboard: Total Saldo, Total Pemasukan (semua iuran lunas), Total Tunggakan (semua iuran belum lunas)
- Halaman Laporan baru (/dashboard/laporan) berisi laporan keuangan: ringkasan saldo, tabel per bulan, breakdown per jenis iuran
- Menu Laporan di sidebar navigasi dashboard

### Modify
- DashboardHome: tambah section statistik keuangan
- DashboardLayout: tambah nav item Laporan
- App.tsx: tambah route /dashboard/laporan
- IuranPage: tampilkan kartu Total Saldo di bagian atas

### Remove
- Tidak ada

## Implementation Plan
1. Buat utility csvUtils.ts untuk export/import CSV
2. Update WargaPage - tambah tombol ekspor/impor CSV
3. Update KKPage - tambah tombol ekspor/impor CSV  
4. Update IuranPage - tambah tombol ekspor/impor CSV + kartu total saldo
5. Update PengumumanPage - tambah tombol ekspor/impor CSV
6. Update DashboardHome - tambah kartu statistik keuangan (Total Saldo, Pemasukan, Tunggakan)
7. Buat LaporanPage baru dengan laporan keuangan lengkap
8. Update DashboardLayout - tambah menu Laporan di sidebar
9. Update App.tsx - tambah route /dashboard/laporan
