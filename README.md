# Shift Report — PT Tanjung Enim Lestari

Aplikasi web pencatatan, pemantauan kualitas chip, dan ekspor laporan PDF untuk **Shift Report** inspeksi chipper **PT Tanjung Enim Lestari**. Dibangun dengan Next.js App Router, Prisma ORM + MySQL, Recharts, dan PDFKit.

---

## Fitur Utama

### 1. Formulir Input Shift Report 2 Halaman (`/`)
Formulir digital terstruktur yang mengikuti format lembar inspeksi standar 2 halaman:
- **Header & Metadata Shift**: Customer (`PT Tanjung Enim Lestari`), tanggal laporan, nama inspektur, jenis chipper (`HHQ 16`, `Camura 1`, `Camura 2`) dengan *Type of Knife System* otomatis (`TK IV Standart 330 MM` / `365 MM`), *Chip Length Set Up*, penyesuaian chip length, *Start/Stop Chipper*, Shift (`I`, `II`, `III`), dan *Sampling Time*.
- **Bagian 1 — Chip Quality (`1.1`–`1.8`)**: Input nilai *Oversize*, *Overthick*, *Large Accept*, *Small Accept*, *Pin*, *Fines*, *Bark Content*, dan *Moisture* (`%`), lengkap dengan kalkulasi otomatis `Total Accept` (`1.3 + 1.4`) dan `P+F` (`1.5 + 1.6`), Data Source, Sampling, Remarks, serta unggah foto opsional.
- **Bagian 2 — Operational Condition**: Observasi visual *Layer* (`Single Layer` / `Multi Layer`), *Log Condition* (`Dry` / `Fresh`), indikator *Lots Of Bark / Sand / Stone* (`Yes` / `No`), serta hingga **4 slot unggah foto operasional** lengkap dengan **caption** masing-masing.
- **Bagian 3 — Chipper Condition**:
  - **3.1 Geometry**: `T Dimension (mm)`, `Clearance Anvil (mm)`, *Last Setting Date*, Remarks, dan foto opsional.
  - **3.2 Part**: Penilaian kondisi 12 komponen (`Good`, `Worn Out`, `Broken`) dengan tombol bantu *"Tandai Semua Good"*, ditambah 4 slot Remarks dan foto opsional.
- **Bagian 4 — Raw Material (`4.1`–`4.6`)**: Log Yard Number, Log Age, Aging in Storage, rata-rata diameter, kadar air log, 2 pasang distribusi persentase diameter (`%` & `MM`), serta 2 slot Remarks dan foto opsional.

### 2. Dashboard Admin Terproteksi (`/admin`)
- **Autentikasi Admin (`/admin/login`)**: Login berbasis username dan password dengan cookie sesi terenkripsi JWT (`jose`) dan pencatatan sesi di tabel `admin_sessions` (diproteksi melalui [src/proxy.ts](src/proxy.ts)).
- **Filter & Pencarian**: Saring laporan berdasarkan rentang tanggal, chipper, shift, maupun pencarian teks bebas.
- **Grafik Tren Kualitas Chip (`Recharts`)**: Satu grafik garis gabungan interaktif dengan maksimal **6 metrik aktif bersamaan** (dapat dipilih dari `1.1`–`1.8`, `Total Accept`, dan `P+F`; preferensi tersimpan di `localStorage`).
- **Manajemen Laporan**: Pagination daftar laporan dengan aksi Lihat/Cetak, Edit (`/admin/reports/[id]/edit`), Export PDF, dan Hapus laporan.

### 3. Cetak & Export PDF (`/admin/reports/[id]` & `/api/shift-reports/[id]/pdf`)
- Menghasilkan dokumen PDF ukuran **A4** secara server-side menggunakan `pdfkit` dan `sharp` dengan logo `public/Andritz-Symbol.png`.
- **Halaman 1–2**: Tata letak tabel resmi Shift Report bagian 1–4 beserta hingga 4 foto kondisi operasional dan caption-nya.
- **Halaman 3 (Opsional)**: *Lampiran Foto Remarks* dalam grid tetap **8 bagan (`2 kolom × 4 baris`)** untuk seluruh slot Remarks apabila terdapat minimal 1 foto Remarks terunggah (slot tanpa foto tetap tampil sebagai bagan kosong).

---

## Teknologi

| Kategori | Paket / Layanan |
| --- | --- |
| Framework | Next.js `16.4.6` (App Router, Turbopack, Cache Components), React `19.3.0` |
| Bahasa & Validasi | TypeScript `^5`, Zod `^4.6.7` |
| Styling & Ikon | Tailwind CSS `4.3.3`, `lucide-react`, `clsx`, `tailwind-merge` |
| Database & ORM | MySQL, Prisma ORM `^6.19.3` (`@prisma/client`) |
| Autentikasi | `jose` (JWT session cookie) + `node:crypto` (`scrypt`) |
| Grafik | `recharts` `^3.10.1` |
| Pemrosesan Gambar & PDF | `pdfkit` `^0.20.2`, `sharp` `^0.35.5` |

---

## Struktur Proyek

