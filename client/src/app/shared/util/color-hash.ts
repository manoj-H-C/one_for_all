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

// key order matches PALETTE above exactly - this is the vocabulary a
// StatusCategory's stored `color` field is validated against server-side too
// (see WorkflowServiceImpl), so a category can be given a deliberately
// chosen color instead of whatever colorForIndex happens to land on.
export const PALETTE_KEYS = ['violet', 'sky', 'emerald', 'amber', 'rose', 'cyan', 'fuchsia', 'lime'] as const;
export type PaletteColorKey = (typeof PALETTE_KEYS)[number];

const PALETTE_BY_KEY: Record<PaletteColorKey, PaletteColor> = Object.fromEntries(
  PALETTE_KEYS.map((key, index) => [key, PALETTE[index]]),
) as Record<PaletteColorKey, PaletteColor>;

export function colorForKey(key: string | null | undefined): PaletteColor | undefined {
  return key && key in PALETTE_BY_KEY ? PALETTE_BY_KEY[key as PaletteColorKey] : undefined;
}

/**
 * Resolves a status category's color: its own explicitly-chosen color if one
 * is set, otherwise the same by-position fallback colorForIndex always used
 * - so a category nobody has picked a color for yet still renders exactly
 * like it did before this was configurable, and only diverges once someone
 * actually chooses one.
 */
export function categoryColorFor(categories: { id: string; color?: string | null }[], categoryId: string): PaletteColor {
  const category = categories.find((c) => c.id === categoryId);
  const explicit = category ? colorForKey(category.color) : undefined;
  if (explicit) return explicit;
  const index = categories.findIndex((c) => c.id === categoryId);
  return colorForIndex(index === -1 ? 0 : index);
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
