"use client"

import React, { useEffect, useState } from "react"
import Lottie from "lottie-react"
import Link from "next/link"

const QuoteCharacter: React.FC = () => (
  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#1A96FF] relative overflow-hidden flex-shrink-0">
    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[85%] h-[6px] bg-[#1A1A1A] rounded-sm z-10 overflow-hidden flex">
      <div className="w-1/2 border-r border-white/5"></div>
      <div className="w-1/2"></div>
    </div>
    <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[14px] h-[8px] bg-[#1A1A1A] rounded-b-full overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[10px] h-[2px] bg-white rounded-b-[1px]"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[9px] h-[3px] bg-[#FF5C5C] rounded-t-full"></div>
    </div>
  </div>
)

const Hero = () => {
  const [animationData, setAnimationData] =
    useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch("/lotties/hero.json")
      .then((res) => {
        if (!res.ok) throw new Error("Error loading Lottie JSON")
        return res.json()
      })
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  return (
    <section
      className="
        relative
        w-full
        h-[120svh]
        overflow-hidden
        bg-[var(--color-lime)]
      "
    >
      {/* LOTTIE BACKGROUND */}
      {animationData && (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
      )}

      {/* CONTENIDO */}
      <div
        className="
          relative
          z-10
          w-full
          h-[100svh]
          px-6
          md:px-8
          flex
          flex-col
          items-center
          justify-center
          text-center
          gap-4
          md:gap-5
          pt-20
          md:pt-24
        "
      >
        {/* H1 - Título Principal */}
        <h1
          className="
            w-full
            max-w-5xl
            font-semibold
            leading-[1.2]
            text-[clamp(2rem,7vw,3.8rem)]
            tracking-[-0.02em]
            md:tracking-[-0.04em]
            text-[var(--color-primary-text)]
          "
        >
          Distribución sostenible de frutas y verduras frescas
        </h1>

        {/* Descripción */}
        <p
          className="
            w-full
            max-w-2xl
            text-sm
            md:text-base
            text-[var(--color-secondary-text)]
            leading-relaxed
            mt-2
          "
        >
          Conectamos productores locales con consumidores conscientes, garantizando la máxima frescura y sostenibilidad en cada entrega
        </p>

        {/* CTA BUTTON - Estilo Header */}
        <div className="mt-6 md:mt-8">
          <Link
            href="/users"
            className="
              inline-flex
              bg-white
              rounded-[10px]
              shadow-[0_2px_12px_rgba(0,0,0,0.04)]
              items-center
              gap-2
              md:gap-3
              hover:bg-neutral-50
              transition-colors
              cursor-pointer
              px-4
              md:px-6
              py-2.5
              md:py-3
              whitespace-nowrap
            "
          >
            <span className="text-[#1A1A1A] text-base md:text-lg lg:text-[18px] font-normal tracking-normal leading-9">
              Pedir ya
            </span>
            <QuoteCharacter />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
