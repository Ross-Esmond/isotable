const SOURCE_CODE_KEY = 'isotable_sourceCode';

/**
 * Gets the sourceCode from localStorage if it exists
 */
export function getStoredSourceCode(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(SOURCE_CODE_KEY);
  if (stored === null) {
    return null;
  }

  const parsed = parseInt(stored, 10);
  if (isNaN(parsed) || parsed < 0 || parsed >= 256) {
    return null;
  }

  return parsed;
}

/**
 * Saves the sourceCode to localStorage
 */
export function saveSourceCode(sourceCode: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (sourceCode < 1 || sourceCode >= 256) {
    throw new Error(`Source code must be between 1 and 255, got ${sourceCode}`);
  }

  localStorage.setItem(SOURCE_CODE_KEY, sourceCode.toString());
}
