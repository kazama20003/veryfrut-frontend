"use client"

import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger)

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    if (!sectionRef.current || !pathRef.current) return

    const ctx = gsap.context(() => {
      const lenis = new Lenis({ lerp: 0.1 })
      lenis.on("scroll", ScrollTrigger.update)
      gsap.ticker.add((time) => lenis.raf(time * 1000))

      const path = pathRef.current!
      const length = path.getTotalLength()

      // Estado inicial: Todo oculto
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      })

      const cards = gsap.utils.toArray<HTMLElement>(".story-card")
      const illustrations = gsap.utils.toArray<HTMLElement>(".floating-illustration")

      // TIMELINE MAESTRO
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 20%", // El trazo empieza a bajar desde arriba
          end: "bottom bottom",
          scrub: 1.5,
        },
      })

      // Animación secuencial: Trazo y aparición
      tl.to(path, { strokeDashoffset: 0, ease: "none" }, 0)

      cards.forEach((card, i) => {
        // La card aparece justo cuando el trazo llega a su altura
        tl.fromTo(card, 
          { opacity: 0, y: 100, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, ease: "power2.out" },
          (i / cards.length) * 0.8 // Distribuye la aparición según el progreso del trazo
        )
      })

      illustrations.forEach((ill, i) => {
        tl.fromTo(ill,
          { opacity: 0, scale: 0, rotate: -20 },
          { opacity: 0.6, scale: 1, rotate: 0, ease: "back.out(1.7)" },
          (i / illustrations.length) * 0.9
        )
      })

    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative px-6 pt-32 pb-64 lg:px-12 bg-white rounded-t-[100px] -mt-[15vh] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
    >
      {/* SVG — TRAZO PRINCIPAL */}
      <div className="pointer-events-none absolute inset-0 z-0 flex justify-center">
        <div className="w-[90%] h-full">
          <svg viewBox="0 0 325 839" className="w-full h-full preserve-3d">
            <path
              ref={pathRef}
              d="M168.104 31.865C168.104 31.865 76.854 -19.135 91.854 156.865C106.854 332.865 221.854 113.865 291.854 340.865C361.854 567.865 -44.3494 684.898 35.354 444.865C115.057 204.832 329.354 524.147 195.354 636.147C61.3541 748.147 152.854 814.147 152.854 814.147"
              stroke="var(--color-lime)"
              strokeWidth={40}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ILUSTRACIONES FLOTANTES (FUERA DE LAS CARDS) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="floating-illustration absolute top-[15%] left-[10%] w-32 h-32 text-lime-200">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C17 11.3137 14.3137 14 11 14C7.68629 14 5 11.3137 5 8C5 4.68629 7.68629 2 11 2C14.3137 2 17 4.68629 17 8Z"/><path d="M3 18C3 15.7909 4.79086 14 7 14H15C17.2091 14 19 15.7909 19 18V22H3V18Z"/></svg>
        </div>
        <div className="floating-illustration absolute top-[40%] right-[5%] w-40 h-40 text-blue-100">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
        <div className="floating-illustration absolute top-[65%] left-[15%] w-36 h-36 text-orange-100">
           <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
        </div>
      </div>

      <div className="relative z-20 flex flex-col gap-64 max-w-7xl mx-auto">
        
        {/* Intro - Sincronizada con el inicio del trazo */}
        <div className="story-card max-w-2xl mx-auto text-center bg-white border border-gray-100 p-10 rounded-2xl">
          <h2 className="text-5xl font-black text-gray-900 mb-6 uppercase tracking-tighter italic">Nuestras Categorías</h2>
          <p className="text-xl text-gray-600 font-light italic">Suministro inteligente guiado por la frescura.</p>
        </div>

        {/* 1. Verduras (Izquierda) */}
        <div className="story-card mr-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">Verduras de Tallo</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Cebolla china y Cilantro seleccionado directamente de campos certificados.</p>
          <button className="w-full py-3 bg-[var(--color-lime)] text-black font-black rounded-lg">VER CATÁLOGO</button>
        </div>

        {/* 2. Soluciones Institucionales (Derecha) */}
        <div className="story-card ml-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">Soluciones B2B</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Soporte logístico para el sector Horeca con facturación inmediata.</p>
          <button className="w-full py-3 bg-blue-600 text-white font-black rounded-lg">AREA NEGOCIOS</button>
        </div>

        {/* 3. Calidad Premium (Izquierda) */}
        <div className="story-card mr-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">Máxima Calidad</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Selección manual grano a grano para asegurar el estándar premium.</p>
          <button className="w-full py-3 bg-teal-500 text-white font-black rounded-lg">CALIDAD TOTAL</button>
        </div>

        {/* 4. Soluciones Sostenibles (Derecha) */}
        <div className="story-card ml-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">Sostenibilidad</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Comprometidos con el residuo cero y empaques biodegradables.</p>
          <button className="w-full py-3 bg-green-600 text-white font-black rounded-lg">ECO PROCESOS</button>
        </div>

        {/* 5. Frutas & Tubérculos (Centro) */}
        <div className="story-card mx-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Frutas & Tubérculos</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Variedades nativas y estacionales con maduración controlada.</p>
          <button className="w-full py-3 bg-orange-500 text-white font-black rounded-lg">EXPLORAR</button>
        </div>

        {/* 6. IGV Otros (Derecha) */}
        <div className="story-card ml-auto max-w-md bg-white border border-gray-100 p-8 rounded-2xl">
          <h3 className="text-3xl font-bold mb-4">IGV & Complementos</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">Complementos esenciales para la operatividad de su cocina industrial.</p>
          <button className="w-full py-3 bg-purple-600 text-white font-black rounded-lg">VER MÁS</button>
        </div>

        {/* Footer final CTA */}
        <div className="story-card max-w-6xl mx-auto bg-black text-white p-20 rounded-2xl text-center">
          <h2 className="text-6xl font-black mb-8 italic tracking-tighter uppercase leading-none">Abastecimiento <br/> Profesional</h2>
          <button className="bg-[var(--color-lime)] text-black px-16 py-5 rounded-lg font-black text-xl hover:scale-105 transition-transform">
            SOLICITAR COTIZACIÓN
          </button>
        </div>

      </div>
    </section>
  )
}