```text
.
├── prisma/
│   ├── migrations/              # Riwayat migrasi schema MySQL
│   ├── schema.prisma            # Definisi model AdminUser, AdminSession, ShiftReport
│   └── seed.ts                  # Seeder akun admin default & data sampel awal
├── public/
│   └── Andritz-Symbol.png       # Logo aplikasi, favicon, dan header PDF
├── storage/
│   └── uploads/                 # Penyimpanan lokal file foto yang diunggah (di-ignore git)
├── src/
│   ├── proxy.ts                 # Guard autentikasi route /admin/*
│   ├── app/
│   │   ├── page.tsx             # Halaman utama formulir input Shift Report
│   │   ├── layout.tsx           # Root layout, font IBM Plex, dan ikon /Andritz-Symbol.png
│   │   ├── admin/
│   │   │   ├── page.tsx         # Dashboard Admin (tabel & grafik)
│   │   │   ├── login/page.tsx   # Halaman login admin
│   │   │   └── reports/[id]/    # Halaman detail/cetak & edit laporan
│   │   └── api/                 # Route Handlers REST API, auth, PDF, dan upload foto
│   ├── components/
│   │   ├── auth/                # Komponen form login admin
│   │   ├── shared/              # AppHeader, BrandMark, Pagination, LogoutButton, EmptyState
│   │   ├── shift-report/        # ShiftReportForm, AdminDashboardClient, ChipQualityCharts, dsb.
│   │   └── ui/                  # Komponen UI dasar (Button, Input, Badge, ConfirmModal, Toast)
│   ├── lib/                     # Prisma client singleton, response helper, error class, utils
│   └── modules/
│       ├── auth/                # Layanan autentikasi & verifikasi JWT cookie
│       └── shift-reports/       # Schema Zod, mapper, repository, service, dan generator PDF
├── .env.example                 # Template environment variables
├── next.config.ts               # Konfigurasi Next.js (Cache Components, rewrite favicon)
└── package.json
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat
- **Node.js** versi 20 atau lebih baru (disertai `npm`)
- **MySQL** server aktif (lokal atau remote)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env` lalu sesuaikan nilainya:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/shift_report"
AUTH_SECRET="ganti-dengan-string-acak-minimal-32-karakter"

ADMIN_DEFAULT_USERNAME="admin"
ADMIN_DEFAULT_NAME="Administrator QC"
ADMIN_DEFAULT_PASSWORD="Admin123!ChangeMe"
```
> **Catatan:** Pastikan database MySQL target (misalnya `shift_report`) sudah dibuat sebelum menjalankan migrasi, dan ubah `ADMIN_DEFAULT_PASSWORD` serta `AUTH_SECRET` sebelum digunakan di produksi.

### 3. Migrasi & Seed Database
Jalankan migrasi Prisma, generate Prisma Client, dan jalankan seeder untuk membuat akun admin default (serta data contoh awal apabila tabel laporan masih kosong):
```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```
*(Untuk sinkronisasi cepat skema selama pengembangan, Anda juga dapat memakai `npx prisma db push`.)*

### 4. Menjalankan Server
Mode development:
```bash
npm run dev
```

Mode production:
```bash
npm run build
npm run start
```

Buka aplikasi di browser:
- Form Input Operator: `http://localhost:3000/`
- Dashboard Admin: `http://localhost:3000/admin` (login lewat `/admin/login`)

---

## Skrip yang Tersedia

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Next.js (`next dev`) |
| `npm run build` | Membangun bundle produksi (`next build`) |
| `npm run start` | Menjalankan server produksi (`next start`) |
| `npm run lint` | Memeriksa aturan ESLint (`eslint`) |
| `npx tsc --noEmit` | Memeriksa tipe TypeScript tanpa menghasilkan output kompilasi |
| `npx prisma db seed` | Menjalankan `tsx prisma/seed.ts` untuk akun admin & sampel data |

---

## Daftar Rute & API Endpoints

### Halaman Web
| Path | Akses | Fungsi |
| --- | --- | --- |
| `/` | Publik | Formulir input Shift Report baru |
| `/admin/login` | Publik | Halaman login administrator |
| `/admin` | Admin | Dashboard daftar laporan & grafik kualitas chip |
| `/admin/reports/[id]` | Admin | Tampilan detail, cetak browser, & unduh PDF |
| `/admin/reports/[id]/edit` | Admin | Edit data Shift Report yang tersimpan |

### API Endpoints
| Endpoint | Metode | Akses | Fungsi |
| --- | --- | --- | --- |
| `/api/auth/login` | `POST` | Publik | Autentikasi admin & set session cookie |
| `/api/auth/logout` | `POST` | Publik | Menghapus sesi admin aktif |
| `/api/shift-reports` | `POST` | Publik | Menyimpan laporan Shift Report baru |
| `/api/shift-reports` | `GET` | Admin | Mengambil daftar laporan dengan filter & pagination |
| `/api/shift-reports/charts` | `GET` | Admin | Mengambil data deret waktu untuk grafik kualitas chip |
| `/api/shift-reports/[id]` | `GET`, `PATCH`, `DELETE` | Admin | Mengambil detail, memperbarui, atau menghapus laporan |
| `/api/shift-reports/[id]/pdf` | `GET` | Admin | Menghasilkan dan mengunduh file PDF Shift Report |
| `/api/uploads` | `POST` | Publik | Mengunggah foto JPG/PNG/WebP (maks. `5 MB`) ke `storage/uploads` |
| `/api/uploads/[filename]` | `GET` | Publik | Menyajikan file gambar terunggah dengan validasi nama file |
