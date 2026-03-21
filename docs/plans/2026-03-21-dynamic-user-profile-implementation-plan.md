# Implementation Plan: Dynamic User Profile in Header

**Date:** 2026-03-21
**Issue:** bp-45q
**Design:** `docs/plans/2026-03-21-dynamic-user-profile-design.md`
**Branch:** refactoring-3-layer

---

## Pre-requisites

- Baca design doc di atas
- Baca `@CLAUDE.md` untuk coding rules
- Pastikan berada di branch `refactoring-3-layer`
- Jalankan `bd update bp-45q --claim` sebelum mulai

---

## Task 1 — Buat file `src/hooks/useCurrentUser.ts`

Buat file baru dengan isi berikut **persis**:

```ts
'use client'
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setIsLoading(false)
    })
  }, [])

  return { user, isLoading }
}
```

**Verifikasi Task 1:**
- File ada di `src/hooks/useCurrentUser.ts`
- `npm run type-check` tidak ada error baru

---

## Task 2 — Update `src/components/layouts/header/UserDropdown.tsx`

### 2a. Tambah utility functions dan import

Setelah baris `import { DropdownItem } from "../../ui/dropdown/DropdownItem";` (line 8), tambahkan:

```ts
import { useCurrentUser } from '@/hooks/useCurrentUser'

// --- Avatar Utilities ---

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#5B21B6', '#0369A1', '#065F46', '#92400E',
  '#9F1239', '#1D4ED8', '#7C3AED', '#0F766E',
]

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
```

### 2b. Update `DropdownMenuItems` props interface

Ubah signature dari:
```ts
function DropdownMenuItems({ onClose }: { onClose: () => void }) {
```
Menjadi:
```ts
function DropdownMenuItems({ onClose, fullName, email }: { onClose: () => void; fullName: string; email: string }) {
```

### 2c. Ganti hardcoded nama dan email di `DropdownMenuItems`

Ubah:
```tsx
<span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
  Abu Abdirohman
</span>
<span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
  abuabdirohman4@gmail.com
</span>
```

Menjadi:
```tsx
<span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
  {fullName}
</span>
<span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
  {email}
</span>
```

### 2d. Tambah user data di `UserDropdown` function

Tambahkan di dalam `export default function UserDropdown()`, tepat setelah baris `const [isOpen, setIsOpen] = useState(false);`:

```ts
const { user, isLoading } = useCurrentUser()
const fullName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? 'User'
const email = user?.email ?? ''
const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null
const initials = getInitials(fullName)
const bgColor = getAvatarColor(fullName)
```

### 2e. Ganti avatar hardcoded

Ubah blok ini (lines 145–152):
```tsx
<span className="mr-3 overflow-hidden rounded-full h-11 w-11">
  <Image
    width={44}
    height={44}
    src="/images/user/owner.png"
    alt="User"
  />
</span>
```

Menjadi:
```tsx
<span className="mr-3 overflow-hidden rounded-full h-11 w-11 flex-shrink-0">
  {isLoading ? (
    <div className="h-11 w-11 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
  ) : avatarUrl ? (
    <Image width={44} height={44} src={avatarUrl} alt={fullName} className="object-cover w-full h-full" />
  ) : (
    <div
      className="h-11 w-11 rounded-full flex items-center justify-center text-white text-sm font-semibold"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  )}
</span>
```

### 2f. Ganti hardcoded nama di trigger button

Ubah (line 154):
```tsx
<span className="block mr-1 font-medium text-theme-sm">Abu Abdirohman</span>
```

Menjadi:
```tsx
<span className="block mr-1 font-medium text-theme-sm">
  {isLoading ? '...' : fullName}
</span>
```

### 2g. Update pemanggilan `DropdownMenuItems`

Ubah (line 181):
```tsx
<DropdownMenuItems onClose={closeDropdown} />
```

Menjadi:
```tsx
<DropdownMenuItems onClose={closeDropdown} fullName={fullName} email={email} />
```

**Verifikasi Task 2:**
- `npm run type-check` tidak ada error baru
- Tidak ada string `"Abu Abdirohman"` tersisa di file (cek dengan grep)

---

## Task 3 — Update `next.config.ts`

Tambahkan `remotePatterns` ke dalam blok `images` (setelah `imageSizes`):

Ubah:
```ts
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},
```

Menjadi:
```ts
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
      pathname: '/**',
    },
  ],
},
```

**Verifikasi Task 3:**
- `npm run type-check` tidak ada error baru

---

## Final Verification

Setelah semua task selesai, jalankan:

```bash
npm run type-check
```

Output yang diharapkan: tidak ada error baru (hanya error pre-existing yang sudah ada sebelumnya).

**Jangan jalankan git commit** — kembalikan ke Claude Code untuk review terlebih dahulu.

---

## Summary of Changes

```
src/hooks/useCurrentUser.ts                         (NEW)
src/components/layouts/header/UserDropdown.tsx      (MODIFIED)
next.config.ts                                      (MODIFIED)
```
