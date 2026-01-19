"use client"

import type React from "react"
import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnimations(
  heroRef: React.RefObject<HTMLDivElement | null>,
  aboutRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!heroRef.current || !aboutRef.current) return

    // Kill all existing animations to prevent conflicts
    gsap.killTweensOf([heroRef.current, aboutRef.current])
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

    gsap.set(aboutRef.current, { y: window.innerHeight })

    const tl = gsap.timeline()

    tl.to(
      aboutRef.current,
      {
        y: 0, // Moves from bottom (100vh) to top (0), completely covering hero
        ease: "none",
      },
      0,
    )

    const heroContent = heroRef.current.querySelector(".hero-content")
    if (heroContent) {
      tl.to(
        heroContent,
        {
          scale: 0.8, // Content shrinks as About rises
          y: -100,
          opacity: 0.5,
          ease: "none",
          duration: 1,
        },
        0,
      )
    }

    ScrollTrigger.create({
      animation: tl,
      trigger: heroRef.current,
      start: "top top",
      end: "bottom center",
      scrub: true, // True = 1-to-1 sync with scroll, completely smooth
      invalidateOnRefresh: true,
      markers: false,
    })

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [heroRef, aboutRef])
}
