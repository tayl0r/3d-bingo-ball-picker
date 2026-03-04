const STORAGE_KEY = "bingo_custom_logo";

export interface CustomLogo {
  dataUrl: string;
  aspect: number;
}

export function getCustomLogo(): CustomLogo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomLogo;
  } catch {
    return null;
  }
}

export function setCustomLogo(dataUrl: string, aspect: number): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dataUrl, aspect }));
    return true;
  } catch {
    return false;
  }
}

export function clearCustomLogo(): void {
  localStorage.removeItem(STORAGE_KEY);
}
