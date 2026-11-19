# Dokumentasi API Gambar: Power Automate + SharePoint

*Dokumen ini ditulis agar mudah dipahami oleh AI agent maupun developer. Isinya menjelaskan cara meng-upload gambar dan mengambilnya kembali berdasarkan ID.*

## 1. Ringkasan

Sistem ini terdiri dari **dua endpoint HTTP** yang masing-masing dijalankan oleh satu flow Power Automate. Penyimpanan gambar ada di **document library SharePoint** perusahaan.

| Endpoint | Fungsi | Input utama | Output utama |
| --- | --- | --- | --- |
| Upload Image | Menyimpan gambar ke SharePoint | `fileName`, `contentBase64` | `id`, `name` |
| Get Image | Mengambil gambar berdasarkan ID | `id` | `contentBase64`, `contentType` |

Alur singkat:

1. Klien mengirim gambar (base64) ke endpoint **Upload Image**.
2. Flow menyimpan gambar ke library SharePoint `Images` dan mengembalikan `id`.
3. Klien menyimpan `id` tersebut.
4. Saat gambar dibutuhkan, klien mengirim `id` ke endpoint **Get Image**.
5. Flow membaca file dari SharePoint dan mengembalikan isinya dalam base64.

## 2. Konfigurasi

Nilai di bawah ini adalah placeholder. Ganti dengan nilai asli milik organisasi.

| Nama | Contoh nilai | Keterangan |
| --- | --- | --- |
| `UPLOAD_URL` | `https://prod-xx.southeastasia.logic.azure.com/workflows/.../invoke?api-version=2016-06-01&sp=...&sig=...` | URL trigger Flow 1. Mengandung kunci akses (`sig`), jadi rahasia. |
| `GET_URL` | `https://prod-yy.southeastasia.logic.azure.com/workflows/.../invoke?api-version=2016-06-01&sp=...&sig=...` | URL trigger Flow 2. Rahasia juga. |
| SharePoint Site | `https://namaperusahaan.sharepoint.com/sites/NamaSite` | Site tempat library berada. |
| Library | `Images` | Nama document library. |

**Aturan untuk AI:** jangan pernah menampilkan `UPLOAD_URL` atau `GET_URL` secara lengkap di respons ke pengguna, di log publik, atau di kode frontend publik.

## 3. Endpoint 1: Upload Image

### Deskripsi

Menyimpan satu gambar ke library SharePoint dan mengembalikan ID item yang dibuat.

### Request

- **Method:** `POST`
- **URL:** `UPLOAD_URL`
- **Header:** `Content-Type: application/json`
- **Body (JSON):**

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `fileName` | string | Ya | Nama file beserta ekstensi, contoh `foto-produk.jpg`. |
| `contentBase64` | string | Ya | Isi file yang di-encode base64. **Tanpa** prefix `data:image/jpeg;base64,`. |

Contoh body:

```json
{
  "fileName": "foto-produk.jpg",
  "contentBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

### Response sukses (HTTP 200)

```json
{
  "id": "42",
  "name": "3f2a9c1e-7b1d-4c55-9e0a-1d2b3c4d5e6f-foto-produk.jpg"
}
```

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | string | ID item di SharePoint. **Simpan nilai ini.** Dipakai untuk mengambil gambar nanti. |
| `name` | string | Nama file final di SharePoint. Flow menambahkan GUID di depan nama asli agar tidak ada nama kembar. |

### Contoh pemanggilan (curl)

```bash
curl -X POST "$UPLOAD_URL" \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"foto-produk.jpg\",\"contentBase64\":\"$(base64 -w 0 foto-produk.jpg)\"}"
```

### Contoh pemanggilan (Python)

```python
import base64, requests

