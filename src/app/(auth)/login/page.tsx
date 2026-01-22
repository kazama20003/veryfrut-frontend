"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Fraunces, Space_Grotesk } from "next/font/google"
import { Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLoginMutation } from "@/lib/api"
import { decodeJwtPayload } from "@/lib/api/auth"
import { toast } from "sonner"

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
})

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export default function LoginPage() {
  const router = useRouter()
  const loginMutation = useLoginMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage("")
    if (!canSubmit) {
      const message = "Completa el email y la clave"
      toast.error(message)
      setErrorMessage(message)
      return
    }

    try {
      const response = await loginMutation.mutateAsync({ email, password })
      const token =
        typeof response === "string"
          ? response
          : response?.accessToken || response?.access_token || response?.token

      if (!token) {
        const message = "No se recibio token de acceso"
        toast.error(message)
        setErrorMessage(message)
        return
      }

      const payload = decodeJwtPayload(token)
      const role = payload?.role

      if (role === "admin") {
        router.push("/dashboard")
        return
      }

      router.push("/users")
    } catch {
      const message = "Credenciales invalidas"
      toast.error(message)
      setErrorMessage(message)
    }
  }

  return (
    <div className={`${body.className} relative min-h-screen overflow-hidden bg-[#f6f0e8]`}>
      <div className="absolute inset-0">
        <div className="absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_#ffd5a8_0%,_#f6f0e8_70%)] blur-2xl" />
        <div className="absolute bottom-[-120px] left-[-10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,_#b8e7c7_0%,_#f6f0e8_70%)] blur-2xl" />
        <div className="absolute left-1/2 top-10 h-[260px] w-[260px] -translate-x-1/2 rounded-[40%] bg-[radial-gradient(circle_at_center,_#fff2d9_0%,_#f6f0e8_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-14">
        <div className="grid w-full gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <section className="relative rounded-[32px] border border-black/10 bg-white/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
              <ShieldCheck className="h-4 w-4" />
              acceso seguro
            </div>
            <h1 className={`${display.className} mt-6 text-4xl font-bold text-[#23201a] md:text-5xl`}>
              Tu cuenta Veryfrut en un solo lugar
            </h1>
            <p className="mt-4 max-w-md text-base text-black/70">
              Ingresa con tus credenciales para crear ordenes, revisar productos y gestionar tu tablero.
            </p>
            <div className="mt-10 grid gap-4 text-sm text-black/70">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe3bf] text-black/80">1</span>
                Identifica las areas asignadas a tu cuenta.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c8f0d7] text-black/80">2</span>
                Crea ordenes con entregas precisas.
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe3bf] text-black/80">3</span>
                Administra tu cuenta de forma segura.
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
            <h2 className={`${display.className} text-3xl font-semibold text-[#23201a]`}>
              Iniciar sesion
            </h2>
            <p className="mt-2 text-sm text-black/60">Usa tu email y tu clave personal.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black/80">Email</label>
                <Input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-11 rounded-xl border-black/10 bg-white/80"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-black/80">Clave</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-black/10 bg-white/80"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#1f7a48] text-white hover:bg-[#18633b]"
                disabled={!canSubmit || loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ingresando
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
