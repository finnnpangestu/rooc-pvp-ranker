---
trigger: always_on
description: Larangan keras menggunakan tipe any di TypeScript kecuali dalam keadaan genting.
---

## Larangan Penggunaan `any` (Strict TypeScript)

Dilarang keras menggunakan tipe `any` (`any`, `any[]`, `Record<string, any>`, `(x: any) => ...`, dsb.) di seluruh codebase TypeScript project ini.

### Aturan Utama:
1. **Wajib Menggunakan Tipe Spesifik**:
   - Selalu gunakan atau definisikan tipe/interface yang eksplisit dan tepat (misal dari `@/types`, schema database `@/db/schema`, atau deklarasi tipe lokal yang jelas).
   - Dilarang mendeklarasikan array dengan `any[]`. Wajib menggunakan tipe elemen yang jelas (contoh: `Character[]`, `string[]`, `Guild[]`, dsb.).
2. **Gunakan `unknown` Jika Tipe Belum Pasti**:
   - Jika tipe data dinamis atau belum pasti (misal error handling atau respon eksternal), gunakan `unknown` disertai type narrowing / type guard, BUKAN `any`.
3. **Pengecualian Khusus**:
   - Penggunaan `any` **HANYA** diperbolehkan dalam keadaan darurat/genting yang sangat mendesak (contoh: bug kompilator yang tidak dapat dihindari atau limitasi library pihak ketiga tanpa type definition yang tidak bisa di-resolve).
   - Jika terpaksa digunakan, wajib menyertakan komentar penjelasan yang jelas mengapa `any` digunakan.
