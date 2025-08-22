/**
 * Hungarian collator utilities for proper alphabetical sorting
 *
 * The Hungarian alphabet includes special characters that should be sorted according to
 * their position in the Hungarian alphabet, not at the end as with default Unicode sorting.
 *
 * Hungarian alphabet order:
 * a á b c cs d dz dzs e é f g gy h i í j k l ly m n ny o ó ö ő p q r s sz t ty u ú ü ű v w x y z zs
 */

/**
 * Hungarian character ordering map
 * Each character gets a numerical value representing its position in the Hungarian alphabet
 */
const HUNGARIAN_CHAR_ORDER: Record<string, number> = {
    a: 1,
    á: 2,
    b: 3,
    c: 4,
    d: 5,
    e: 6,
    é: 7,
    f: 8,
    g: 9,
    h: 10,
    i: 11,
    í: 12,
    j: 13,
    k: 14,
    l: 15,
    m: 16,
    n: 17,
    o: 18,
    ó: 19,
    ö: 20,
    ő: 21,
    p: 22,
    q: 23,
    r: 24,
    s: 25,
    t: 26,
    u: 27,
    ú: 28,
    ü: 29,
    ű: 30,
    v: 31,
    w: 32,
    x: 33,
    y: 34,
    z: 35,
};

/**
 * Get the Hungarian alphabetical order value for a character
 * @param char - Character to get order value for
 * @returns Numerical position in Hungarian alphabet, or 999 for non-Hungarian characters
 */
function getHungarianCharOrder(char: string): number {
    return HUNGARIAN_CHAR_ORDER[char.toLowerCase()] ?? 999;
}

/**
 * Compare two strings using proper Hungarian alphabetical ordering
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative number if a < b, positive if a > b, 0 if equal
 */
function hungarianCharacterCompare(a: string, b: string): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const orderA = getHungarianCharOrder(a[i] ?? "");
        const orderB = getHungarianCharOrder(b[i] ?? "");

        if (orderA !== orderB) {
            return orderA - orderB;
        }
    }

    // If all compared characters are equal, shorter string comes first
    return a.length - b.length;
}

/**
 * Creates a Hungarian-specific collator for string comparison
 * @param options - Additional Intl.Collator options (unused, kept for API compatibility)
 * @returns Comparison function that follows Hungarian alphabetical order
 */
export function createHungarianCollator(_options?: Intl.CollatorOptions): {
    compare: (a: string, b: string) => number;
} {
    return {
        compare: hungarianCharacterCompare,
    };
}

/**
 * Default Hungarian collator instance
 */
export const hungarianCollator = createHungarianCollator();

/**
 * Compare two strings using Hungarian collation rules
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative number if a < b, positive if a > b, 0 if equal
 */
export function compareHungarian(a: string, b: string): number {
    return hungarianCharacterCompare(a, b);
}

/**
 * Case-insensitive Hungarian string comparison
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative number if a < b, positive if a > b, 0 if equal
 */
export function compareHungarianIgnoreCase(a: string, b: string): number {
    return hungarianCharacterCompare(a.toLowerCase(), b.toLowerCase());
}

/**
 * Sort an array of strings using Hungarian collation
 * @param strings - Array of strings to sort
 * @param options - Additional Intl.Collator options (unused, kept for API compatibility)
 * @returns New sorted array
 */
export function sortStringsHungarian(
    strings: string[],
    _options?: Intl.CollatorOptions,
): string[] {
    return [...strings].sort(hungarianCharacterCompare);
}

/**
 * Sort an array of objects by a string property using Hungarian collation
 * @param objects - Array of objects to sort
 * @param keySelector - Function to extract the string property to sort by
 * @param options - Additional Intl.Collator options (unused, kept for API compatibility)
 * @returns New sorted array
 */
export function sortByPropertyHungarian<T>(
    objects: T[],
    keySelector: (obj: T) => string,
    _options?: Intl.CollatorOptions,
): T[] {
    return [...objects].sort((a, b) =>
        hungarianCharacterCompare(keySelector(a), keySelector(b)),
    );
}

/**
 * Create a comparison function for Array.sort() that uses Hungarian collation
 * @param keySelector - Function to extract the string property to sort by
 * @param direction - Sort direction: 'asc' for ascending, 'desc' for descending
 * @param options - Additional Intl.Collator options (unused, kept for API compatibility)
 * @returns Comparison function suitable for Array.sort()
 */
export function createHungarianComparator<T>(
    keySelector: (obj: T) => string,
    direction: "asc" | "desc" = "asc",
    _options?: Intl.CollatorOptions,
): (a: T, b: T) => number {
    const multiplier = direction === "asc" ? 1 : -1;

    return (a: T, b: T): number => {
        return (
            multiplier *
            hungarianCharacterCompare(keySelector(a), keySelector(b))
        );
    };
}
