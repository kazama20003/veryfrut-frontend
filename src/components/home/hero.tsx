"use client"

import React, { useEffect, useState } from "react"
import Lottie from "lottie-react"

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
          gap-6
        "
      >
        {/* H1 */}
        <h1
          className="
            w-full
            max-w-5xl
            font-semibold
            leading-[1.2]
            text-[clamp(3.2rem,9vw,5.8rem)]
            tracking-[-0.02em]
            md:tracking-[-0.04em]
            text-[var(--color-primary-text)]
          "
        >
          Veryfrut
        </h1>

        {/* H2 */}
        <h2
          className="
              w-full
              max-w-6xl
              font-semibold
              leading-[1.15]
              text-[clamp(3.8rem,10vw,6.6rem)]
              tracking-[-0.04em]
              text-[#000000]
              will-change-transform
            "

        >
          Distribución sostenible de frutas y verduras frescas
        </h2>
      </div>
    </section>
  )
}

export default Hero
  