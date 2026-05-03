export const KT_TO_MPH = 1.15078;
export const KT_TO_KMH = 1.852;

export function ktToMph(kt: number): number {
  return Math.round(kt * KT_TO_MPH);
}

export function ktToKmh(kt: number): number {
  return Math.round(kt * KT_TO_KMH);
}

export function fmtMb(mb: number | null | undefined): string {
  if (mb == null) return "—";
  return `${mb} mb`;
}

export function fmtAce(ace: number): string {
  return ace.toFixed(2);
}

export function fmtKt(kt: number): string {
  return `${kt} kt`;
}

export function fmtCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${ns}, ${Math.abs(lon).toFixed(1)}°${ew}`;
}

export function fmtUsd(n: number | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

export function fmtInt(n: number | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function fmtLifespan(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return `${days}d ${hours.toString().padStart(2, "0")}h`;
}

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
