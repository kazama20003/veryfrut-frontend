"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const QuoteCharacter: React.FC = () => (
  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#1A96FF] relative overflow-hidden flex-shrink-0">
    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[85%] h-[6px] bg-[#1A1A1A] rounded-sm z-10 overflow-hidden flex">
      <div className="w-1/2 border-r border-white/5" />
      <div className="w-1/2" />
    </div>
    <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[14px] h-[8px] bg-[#1A1A1A] rounded-b-full overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[10px] h-[2px] bg-white rounded-b-[1px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[9px] h-[3px] bg-[#FF5C5C] rounded-t-full" />
    </div>
  </div>
)

type Slide = { title: string; description: string; image: string }

const SLIDES: Slide[] = [
  {
    title: "Productos frescos de la mejor calidad",
    description: "Ofrecemos un servicio integral de abastecimiento de productos de la mejor calidad",
    image:
      "https://res.cloudinary.com/dhkb93mix/image/upload/v1770755728/WhatsApp_Image_2026-02-10_at_3.09.59_PM_kdtscc.jpg",
  },
  {
    title: "Soluciones sostenibles",
    description: "Adaptamos nuestros servicios de distribucion de la mejor calidad a las necesidades de nuestros clientes",
    image:
      "https://res.cloudinary.com/demzflxgq/image/upload/v1770444706/sabrina_ripke_fotografie-pumpkin-1768857_1280_xxf594.jpg",
  },
  {
    title: "Soluciones institucionales",
    description: "Productos adaptado a las necesidades de comedores escolares, hospitales, servicios de restaurante y mas",
    image:
      "https://res.cloudinary.com/dhkb93mix/image/upload/v1770755826/WhatsApp_Image_2026-02-10_at_3.13.05_PM_rtahqr.jpg",
  },
]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  return reduced
}

const Hero = () => {
  const reducedMotion = usePrefersReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = useCallback((toIndex: number) => {
    setCurrentIndex((prev) => (prev === toIndex ? prev : toIndex))
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
    }, reducedMotion ? 9000 : 7500)

    return () => window.clearInterval(intervalId)
  }, [reducedMotion])

  return (
    <section className="relative z-0 w-full h-[100svh] overflow-hidden bg-gradient-to-b from-lime-50 to-white">
      <div className="absolute inset-0">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentIndex

          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`absolute inset-0 transition-transform duration-[8000ms] ${
                  reducedMotion ? "" : "ease-linear"
                } ${isActive ? "scale-100" : "scale-105"}`}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(0,0,0,0.35),rgba(0,0,0,0.15)_45%,rgba(0,0,0,0)_75%)]" />
              </div>

              <div className="relative z-10 w-full h-full px-6 md:px-8 lg:px-16 flex flex-col items-start justify-center max-w-4xl">
                <h2
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-2xl transition-all duration-[1300ms] ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                >
                  {slide.title}
                </h2>
                <p
                  className={`text-lg md:text-xl text-white/90 max-w-xl leading-relaxed transition-all duration-[1500ms] ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 z-20 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 px-4">
        <Link
          href="/users"
          className="inline-flex w-full md:w-auto bg-[#8CC63F] rounded-full shadow-lg items-center justify-center gap-2 md:gap-3 hover:bg-[#7db138] transition-colors cursor-pointer px-6 md:px-8 py-3 md:py-4 whitespace-nowrap font-semibold"
        >
          <span className="text-white text-base md:text-lg font-normal tracking-normal leading-9">Pedir ya</span>
          <QuoteCharacter />
        </Link>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

export default Hero
