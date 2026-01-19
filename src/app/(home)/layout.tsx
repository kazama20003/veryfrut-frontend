"use client"

import Header from "@/components/home/header"
import Loading from "@/components/loading"
import type { ReactNode } from "react"
interface HomeLayoutProps {
  children: ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
   
    <>
    <Loading/>
    <Header/>
    {children}
    </>
  )
}