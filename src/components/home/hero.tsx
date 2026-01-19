"use client"

import React, { useEffect, useState } from "react"
import Lottie from "lottie-react"

const Hero = () => {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch("/lotties/hero.json")
      .then((res) => {
        if (!res.ok) throw new Error("Error loading Lottie JSON")
        return res.json()
      })
      .then((data: Record<string, unknown>) => setAnimationData(data))
      .catch(console.error)
  }, [])

  return (
    <section
      className="
        relative
        w-full
        /* 🔹 Más alto para que Services suba sobre él sin ver el fondo de la página */
        h-[120svh] 
        overflow-hidden
        bg-[var(--color-lime)]
      "
    >
      {/* 🔹 LOTTIE */}
      {animationData && (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
      )}

      {/* 🔹 CONTENIDO CENTRADO RESPECTO AL VIEWPORT */}
      <div
        className="
          relative
          z-10
          w-full
          h-[100svh] /* Se mantiene al alto de la pantalla para el texto */
          px-8
          flex
          items-center
          justify-center
        "
      >
        <h1 className="w-full md:w-[60%] text-center font-medium leading-[1.1] text-[2.5rem] md:text-[4rem] tracking-[-0.08rem] md:tracking-[-0.1rem]">
          Veryfrut
        </h1>
        <h2>
          Distribución sostenible de frutas y verduras frescas
        </h2>
      </div>
    </section>
  )
}

export default Hero