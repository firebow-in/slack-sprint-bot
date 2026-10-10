export const extractCompletion = (text: string): number | null => {
  if (!text) return null;

  const cleanText = text
    .replace(/[*_~>•-]/g, " ")
    .replace(/\s+/g, " ");

  const match = cleanText.match(/completion\s*:\s*(\d+)\s*%?/i);

  if (!match) return null;

  const value = parseInt(match[1], 10);

  if (isNaN(value) || value < 0 || value > 200) {
    return null;
  }

  return value;
};