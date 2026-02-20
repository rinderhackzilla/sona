/**
 * Genre normalization / grouping config.
 *
 * Each key is the canonical display name shown in the UI.
 * Each value is a list of genre name variants (case-insensitive) that get merged into it.
 * Add or edit entries here to customize grouping.
 */
export const GENRE_GROUPS: Record<string, string[]> = {
  Alternative: [
    'alternative',
    'alternative rock',
    'alt rock',
    'alt. rock',
    'alt-rock',
    'alternatif',
    'alternativo',
  ],
  Soundtracks: [
    'soundtrack',
    'soundtracks',
    'film score',
    'film scores',
    'film',
    'films',
    'bandes originales de films',
    'bande originale',
    'original soundtrack',
    'original score',
    'ost',
    'score',
    'scores',
    'film music',
    'motion picture soundtrack',
    'tv soundtrack',
    'game soundtrack',
    'video game soundtrack',
    'video game music',
  ],
  'Hip-Hop': [
    'hip-hop',
    'hip hop',
    'hiphop',
    'rap',
    'rap & hip-hop',
    'rap/hip-hop',
    'r&b/hip-hop',
  ],
  'R&B': [
    'r&b',
    'r & b',
    'rhythm and blues',
    'rhythm & blues',
    'soul/r&b',
    'r&b/soul',
  ],
  'Electronic': [
    'electronic',
    'electronica',
    'electro',
    'elektronisch',
    'electronics',
  ],
  'Classical': [
    'classical',
    'classique',
    'klassik',
    'clássico',
    'classical music',
  ],
}

// Reverse map: lowercase variant → canonical name
const REVERSE_MAP: Record<string, string> = {}
for (const [canonical, variants] of Object.entries(GENRE_GROUPS)) {
  for (const variant of variants) {
    REVERSE_MAP[variant.toLowerCase()] = canonical
  }
}

/**
 * Returns the canonical name for a genre, or the original name if no mapping exists.
 */
export function normalizeGenreName(name: string): string {
  return REVERSE_MAP[name.toLowerCase()] ?? name
}

/**
 * Given a canonical genre name and the full list of server genre names,
 * returns all server genre names that map to that canonical name.
 */
export function getConstituentGenres(
  canonicalName: string,
  allGenreNames: string[],
): string[] {
  return allGenreNames.filter(
    (name) => normalizeGenreName(name) === canonicalName,
  )
}
