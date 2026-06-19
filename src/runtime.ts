export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassArray;

export function scopedClass(value: ClassValue, hash: string): string {
  const className = toClass(value);

  return className ? `${className} ${hash}` : '';
}

function toClass(value: ClassValue): string {
  if (!value || typeof value === 'boolean') return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toClass).filter(Boolean).join(' ');
  }

  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([className]) => className)
    .join(' ');
}
