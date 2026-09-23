# Mini POS

Kasir offline untuk Android. Transaksi disimpan di SQLite di perangkat, lalu struk 58mm dikirim sebagai byte ESC/POS ke printer Bluetooth Classic. Aplikasi tidak memakai internet dan tidak membuka dialog cetak browser.

Versi aplikasi `1.0.0` (versionCode 1). Ikon launcher ada di `android/app/src/main/res/mipmap-*`.

## Memasang

Perlu Node.js, JDK 21, dan Android SDK. `npx cap sync` menyetel bytecode Java 21, jadi JDK 17 tidak bisa menyusun APK.

```powershell
npm install
npm run check
npm run build
npx cap sync android
cd android
.\gradlew assembleRelease
```

APK ada di `android/app/build/outputs/apk/release/`. Pasang berkas itu di ponsel (izinkan pemasangan dari sumber tidak dikenal). Cetak fisik ke ECOPRINT POS58 belum dicek di mesin pengembangan ini.

## Menyambungkan ECOPRINT POS58

1. Nyalakan printer dan Bluetooth ponsel.
2. Pasangkan printer dari pengaturan Bluetooth Android. Aplikasi hanya menampilkan perangkat yang sudah dipasangkan.
3. Buka Mini POS, lalu Pengaturan, Cari printer, pilih POS58, lalu Connect.
4. Tekan Test Print. Kertas harus keluar.
5. Biarkan Auto Print menyala agar struk ikut tercetak setelah Bayar.

Jika cetak gagal, transaksi tetap tersimpan. Di kasir ada Coba lagi dan Hubungkan printer. Dari Riwayat, Reprint mencetak transaksi yang sama tanpa membuat transaksi baru.
