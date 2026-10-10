export const extractDate = (text: string): string | null => {
  if (!text) return null;

  const normalized = text.replace(/[\u2013\u2014-]/g, "-");
  
  const match = normalized.match(/Weekly Sprint \((\d{4}-\d{2}-\d{2})\)/);

  return match ? match[1] : null;
};
