// ======================================================
// Haversine Formula — Hitung Jarak Dua Koordinat (Meter)
// Pure function, no side effects, no dependencies
// ======================================================

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Hitung jarak antara dua titik koordinat GPS menggunakan Haversine formula.
 * @returns Jarak dalam meter (float)
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Cek apakah koordinat mahasiswa berada dalam radius sesi.
 * @returns { inRange: boolean, distance: number }
 */
export function checkInRange(
  studentLat: number, studentLng: number,
  sessionLat: number, sessionLng: number,
  radiusMeter: number
): { inRange: boolean; distance: number } {
  const distance = haversineDistance(studentLat, studentLng, sessionLat, sessionLng)
  return { inRange: distance <= radiusMeter, distance }
}
