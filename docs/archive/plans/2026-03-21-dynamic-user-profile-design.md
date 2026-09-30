# Design: Dynamic User Profile in Header

**Date:** 2026-03-21
**Issue:** bp-45q
**Branch:** refactoring-3-layer

---

## Problem

`UserDropdown` component menampilkan data hardcoded untuk semua user:
- Nama: `"Abu Abdirohman"` (line 16, 154)
- Email: `"abuabdirohman4@gmail.com"` (line 19)
- Foto: `"/images/user/owner.png"` (line 149)

Setiap user yang login melihat nama dan foto yang sama, bukan data akun mereka sendiri.

---

## Solution

1. Buat hook `useCurrentUser` yang mengambil data session dari Supabase auth
2. Update `UserDropdown` untuk menggunakan data dinamis dari hook
3. Tampilkan **initials avatar** (contoh: "Abu Abdirohman" → "AA") dengan warna deterministik jika user tidak punya foto profil
4. Update `next.config.ts` untuk mengizinkan external image dari Google OAuth

---

## Architecture

### New File: `src/hooks/useCurrentUser.ts`

Hook client-side yang memanggil `supabase.auth.getUser()`:

```
useCurrentUser()
  → returns { user: User | null, isLoading: boolean }
  → user.user_metadata.full_name  → nama user
  → user.email                    → email user
  → user.user_metadata.avatar_url → foto (Google OAuth)
```

Menggunakan `getUser()` bukan `getSession()` karena `getUser()` mem-validasi JWT ke server Supabase (authoritative), sedangkan `getSession()` hanya membaca cache lokal yang bisa stale.

### Avatar Fallback Logic

```
Punya avatar_url? → tampilkan <Image src={avatarUrl} />
Tidak ada?        → tampilkan <div> dengan initials + warna
```

**Initials:** Ambil huruf pertama kata pertama dan kata terakhir nama.
- "Abu Abdirohman" → "AA"
- "John" → "J"
- "" (kosong) → "U" (User)

**Warna:** Hash sederhana dari nama → index ke array 8 warna tetap. Warna selalu konsisten untuk nama yang sama.

---

## Files Changed

| File | Action | Scope |
|------|--------|-------|
| `src/hooks/useCurrentUser.ts` | CREATE | ~25 baris |
| `src/components/layouts/header/UserDropdown.tsx` | MODIFY | ~40 baris berubah |
| `next.config.ts` | MODIFY | +5 baris (remotePatterns) |

---

## Edge Cases

| Skenario | Perilaku |
|----------|----------|
| Loading (sebelum getUser selesai) | Skeleton pulse circle + `"..."` |
| User email/password (tidak ada foto) | Initials avatar dengan warna deterministik |
| User Google OAuth (punya avatar_url) | Foto Google ditampilkan |
| Nama satu kata ("Ahmad") | Initial satu huruf "A" |
| Tidak ada metadata nama | Fallback ke `"User"`, initial `"U"` |

---

## Review Checklist

Setelah implementasi, verifikasi:

- [ ] `npm run type-check` — tidak ada error TypeScript baru
- [ ] Login dengan akun Google OAuth → tampil foto Google dan nama asli
- [ ] Login dengan email/password → tampil initials avatar dengan warna konsisten
- [ ] Tidak ada teks "Abu Abdirohman" tersisa (cek dengan grep)
- [ ] Dark mode — initials masih terbaca
- [ ] Loading state — skeleton muncul sebelum data tersedia
