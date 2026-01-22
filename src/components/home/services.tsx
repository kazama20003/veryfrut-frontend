"use client"

import Image from "next/image"
import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger)

type DecoImg = {
  src: string
  alt: string
  w: number
  h: number
  // posición “anclada” al trazo
  t: number // 0..1 sobre el path
  offsetX?: number // px (derecha + / izquierda -)
  offsetY?: number // px (abajo + / arriba -)
  rotate?: number // deg
  scale?: number
  opacity?: number
  className?: string // para ocultar en mobile, etc.
  priority?: boolean
}

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const servicesFlowRef = useRef<HTMLDivElement>(null) // ✅ solo cards del bloque servicios
  const pathRef = useRef<SVGPathElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)

  // ✅ refs para “decoraciones” (fuera de cards)
  const decoRefs = useRef<Array<HTMLDivElement | null>>([])

  // ✅ DECOS pegados al trazo (ajusta t/offsetX/offsetY hasta que calce perfecto en tus “huecos”)
  const DECOS: DecoImg[] = [
    {
      src: "https://res.cloudinary.com/dhkb93mix/image/upload/v1768864290/mujer-granjero-organico-plano_h3k7xf.png",
      alt: "Agricultora",
      w: 260,
      h: 260,
      t: 0.16,
      offsetX: 130,
      offsetY: -40,
      rotate: 6,
      scale: 1,
      opacity: 0.95,
      className: "hidden lg:block",
      priority: true,
    },
    {
      src: "https://res.cloudinary.com/diaujeypx/image/upload/v1768878569/farm-landscape-woman-with-fruit-hands_vk42yc.png",
      alt: "Calidad",
      w: 230,
      h: 230,
      t: 0.33,
      offsetX: -170,
      offsetY: 30,
      rotate: -10,
      scale: 1,
      opacity: 0.95,
      className: "hidden lg:block",
    },
    {
      src: "https://res.cloudinary.com/diaujeypx/image/upload/v1768878915/ChatGPT_Image_19_ene_2026_10_13_43_p.m._sbhkzh.png",
      alt: "Caja",
      w: 250,
      h: 250,
      t: 0.55,
      offsetX: 150,
      offsetY: 40,
      rotate: 8,
      scale: 1,
      opacity: 0.95,
      className: "hidden lg:block",
    },
    {
      src: "https://res.cloudinary.com/diaujeypx/image/upload/v1768878991/pngtree-autumn-leaves-seamless-border-illustration-png-image_15417653_vvurdl.png",
      alt: "Hoja",
      w: 240,
      h: 240,
      t: 0.72,
      offsetX: -170,
      offsetY: -30,
      rotate: -6,
      scale: 1,
      opacity: 0.95,
      className: "hidden lg:block",
    },
    {
      src: "https://res.cloudinary.com/diaujeypx/image/upload/v1768878569/farm-landscape-woman-with-fruit-hands_vk42yc.png",
      alt: "Verduras",
      w: 260,
      h: 260,
      t: 0.86,
      offsetX: 140,
      offsetY: 10,
      rotate: 5,
      scale: 1,
      opacity: 0.95,
      className: "hidden lg:block",
    },
  ]

  useLayoutEffect(() => {
    if (!sectionRef.current || !servicesFlowRef.current || !pathRef.current || !categoriesRef.current) return

    const ctx = gsap.context(() => {
      // ===============================
      // LENIS
      // ===============================
      const lenis = new Lenis({ lerp: 0.22 })

      const onTick = (time: number) => {
        lenis.raf(time * 1000)
        ScrollTrigger.update()
      }

      lenis.on("scroll", ScrollTrigger.update)
      gsap.ticker.add(onTick)
      gsap.ticker.lagSmoothing(0)

      // ===============================
      // SVG PATH
      // ===============================
      const section = sectionRef.current!
      const path = pathRef.current!
      const svg = path.ownerSVGElement
      if (!svg) return

      const length = path.getTotalLength()
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

      // ===============================
      // CARDS (solo servicios)
      // ===============================
      const cards = gsap.utils.toArray<HTMLElement>(".story-card", servicesFlowRef.current!)
      gsap.set(cards, { opacity: 0, y: 70, scale: 0.96, transformOrigin: "50% 50%" })

      // ===============================
      // TIMELINE: termina en categorías
      // ===============================
      const START = "top 85%"
      const END = "top 85%"

      const pathTween = gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1,
        ease: "none",
        paused: true,
      })

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: START,
          endTrigger: categoriesRef.current,
          end: END,
          scrub: 0.25,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        },
      })

      tl.add(pathTween.play(0), 0)

      // ===============================
      // Helpers: coords SVG <-> section
      // ===============================
      const getVB = () => {
        const vb = svg.viewBox?.baseVal
        return {
          vbW: vb && vb.width ? vb.width : 325,
          vbH: vb && vb.height ? vb.height : 839,
        }
      }

      const svgPointToClient = (x: number, y: number) => {
        const { vbW, vbH } = getVB()
        const svgRect = svg.getBoundingClientRect()

        const nx = x / vbW
        const ny = y / vbH

        const clientX = svgRect.left + nx * svgRect.width
        const clientY = svgRect.top + ny * svgRect.height
        return { clientX, clientY }
      }

      const clientToSection = (clientX: number, clientY: number) => {
        const sectionRect = section.getBoundingClientRect()
        return {
          x: clientX - sectionRect.left,
          y: clientY - sectionRect.top,
        }
      }

      // ===============================
      // MAPEO: card -> progreso del trazo
      // ===============================
      const buildLookup = () => {
        const vb = svg.viewBox?.baseVal
        const vbW = vb && vb.width ? vb.width : 325
        const vbH = vb && vb.height ? vb.height : 839

        const svgRect = svg.getBoundingClientRect()

        const SAMPLES = 900
        const pts = new Array(SAMPLES)
        for (let i = 0; i < SAMPLES; i++) {
          const t = i / (SAMPLES - 1)
          const p = path.getPointAtLength(t * length)
          pts[i] = { t, x: p.x, y: p.y }
        }

        const clientToSvg = (clientX: number, clientY: number) => {
          const nx = (clientX - svgRect.left) / Math.max(1, svgRect.width)
          const ny = (clientY - svgRect.top) / Math.max(1, svgRect.height)
          return { x: nx * vbW, y: ny * vbH }
        }

        const cardT: number[] = cards.map((card) => {
          const r = card.getBoundingClientRect()
          const anchorClientX = r.left + r.width * 0.5
          const anchorClientY = r.top + Math.min(60, r.height * 0.25)

          const target = clientToSvg(anchorClientX, anchorClientY)

          let bestT = 0
          let bestD = Number.POSITIVE_INFINITY

          for (let i = 0; i < pts.length; i++) {
            const dx = pts[i].x - target.x
            const dy = pts[i].y - target.y
            const d = dx * dx + dy * dy
            if (d < bestD) {
              bestD = d
              bestT = pts[i].t
            }
          }

          return gsap.utils.clamp(0.02, 0.98, bestT)
        })

        const pairs = cards.map((el, i) => ({ el, t: cardT[i] }))
        pairs.sort((a, b) => a.t - b.t)

        const MIN_GAP = 0.02
        for (let i = 1; i < pairs.length; i++) {
          if (pairs[i].t < pairs[i - 1].t + MIN_GAP) {
            pairs[i].t = Math.min(0.98, pairs[i - 1].t + MIN_GAP)
          }
        }

        return pairs
      }

      // ===============================
      // ✅ POSICIONAR DECOS “FUERA DE CARDS”
      // ===============================
      const positionDecos = () => {
        const svgRect = svg.getBoundingClientRect()
        const sectionRect = section.getBoundingClientRect()

        // si el svg aun no tiene layout válido, salimos
        if (svgRect.width < 2 || svgRect.height < 2 || sectionRect.width < 2) return

        DECOS.forEach((d, idx) => {
          const el = decoRefs.current[idx]
          if (!el) return

          const p = path.getPointAtLength(gsap.utils.clamp(0, 1, d.t) * length)
          const { clientX, clientY } = svgPointToClient(p.x, p.y)
          const { x, y } = clientToSection(clientX, clientY)

          const ox = d.offsetX ?? 0
          const oy = d.offsetY ?? 0
          const rot = d.rotate ?? 0
          const sc = d.scale ?? 1
          const op = d.opacity ?? 1

          gsap.set(el, {
            left: x + ox,
            top: y + oy,
            xPercent: -50,
            yPercent: -50,
            rotation: rot,
            scale: sc,
            opacity: op,
          })
        })
      }

      // ===============================
      // SCHEDULE
      // ===============================
      const scheduleCards = () => {
        tl.clear()
        tl.add(pathTween.play(0), 0)

        const pairs = buildLookup()
        pairs.forEach(({ el, t }) => {
          const appearAt = Math.min(0.98, t + 0.01)
          tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.1, ease: "none" }, appearAt)
        })
      }

      scheduleCards()
      positionDecos()

      const ro = new ResizeObserver(() => {
        scheduleCards()
        positionDecos()
        ScrollTrigger.refresh()
      })
      ro.observe(section)
      ro.observe(categoriesRef.current!)

      const onResize = () => {
        scheduleCards()
        positionDecos()
        ScrollTrigger.refresh()
      }
      window.addEventListener("resize", onResize)

      requestAnimationFrame(() => {
        positionDecos()
        ScrollTrigger.refresh()
      })

      return () => {
        window.removeEventListener("resize", onResize)
        ro.disconnect()
        gsap.ticker.remove(onTick)
        lenis.destroy()
      }
    }, sectionRef)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const CARD_BASE =
    "story-card relative max-w-2xl bg-white rounded-[28px] px-14 py-16 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden"

  const CARD_COMPACT =
    "story-card relative bg-white rounded-[24px] px-10 py-10 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden"

  // ✅ flotantes categorías (YA están fuera de cards)
  const CATEGORY_FLOATERS = [
    {
      src: "/illustrations/tomato.png",
      alt: "Tomate",
      w: 180,
      h: 180,
      className: "absolute -left-10 top-10 hidden lg:block opacity-95 rotate-[-12deg]",
      priority: true,
    },
    {
      src: "/illustrations/banana.png",
      alt: "Plátano",
      w: 190,
      h: 190,
      className: "absolute -right-10 top-16 hidden lg:block opacity-95 rotate-[10deg]",
    },
    {
      src: "/illustrations/carrot.png",
      alt: "Zanahoria",
      w: 170,
      h: 170,
      className: "absolute left-10 bottom-16 hidden lg:block opacity-95 rotate-[8deg]",
    },
    {
      src: "/illustrations/avocado.png",
      alt: "Palta",
      w: 180,
      h: 180,
      className: "absolute right-10 bottom-10 hidden lg:block opacity-95 rotate-[-8deg]",
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative px-6 pt-32 lg:px-12 bg-white rounded-t-[100px] -mt-[15vh] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
    >
      {/* SVG (detrás del contenido) */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[90%]">
        <svg viewBox="0 0 325 839" className="w-full h-auto block" preserveAspectRatio="xMidYMin meet">
          <path
            ref={pathRef}
            d="M168.104 31.865C168.104 31.865 76.854 -19.135 91.854 156.865C106.854 332.865 221.854 113.865 291.854 340.865C361.854 567.865 -44.3494 684.898 35.354 444.865C115.057 204.832 329.354 524.147 195.354 636.147C61.3541 748.147 152.854 814.147 152.854 814.147"
            stroke="var(--color-lime)"
            strokeWidth={40}
            strokeLinecap="round"
            fill="none"
            style={{ filter: "drop-shadow(0 10px 20px rgba(142,215,101,0.20))" }}
          />
        </svg>
      </div>

      {/* ✅ DECOS FUERA DE CARDS (encima del trazo, debajo de cards) */}
      <div className="pointer-events-none absolute inset-0 z-[12]">
        {DECOS.map((d, i) => (
          <div
            key={i}
            ref={(el) => {
              decoRefs.current[i] = el
            }}
            className={`absolute ${d.className ?? ""}`}
            style={{ willChange: "transform,left,top", filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.14))" }}
            aria-hidden="true"
          >
            <Image src={d.src} alt={d.alt} width={d.w} height={d.h} priority={d.priority} className="select-none" />
          </div>
        ))}
      </div>

      {/* CONTENIDO (cards encima) */}
      <div ref={servicesFlowRef} className="relative z-20 flex flex-col gap-56 max-w-7xl mx-auto pb-24">
        <div className="story-card mx-auto max-w-3xl bg-white rounded-[28px] px-14 py-16 text-center border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="pointer-events-none absolute -left-10 -top-12 hidden lg:block opacity-70">
            <Image
              src="/illustrations/spark.png"
              alt="Decoración"
              width={220}
              height={220}
              priority
              className="drop-shadow-[0_18px_30px_rgba(0,0,0,0.10)]"
            />
          </div>

          <h2 className="text-[52px] font-extrabold tracking-tight mb-6">Nuestros Servicios</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Abastecimiento inteligente guiado por la frescura.</p>
        </div>

        {[
          ["Servicios institucionales", "Atención a instituciones, comedores y programas con abastecimiento planificado y cumplimiento.", "Ver servicios", "mr-auto"],
          ["Servicios de calidad", "Control de selección, trazabilidad y estándares consistentes para operaciones exigentes.", "Conocer proceso", "ml-auto"],
          ["Productos de la mejor calidad", "Selección premium con frescura garantizada y manejo cuidadoso desde origen.", "Explorar calidad", "mr-auto"],
          ["Soluciones sostenibles", "Optimización logística y empaques responsables para reducir desperdicio y mejorar eficiencia.", "Ver impacto", "ml-auto"],
        ].map(([title, desc, cta, align], i) => (
          <div key={`svc-${i}`} className={`${CARD_BASE} ${align}`}>
            <div
              className="pointer-events-none absolute -right-24 -bottom-24 w-80 h-80 rounded-full opacity-[0.10]"
              style={{
                background: "radial-gradient(circle, rgba(142,215,101,0.85) 0%, rgba(142,215,101,0) 65%)",
              }}
            />
            <div className="relative z-10">
              <h3 className="text-[42px] leading-tight font-extrabold tracking-tight mb-6">{title}</h3>
              <p className="text-lg text-gray-600 max-w-xl mb-10">{desc}</p>
              <button className="inline-flex items-center gap-4 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center">→</span>
                {cta}
              </button>
            </div>
          </div>
        ))}

        <div className={`${CARD_BASE} mr-auto`}>
          <div className="relative z-10">
            <h3 className="text-[42px] leading-tight font-extrabold tracking-tight mb-6">Verduras de Tallo</h3>
            <p className="text-lg text-gray-600 max-w-xl mb-10">
              Cebolla china y Cilantro seleccionado directamente de campos certificados.
            </p>
            <button className="inline-flex items-center gap-4 bg-[#ff6b5c] text-black font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center">→</span>
              Ver catálogo
            </button>
          </div>
        </div>

        <div className="w-full mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className={CARD_COMPACT}>
              <h3 className="text-[32px] leading-tight font-extrabold tracking-tight mb-4">Soluciones B2B</h3>
              <p className="text-base text-gray-600 mb-7">Logística Horeca + facturación inmediata.</p>
              <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
                <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">→</span>
                Área negocios
              </button>
            </div>

            <div className={CARD_COMPACT}>
              <h3 className="text-[32px] leading-tight font-extrabold tracking-tight mb-4">Máxima Calidad</h3>
              <p className="text-base text-gray-600 mb-7">Selección manual para estándar premium.</p>
              <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
                <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">→</span>
                Calidad total
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PASTO / CATEGORÍAS */}
      <div ref={categoriesRef} className="relative z-20">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <div className="relative mt-40 -mt-1 rounded-[90px] overflow-hidden">
            <div className="absolute inset-0 bg-[var(--color-lime)] z-0" />
            <div
              className="absolute inset-0 opacity-[0.12] z-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 45%), radial-gradient(circle at 85% 30%, rgba(255,255,255,0.28) 0, rgba(255,255,255,0) 44%), radial-gradient(circle at 50% 95%, rgba(0,0,0,0.08) 0, rgba(0,0,0,0) 55%)",
              }}
            />

            <div className="relative z-20 px-6 lg:px-12 pt-14 pb-20">
              <div className="max-w-7xl mx-auto relative">
                {/* flotantes decorativos fuera de cards */}
                <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
                  {CATEGORY_FLOATERS.map((it, idx) => (
                    <div key={idx} className={it.className}>
                      <Image
                        src={it.src}
                        alt={it.alt}
                        width={it.w}
                        height={it.h}
                        priority={it.priority}
                        className="select-none drop-shadow-[0_18px_30px_rgba(0,0,0,0.14)]"
                      />
                    </div>
                  ))}
                </div>

                <div className="story-card mb-8 relative z-20">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/85 text-black font-bold text-sm shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
                      Verduras
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/85 text-black font-bold text-sm shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
                      Frutas
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/85 text-black font-bold text-sm shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
                      IGV
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/85 text-black font-bold text-sm shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
                      Otros
                    </span>
                  </div>

                  <h2 className="text-[44px] lg:text-[54px] font-black italic uppercase tracking-tight leading-none text-black">
                    Catálogo <br /> por Categorías
                  </h2>
                  <p className="mt-5 text-black/70 max-w-2xl text-base lg:text-lg">
                    Accede a categorías clave para cocina industrial y compras por volumen.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-20">
                  {[
                    ["Verduras", "Frescura diaria, selección de campo y trazabilidad por lote.", "Ver verduras", "/illustrations/veg-basket.png"],
                    ["Frutas", "Variedades estacionales, maduración controlada y calibres.", "Ver frutas", "/illustrations/fruits.png"],
                    ["IGV", "Productos y complementos con gestión tributaria y facturación.", "Ver IGV", "/illustrations/tax.png"],
                    ["Otros", "Complementos: insumos, empaques y utilitarios.", "Ver otros", "/illustrations/box2.png"],
                  ].map(([t, d, cta, img], i) => (
                    <div
                      key={i}
                      className="story-card relative rounded-[26px] bg-white/92 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-9 overflow-hidden"
                    >
                      <div className="absolute -right-6 -bottom-8 opacity-90 hidden lg:block pointer-events-none" aria-hidden="true">
                        <Image src={img} alt={`${t}`} width={190} height={190} />
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-[30px] font-extrabold tracking-tight mb-3 text-black">{t}</h3>
                        <p className="text-sm lg:text-base text-gray-700 mb-6">{d}</p>
                        <button className="inline-flex items-center gap-3 bg-[#ff6b5c] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
                          <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">→</span>
                          {cta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 story-card text-center relative z-20 overflow-hidden">
                  <div className="pointer-events-none absolute -left-10 -bottom-10 hidden lg:block opacity-90" aria-hidden="true">
                    <Image src="/illustrations/lock.png" alt="Acceso" width={200} height={200} />
                  </div>

                  <h3 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tight text-black">
                    Solicitar Acceso
                  </h3>
                  <p className="mt-3 text-black/70 max-w-2xl mx-auto text-base lg:text-lg">
                    Acceso a precios, disponibilidad y compras por volumen.
                  </p>

                  <button className="mt-7 inline-flex items-center gap-4 bg-white text-black font-bold px-12 py-5 rounded-xl hover:scale-105 transition-transform shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
                    <span className="w-9 h-9 bg-[var(--color-lime)] rounded-full flex items-center justify-center">→</span>
                    Solicitar acceso
                  </button>
                </div>
              </div>
            </div>

            <div className="h-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
