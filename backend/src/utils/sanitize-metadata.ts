const BLOCKED_KEYS = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'authorization'];

const cleanObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(cleanObject);
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.toLowerCase();
      if (BLOCKED_KEYS.some((blocked) => normalized.includes(blocked))) {
        continue;
      }
      output[key] = cleanObject(nestedValue);
    }
    return output;
  }

  return value;
};

export const sanitizeMetadata = (metadata?: Record<string, unknown>): Record<string, unknown> | null => {
  if (!metadata) {
    return null;
  }
  return cleanObject(metadata) as Record<string, unknown>;
};
