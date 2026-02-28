"use client"
// ======================================================
// useApiMutation — Generic hook untuk POST/PATCH/DELETE
// Loading state, error state, toast otomatis
// ======================================================
import { useState, useCallback } from "react"
import { useToast } from "@/hooks/useToast"
import type { ApiError, ApiSuccess } from "@/lib/apiHelpers"

type MutationOptions<TData> = {
  onSuccess?: (data: TData) => void
  onError?:   (error: ApiError) => void
  successMessage?: string
}

export function useApiMutation<TInput = unknown, TData = unknown>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST",
  options: MutationOptions<TData> = {}
) {
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<ApiError | null>(null)
  const [data,    setData]      = useState<TData | null>(null)
  const { toast } = useToast()

  const mutate = useCallback(async (input?: TInput) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: input !== undefined ? JSON.stringify(input) : undefined,
        credentials: "same-origin",
      })

      const json: ApiSuccess<TData> | ApiError = await res.json()

      if (!json.success) {
        const apiErr = json as ApiError
        setError(apiErr)
        options.onError?.(apiErr)
        toast.error(apiErr.message)
        return null
      }

      const result = (json as ApiSuccess<TData>).data
      setData(result)
      options.onSuccess?.(result)

      if (options.successMessage) {
        toast.success(options.successMessage)
      }

      return result
    } catch {
      const msg = "Gagal terhubung ke server. Periksa koneksi internet kamu."
      const fallbackErr: ApiError = {
        success: false,
        error: "NETWORK_ERROR",
        message: msg,
      }
      setError(fallbackErr)
      options.onError?.(fallbackErr)
      toast.error(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [url, method, options, toast])

  return { mutate, loading, error, data }
}
