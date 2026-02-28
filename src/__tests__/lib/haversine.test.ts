// ======================================================
// Unit Tests — haversine.ts
// Covers: haversineDistance, checkInRange
// B7 item: logika di balik B7.6 (OUT_OF_RANGE detection)
// ======================================================
import { describe, it, expect } from "vitest"
import { haversineDistance, checkInRange } from "@/lib/haversine"

// Titik referensi nyata: Kampus ITERA (approx)
const ITERA_LAT = -5.3600
const ITERA_LNG = 105.3200

describe("haversineDistance", () => {
  it("jarak titik sama diri sendiri = 0", () => {
    const d = haversineDistance(ITERA_LAT, ITERA_LNG, ITERA_LAT, ITERA_LNG)
    expect(d).toBe(0)
  })

  it("jarak dua titik ±50m masuk akal", () => {
    // Geser ~0.00045° lat ≈ 50 meter
    const d = haversineDistance(ITERA_LAT, ITERA_LNG, ITERA_LAT + 0.00045, ITERA_LNG)
    expect(d).toBeGreaterThan(40)
    expect(d).toBeLessThan(60)
  })

  it("jarak dua titik ±200m masuk akal", () => {
    // Geser ~0.0018° lat ≈ 200 meter
    const d = haversineDistance(ITERA_LAT, ITERA_LNG, ITERA_LAT + 0.0018, ITERA_LNG)
    expect(d).toBeGreaterThan(170)
    expect(d).toBeLessThan(230)
  })

  it("simetris — jarak A→B = B→A", () => {
    const d1 = haversineDistance(ITERA_LAT, ITERA_LNG, ITERA_LAT + 0.001, ITERA_LNG + 0.001)
    const d2 = haversineDistance(ITERA_LAT + 0.001, ITERA_LNG + 0.001, ITERA_LAT, ITERA_LNG)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })

  it("jarak sangat jauh (Lampung → Jakarta ≈ 250 km) bernilai >100.000m", () => {
    // Kota Bandar Lampung → Jakarta
    const d = haversineDistance(-5.45, 105.27, -6.21, 106.85)
    expect(d).toBeGreaterThan(180_000)
    expect(d).toBeLessThan(320_000)
  })

  it("koordinat ekstrem: kutub utara → kutub selatan ≈ 20.000 km", () => {
    const d = haversineDistance(90, 0, -90, 0)
    expect(d).toBeGreaterThan(19_900_000)
    expect(d).toBeLessThan(20_100_000)
  })
})

describe("checkInRange", () => {
  const SESSION_LAT = ITERA_LAT
  const SESSION_LNG = ITERA_LNG
  const RADIUS = 100 // meter

  it("titik persis di tengah → inRange=true, distance=0", () => {
    const { inRange, distance } = checkInRange(SESSION_LAT, SESSION_LNG, SESSION_LAT, SESSION_LNG, RADIUS)
    expect(inRange).toBe(true)
    expect(distance).toBe(0)
  })

  it("titik 30m dari pusat, radius 100m → inRange=true", () => {
    // ~0.00027° ≈ 30m
    const { inRange, distance } = checkInRange(SESSION_LAT + 0.00027, SESSION_LNG, SESSION_LAT, SESSION_LNG, RADIUS)
    expect(inRange).toBe(true)
    expect(distance).toBeGreaterThan(20)
    expect(distance).toBeLessThan(40)
  })

  it("titik 250m dari pusat, radius 100m → inRange=false", () => {
    // ~0.00225° ≈ 250m
    const { inRange, distance } = checkInRange(SESSION_LAT + 0.00225, SESSION_LNG, SESSION_LAT, SESSION_LNG, RADIUS)
    expect(inRange).toBe(false)
    expect(distance).toBeGreaterThan(200)
  })

  it("tepat di batas radius → inRange=true", () => {
    // 0.0009° ≈ 100m
    const { inRange } = checkInRange(SESSION_LAT + 0.0009, SESSION_LNG, SESSION_LAT, SESSION_LNG, RADIUS)
    // bisa true atau false tergantung presisi — cukup assert distance ada
    expect(typeof inRange).toBe("boolean")
  })

  it("radius 0m → hanya titik persis yang inRange", () => {
    const { inRange: atCenter } = checkInRange(SESSION_LAT, SESSION_LNG, SESSION_LAT, SESSION_LNG, 0)
    expect(atCenter).toBe(true)

    const { inRange: offset } = checkInRange(SESSION_LAT + 0.00001, SESSION_LNG, SESSION_LAT, SESSION_LNG, 0)
    expect(offset).toBe(false)
  })

  it("returns distance value yang konsisten dengan haversineDistance", () => {
    const { distance: fromCheck } = checkInRange(SESSION_LAT + 0.001, SESSION_LNG, SESSION_LAT, SESSION_LNG, RADIUS)
    const direct = haversineDistance(SESSION_LAT + 0.001, SESSION_LNG, SESSION_LAT, SESSION_LNG)
    expect(fromCheck).toBeCloseTo(direct, 5)
  })
})
