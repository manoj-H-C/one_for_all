export type PaletteColor = { bg: string; text: string; dot: string; ring: string };

const PALETTE: PaletteColor[] = [
  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', ring: 'ring-violet-200' },
  { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500', ring: 'ring-sky-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500', ring: 'ring-cyan-200' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-200' },
  { bg: 'bg-lime-100', text: 'text-lime-700', dot: 'bg-lime-500', ring: 'ring-lime-200' },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorFor(seed: string): (typeof PALETTE)[number] {
  return PALETTE[hashString(seed) % PALETTE.length];
}

/**
 * Assigns a color by raw position instead of hashing a name. Use this for a
 * small, known list (workflow categories, statuses) where every item must
 * get a visibly distinct color - a name hash can't guarantee that (two
 * different strings can land in the same bucket), but a fixed index always
 * can, up to the size of the palette.
 */
export function colorForIndex(index: number): (typeof PALETTE)[number] {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