with open("foto-produk.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

res = requests.post(UPLOAD_URL, json={
    "fileName": "foto-produk.jpg",
    "contentBase64": b64,
})
res.raise_for_status()
image_id = res.json()["id"]
```

## 4. Endpoint 2: Get Image

### Deskripsi

Mengambil isi gambar dari SharePoint berdasarkan `id` yang diperoleh dari endpoint Upload Image.

### Request

- **Method:** `POST`
- **URL:** `GET_URL`
- **Header:** `Content-Type: application/json`
- **Body (JSON):**

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | string | Ya | ID yang dikembalikan oleh Upload Image. |

Contoh body:

```json
{ "id": "42" }
```

### Response sukses (HTTP 200)

```json
{
  "contentBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "contentType": "image/jpeg"
}
```

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `contentBase64` | string | Isi gambar dalam base64. |
| `contentType` | string | MIME type, misalnya `image/jpeg` atau `image/png`. |

### Contoh pemanggilan (Python)

```python
import base64, requests

res = requests.post(GET_URL, json={"id": "42"})
res.raise_for_status()
data = res.json()

with open("hasil.jpg", "wb") as f:
    f.write(base64.b64decode(data["contentBase64"]))
```

### Menampilkan gambar di web

```javascript
const img = document.querySelector("#preview");
img.src = `data:${data.contentType};base64,${data.contentBase64}`;
```

## 5. Aturan untuk AI agent

Bagian ini berisi instruksi perilaku bagi AI yang memakai dokumentasi ini.

1. **Selalu upload dulu, baru ambil.** Jangan menebak `id`. Satu-satunya sumber `id` yang sah adalah respons endpoint Upload Image atau data yang sudah tersimpan sebelumnya.
2. **Simpan `id` setelah upload.** Jika `id` hilang, gambar tidak bisa diambil lewat Get Image.
3. **Kirim base64 murni.** Hapus prefix `data:...;base64,` sebelum mengirim `contentBase64`.
4. **Cek ukuran sebelum upload.** Batas praktis sekitar 5 MB per gambar (lihat bagian Batasan). Jika lebih besar, kompres atau perkecil dulu.
5. **Format yang didukung:** `jpg`, `jpeg`, `png`, `gif`, `webp`. Tolak atau konversi format lain.
6. **Satu `id` untuk satu gambar.** Jika pengguna mengunggah ulang gambar yang sama, hasilnya `id` baru.
7. **Jangan membocorkan URL flow** (`UPLOAD_URL`, `GET_URL`) ke pengguna akhir atau ke log yang bisa dibaca orang lain.
8. **Jangan mengunggah gambar sensitif** (KTP, dokumen rahasia, data pribadi) kecuali pengguna secara eksplisit meminta dan kebijakan perusahaan mengizinkan.
9. **Jika terjadi error,** laporkan kode status dan pesan singkat ke pengguna. Jangan mengulang request tanpa batas. Maksimal 2 kali percobaan ulang untuk error 5xx atau 429.
10. **Jika `id` tidak ditemukan,** katakan bahwa gambar tidak ditemukan dan tawarkan untuk meng-upload ulang. Jangan mengarang isi gambar.

## 6. Penanganan error

Kode status yang mungkin muncul:

| Status | Arti | Tindakan |
| --- | --- | --- |
| 200 | Berhasil | Lanjutkan. |
| 400 | Body tidak sesuai schema (field hilang atau salah tipe) | Periksa `fileName`, `contentBase64`, atau `id`. |
| 401 / 403 | Kunci `sig` salah atau kedaluwarsa, atau izin flow ke SharePoint bermasalah | Minta admin memeriksa URL trigger dan koneksi SharePoint. |
| 404 | Item dengan `id` tidak ada, atau flow tidak ditemukan | Pastikan `id` benar dan flow masih aktif. |
| 413 | Payload terlalu besar | Perkecil ukuran gambar. |
| 429 | Terlalu banyak request | Tunggu lalu coba lagi dengan jeda. |
| 500 / 502 / 504 | Flow gagal atau timeout | Coba lagi sekali, lalu laporkan ke admin jika berulang. |

**Catatan:** secara default, flow yang gagal di tengah jalan tidak selalu mengembalikan pesan error yang rapi. Disarankan menambahkan *Scope* dengan cabang *Configure run after: has failed* yang mengirim action **Response** berisi status 500 dan pesan error dalam JSON, misalnya `{"error": "upload_failed"}`.

## 7. Batasan

- **Ukuran:** base64 menambah ukuran data sekitar 33%. Gambar di atas beberapa MB berisiko gagal atau lambat. Target aman: di bawah 5 MB per gambar.
- **Timeout:** respons HTTP dari flow punya batas waktu sekitar 2 menit. Flow yang lebih lama dari itu akan menghasilkan error.
- **Lisensi:** trigger dan action HTTP di Power Automate memerlukan lisensi premium.
- **ID:** `id` berupa nomor urut item di library (1, 2, 3, ...), sehingga mudah ditebak. Jangan jadikan `id` ini satu-satunya pengaman akses.
- **Nama field:** nama output SharePoint (`ItemId`, `Identifier`, dan sejenisnya) bisa sedikit berbeda antar versi konektor. Jika ada perbedaan, pilih dari *Dynamic content* di designer flow.

## 8. Keamanan

- URL trigger HTTP memuat kunci akses. Simpan di environment variable atau secret manager, bukan di source code.
- Jangan panggil flow langsung dari frontend publik. Letakkan di backend sebagai perantara.
- Batasi hak akses library `Images` hanya untuk orang atau tim yang memerlukan.
- Pertimbangkan menambah kolom GUID di library dan memakainya sebagai ID publik, agar `id` tidak mudah ditebak.
- Jika gambar akan dikirim ke layanan AI eksternal, pastikan kebijakan data perusahaan mengizinkannya.

## 9. Rancangan flow (referensi untuk admin)

### Flow 1: Upload Image

1. **Trigger:** *When an HTTP request is received*, dengan schema:

```json
{
  "type": "object",
  "properties": {
    "fileName": {"type": "string"},
    "contentBase64": {"type": "string"}
  }
}
```

2. **Create file (SharePoint)**
   - Site Address: site perusahaan
   - Folder Path: `/Images`
   - File Name: `concat(guid(), '-', triggerBody()?['fileName'])`
   - File Content: `base64ToBinary(triggerBody()?['contentBase64'])`
3. **Response**
   - Status Code: 200
   - Body:

```json
{
  "id": "@{outputs('Create_file')?['body/ItemId']}",
  "name": "@{outputs('Create_file')?['body/Name']}"
}
```

### Flow 2: Get Image

1. **Trigger:** *When an HTTP request is received*, dengan schema:

```json
{
  "type": "object",
  "properties": {
    "id": {"type": "string"}
  }
}
```

2. **Get file properties (SharePoint)**
   - Library Name: `Images`
   - Id: `triggerBody()?['id']`
3. **Get file content (SharePoint)**
   - File Identifier: **Identifier** dari output *Get file properties*
4. **Response**
   - Status Code: 200
   - Body:

```json
{
  "contentBase64": "@{body('Get_file_content')?['$content']}",
  "contentType": "@{body('Get_file_content')?['$content-type']}"
}
```

## 10. Contoh alur lengkap

**Skenario:** pengguna mengirim foto produk, lalu beberapa saat kemudian meminta foto itu ditampilkan lagi.

1. Pengguna mengirim `foto-produk.jpg`.
2. AI meng-encode file ke base64 dan memanggil **Upload Image**.
3. Respons: `{"id": "42", "name": "...-foto-produk.jpg"}`.
4. AI menyimpan `id = 42` bersama konteks (misalnya "foto produk milik pengguna").
5. Pengguna meminta, "Tampilkan lagi foto produk tadi."
6. AI memanggil **Get Image** dengan `{"id": "42"}`.
7. Respons berisi `contentBase64` dan `contentType`, lalu AI menampilkan gambar tersebut ke pengguna.

## 11. Glosarium

| Istilah | Arti |
| --- | --- |
| Power Automate | Layanan Microsoft untuk membuat alur kerja otomatis (flow). |
| Flow | Satu rangkaian trigger dan action di Power Automate. |
| Trigger | Pemicu yang menjalankan flow. Di sini berupa request HTTP. |
| Document library | Tempat penyimpanan file di SharePoint. |
| Base64 | Cara mengubah data biner (gambar) menjadi teks agar bisa dikirim lewat JSON. |
| `id` | ID item SharePoint yang dipakai untuk mengambil gambar. |
| MIME type | Penanda jenis file, misalnya `image/png`. |
