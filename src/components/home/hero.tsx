"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ChevronDown, Building2, Truck, Award, Clock } from "lucide-react"

interface SlideInfo {
  id: number
  title: string
  heading: string
  description: string
  feature: string
  image: string
  bgImage: string
  color: "green" | "orange" | "purple"
  icon: React.ReactNode
}

const slides: SlideInfo[] = [
  {
    id: 1,
    title: "DISTRIBUCIÓN MAYORISTA",
    heading: "Calidad Premium",
    description:
      "Somos especialistas en distribución de frutas y verduras orgánicas para empresas, restaurantes, hoteles y supermercados.",
    feature: "Entregas programadas y puntuales para su negocio",
    image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    bgImage: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    color: "green",
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    id: 2,
    title: "SERVICIO EMPRESARIAL",
    heading: "Productos Frescos",
    description: "Ofrecemos un servicio integral de abastecimiento para empresas del sector HORECA y retail.",
    feature: "Logística especializada y control de calidad garantizado",
    image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    bgImage: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    color: "orange",
    icon: <Truck className="h-6 w-6" />,
  },
  {
    id: 3,
    title: "COMPROMISO CORPORATIVO",
    heading: "Soluciones a Medida",
    description: "Adaptamos nuestros servicios a las necesidades específicas de cada cliente empresarial.",
    feature: "Asesoramiento personalizado y atención exclusiva",
    image: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    bgImage: "https://res.cloudinary.com/demzflxgq/image/upload/v1744843955/portada_toy2aq.jpg",
    color: "purple",
    icon: <Award className="h-6 w-6" />,
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState(0)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const nextSlide = useCallback(() => {
    setSlideDirection(1)
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [])

  const prevSlide = useCallback(() => {
    setSlideDirection(-1)
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [])

  useEffect(() => {
    // Limpiar el intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Establecer un nuevo intervalo
    intervalRef.current = setInterval(() => {
      nextSlide()
    }, 6000)

    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [nextSlide])

  const getColorClass = useCallback((color: SlideInfo["color"]) => {
    switch (color) {
      case "orange":
        return "text-orange-600"
      case "purple":
        return "text-purple-600"
      default:
        return "text-green-600"
    }
  }, [])

  const getBgColorClass = useCallback((color: SlideInfo["color"]) => {
    switch (color) {
      case "orange":
        return "bg-orange-600"
      case "purple":
        return "bg-purple-600"
      default:
        return "bg-green-600"
    }
  }, [])

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  return (
    <div
      className="relative h-[calc(100vh-104px)] sm:h-[calc(100vh-120px)] min-h-[600px] overflow-hidden mt-0"
      ref={constraintsRef}
    >
      {/* Background Images con transición mejorada */}
      <div className="absolute inset-0 bg-gray-900">
        {slides.map((slide, index) => (
          <motion.div
            key={`bg-${index}`}
            initial={false}
            animate={{
              opacity: currentSlide === index ? 1 : 0,
            }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1.0], // Curva de easing suave
              opacity: { duration: 1.2 },
            }}
            className="absolute inset-0"
            style={{ zIndex: currentSlide === index ? 1 : 0 }}
          >
            <Image
              src={slide.bgImage || "/placeholder.svg"}
              alt={`Fondo de ${slide.heading}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* Overlay con gradiente más suave y consistente */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/40 backdrop-filter backdrop-brightness-75"></div>
          </motion.div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Columna de texto con transición mejorada */}
            <div className="relative overflow-hidden">
              {slides.map((slide, index) => (
                <motion.div
                  key={`content-${index}`}
                  initial={false}
                  animate={{
                    opacity: currentSlide === index ? 1 : 0,
                    x: currentSlide === index ? 0 : slideDirection > 0 ? -20 : 20,
                    display: currentSlide === index ? "block" : "none",
                  }}
                  transition={{
                    opacity: { duration: 0.5, ease: "easeInOut" },
                    x: { duration: 0.5, ease: "easeOut" },
                    display: { delay: currentSlide === index ? 0 : 0.5 },
                  }}
                  className="absolute inset-0"
                  style={{ display: currentSlide === index ? "block" : "none" }}
                >
                  <div className="mb-6">
                    <span
                      className={`${getColorClass(slide.color)} text-xl font-bold inline-flex items-center gap-2 rounded-full px-6 py-2 bg-white/90 shadow-lg`}
                    >
                      {slide.icon}
                      {slide.title}
                    </span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-lg">{slide.heading}</h1>

                  <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg mb-8 max-w-xl">
                    <p className="text-xl text-white">{slide.description}</p>
                  </div>

                  <div
                    className={`${getBgColorClass(slide.color)} text-white inline-flex items-center gap-2 px-8 py-4 rounded-md mb-10 shadow-lg`}
                  >
                    <Clock className="h-5 w-5" />
                    <span className="font-bold">{slide.feature}</span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button
                      className={`${getBgColorClass(slide.color)} hover:bg-opacity-90 text-white px-8 py-6 text-xl shadow-xl rounded-md transition-transform hover:scale-105`}
                      onClick={() => (window.location.href = "/contacto")}
                    >
                      Solicitar Información
                    </Button>

                    <Button
                      variant="outline"
                      className="bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30 px-8 py-6 text-xl shadow-xl rounded-md"
                      onClick={() => (window.location.href = "/servicios")}
                    >
                      Nuestros Servicios
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Columna de imagen con transición mejorada */}
            <div className="hidden md:block relative h-[350px]">
              {slides.map((slide, index) => (
                <motion.div
                  key={`image-${index}`}
                  initial={false}
                  animate={{
                    opacity: currentSlide === index ? 1 : 0,
                    y: currentSlide === index ? 0 : 30,
                    scale: currentSlide === index ? 1 : 0.95,
                    display: currentSlide === index ? "block" : "none",
                  }}
                  transition={{
                    opacity: { duration: 0.7, ease: "easeInOut" },
                    y: { duration: 0.7, ease: "easeOut" },
                    scale: { duration: 0.7, ease: "easeOut" },
                    display: { delay: currentSlide === index ? 0 : 0.7 },
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ display: currentSlide === index ? "flex" : "none" }}
                >
                  {/* Contenedor de imagen mejorado */}
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl w-[500px] h-[350px]">
                    <Image
                      src={slide.image || "/placeholder.svg"}
                      alt={`${slide.heading} - Veryfrut`}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover"
                      loading="lazy"
                    />
                    {/* Overlay con gradiente más suave */}
                    <div className={`absolute inset-0 ${getBgColorClass(slide.color)}/5 mix-blend-multiply`}></div>

                    {/* Borde decorativo */}
                    <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none"></div>

                    {/* Etiqueta decorativa */}
                    <div
                      className={`absolute top-4 right-4 ${getBgColorClass(slide.color)} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                    >
                      Empresarial
                    </div>
                  </div>

                  {/* Elementos decorativos con opacidad reducida */}
                  <div
                    className={`absolute -bottom-6 -right-6 w-24 h-24 ${getBgColorClass(slide.color)}/40 rounded-full blur-xl`}
                  ></div>
                  <div
                    className={`absolute -top-6 -left-6 w-16 h-16 ${getBgColorClass(slide.color)}/30 rounded-full blur-xl`}
                  ></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controles del carrusel */}
      <div className="absolute bottom-28 left-0 right-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-3">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => {
                  setSlideDirection(index > currentSlide ? 1 : -1)
                  setCurrentSlide(index)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? `${getBgColorClass(slides[currentSlide].color)} w-10` : "bg-white/50"
                }`}
                aria-label={`Ir a la diapositiva ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer z-30"
        onClick={scrollToContent}
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-white text-sm mb-2 font-medium">Descubre más</span>
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-2">
            <ChevronDown className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-20">
        <button
          onClick={prevSlide}
          className="bg-white/50 hover:bg-white/70 rounded-full p-3 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          aria-label="Anterior"
        >
          <ChevronLeft className={`h-6 w-6 ${getColorClass(slides[currentSlide].color)}`} />
        </button>
        <button
          onClick={nextSlide}
          className="bg-white/50 hover:bg-white/70 rounded-full p-3 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          aria-label="Siguiente"
        >
          <ChevronRight className={`h-6 w-6 ${getColorClass(slides[currentSlide].color)}`} />
        </button>
      </div>

      {/* Swipe Indicator - solo en móvil */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full md:hidden z-30">
        Desliza para ver más
      </div>
    </div>
  )
}
