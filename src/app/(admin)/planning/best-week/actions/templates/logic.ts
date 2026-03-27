export function validateTemplateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama template tidak boleh kosong');
  if (trimmed.length > 100) throw new Error('Nama template terlalu panjang (max 100 karakter)');
  return trimmed;
}
