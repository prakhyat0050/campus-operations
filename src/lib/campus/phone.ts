export function normalizeCampusPhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;

  return `+${digits}`;
}

export function isValidE164Phone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
