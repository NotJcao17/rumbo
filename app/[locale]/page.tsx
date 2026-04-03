'use client'

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Onboarding from "@/components/Onboarding"

export default function Home() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    const lang = localStorage.getItem('lang')
    if (lang) {
      //una vez seleccionado el idioma se manda al mapa
      router.push(`/${lang}/map`)
    }
    //si no hay lang, no hacemos nada -> se muestra el onboarding
  }, [])

  return (
    <main className="min-h-screen">
      <Onboarding />
    </main>
  )
}
