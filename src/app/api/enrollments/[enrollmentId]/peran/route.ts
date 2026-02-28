// ======================================================
// PATCH /api/enrollments/[enrollmentId]/peran
// Ubah peran anggota di kelas
// Auth: hanya dosen kelas ini
// ======================================================
import { NextRequest } from "next/server"
import { z } from "zod"
import { ok, err, E, getAuthUser } from "@/lib/apiHelpers"
import { createSupabaseServiceClient } from "@/lib/supabase/server"

const schema = z.object({
  peran: z.enum(["mahasiswa", "asisten", "dosen"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const { enrollmentId } = await params

  const { user } = await getAuthUser()
  if (!user) return err(E.UNAUTHORIZED, "Kamu harus login.", 401)

  let body: unknown
  try { body = await request.json() } catch {
    return err(E.VALIDATION_ERROR, "Body bukan JSON yang valid.", 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return err(E.VALIDATION_ERROR, "Peran harus salah satu dari: mahasiswa, asisten, dosen.", 400)
  }

  const { peran } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createSupabaseServiceClient() as any

  // Ambil enrollment target untuk dapatkan class_id
  const { data: target, error: fetchErr } = await service
    .from("enrollments")
    .select("id, class_id")
    .eq("id", enrollmentId)
    .single()

  if (fetchErr || !target) return err(E.NOT_FOUND, "Enrollment tidak ditemukan.", 404)

  // Cek apakah user login adalah DOSEN di kelas ini (bukan asisten)
  const { data: myEnrollment } = await service
    .from("enrollments")
    .select("peran")
    .eq("class_id", target.class_id)
    .eq("user_id", user.id)
    .in("peran", ["dosen"])
    .single()

  if (!myEnrollment) {
    return err(E.FORBIDDEN, "Hanya dosen yang bisa mengubah peran.", 403)
  }

  const { data, error: updateErr } = await service
    .from("enrollments")
    .update({ peran })
    .eq("id", enrollmentId)
    .select("id, peran")
    .single()

  if (updateErr) {
    console.error("[enrollments/peran PATCH]", updateErr.message)
    return err(E.INTERNAL_ERROR, "Gagal mengubah peran.", 500)
  }

  return ok({ peran: data.peran })
}
