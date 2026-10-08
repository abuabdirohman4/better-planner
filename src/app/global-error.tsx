'use client';

import { useEffect } from 'react';
import { reloadIfVersionSkew } from '@/lib/versionSkew';

/** Penangkap error terakhir (app-15nt.9.1): error versi lama setelah deploy = muat ulang sendiri sekali. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    reloadIfVersionSkew(error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f9fafb', color: '#111827' }}>
        <main style={{ maxWidth: 420, margin: '20vh auto', padding: 16, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ada yang tidak beres</h1>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>
            Kemungkinan aplikasi baru diperbarui. Muat ulang halaman untuk memakai versi terbaru.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ background: '#465fff', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500 }}
          >
            Muat ulang
          </button>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 24, wordBreak: 'break-word' }}>
            {error.message}
            {error.digest ? ` · ${error.digest}` : ''}
          </p>
        </main>
      </body>
    </html>
  );
}
