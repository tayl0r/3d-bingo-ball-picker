import type { CustomLogo } from "./logoStorage";

const STORAGE_KEY = "bingo_sponsor_logo";
const SCALE_KEY = "bingo_sponsor_logo_scale";

export function getSponsorLogo(): CustomLogo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomLogo;
  } catch {
    return null;
  }
}

export function setSponsorLogo(dataUrl: string, aspect: number): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dataUrl, aspect }));
    return true;
  } catch {
    return false;
  }
}

export function clearSponsorLogo(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSponsorLogoScale(): number {
  try {
    const v = localStorage.getItem(SCALE_KEY);
    return v ? Number(v) : 1;
  } catch {
    return 1;
  }
}

export function setSponsorLogoScale(scale: number): void {
  try {
    localStorage.setItem(SCALE_KEY, String(scale));
  } catch {}
}

const OFFSET_X_KEY = "bingo_sponsor_logo_offset_x";

export function getSponsorLogoOffsetX(): number {
  try {
    const v = localStorage.getItem(OFFSET_X_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export function setSponsorLogoOffsetX(offset: number): void {
  try {
    localStorage.setItem(OFFSET_X_KEY, String(offset));
  } catch {}
}

const BRIGHTNESS_KEY = "bingo_sponsor_logo_brightness";
const CONTRAST_KEY = "bingo_sponsor_logo_contrast";

export function getSponsorLogoBrightness(): number {
  try {
    const v = localStorage.getItem(BRIGHTNESS_KEY);
    return v ? Number(v) : 1;
  } catch {
    return 1;
  }
}

export function setSponsorLogoBrightness(value: number): void {
  try {
    localStorage.setItem(BRIGHTNESS_KEY, String(value));
  } catch {}
}

export function getSponsorLogoContrast(): number {
  try {
    const v = localStorage.getItem(CONTRAST_KEY);
    return v ? Number(v) : 1;
  } catch {
    return 1;
  }
}

export function setSponsorLogoContrast(value: number): void {
  try {
    localStorage.setItem(CONTRAST_KEY, String(value));
  } catch {}
}
