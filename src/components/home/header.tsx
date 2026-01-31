  "use client"
  import type React from "react"
  import { useState } from "react"
  import { ChevronDown, X } from "lucide-react"
import Link from "next/link"

  interface NavItem {
    label: string
    href: string
    hasDropdown?: boolean
  }

  const NAV_ITEMS: NavItem[] = [
    { label: "Servicios", href: "/services" },
    { label: "Nosotros", href: "#", hasDropdown: true },
    { label: "Industry Sectors", href: "#", hasDropdown: true },
    { label: "Contactanos", href: "#" },
  ]

  const LogoIcon: React.FC = () => (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path
        d="M10 28C10 28 8 22 12 18C16 14 22 22 22 22C22 22 26 14 30 18C34 22 32 28 32 28"
        stroke="#8CC63F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 18C16 18 14 12 18 8C22 4 28 12 28 12"
        stroke="#8CC63F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <circle cx="10" cy="28" r="3" fill="#8CC63F" />
    </svg>
  )

  const QuoteCharacter: React.FC = () => (
    <div className="w-9 h-9 rounded-full bg-[#1A96FF] relative overflow-hidden flex-shrink-0">
      {/* Visor/Glasses */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[85%] h-[10px] bg-[#1A1A1A] rounded-sm z-10 overflow-hidden flex">
        <div className="w-1/2 border-r border-white/5"></div>
        <div className="w-1/2"></div>
      </div>
      {/* Mouth */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[20px] h-[12px] bg-[#1A1A1A] rounded-b-full overflow-hidden">
        {/* Teeth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[14px] h-[3px] bg-white rounded-b-[1px]"></div>
        {/* Tongue */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[12px] h-[5px] bg-[#FF5C5C] rounded-t-full"></div>
      </div>
    </div>
  )

  const MenuIcon: React.FC = () => (
    <div className="flex flex-col gap-[3.5px] items-center">
      <div className="w-4.5 h-[2px] bg-[#1A1A1A] rounded-full"></div>
      <div className="w-4.5 h-[2px] bg-[#1A1A1A] rounded-full"></div>
    </div>
  )

  const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
      <nav className="fixed top-3 left-0 right-0 z-50 flex justify-center mx-auto px-3 sm:px-4 md:px-6 lg:px-40 h-auto">
        <div className="flex w-full max-w-[1300px] gap-2 sm:gap-3 items-stretch">
          {/* Main Bar */}
          <div className="relative flex-1 bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-3 sm:px-4 md:px-5 lg:px-6 py-2 flex justify-between min-h-[66px] mx-0 my-1.5 border-0 items-stretch flex-row font-normal tracking-normal">
            {/* Logo - pulled to left */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 cursor-pointer">
              <LogoIcon />
              <span className="text-[#1A1A1A] text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-5 font-normal whitespace-nowrap">
                Veryfrut
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-0 ml-auto pr-0">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[#1A1A1A] hover:text-[#8CC63F] transition-colors flex font-normal text-[18px] items-center gap-0 leading-7 tracking-normal whitespace-nowrap px-2.5"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown size={13} className="text-[#1A1A1A]/40 mt-0.5 ml-1" />}
                </a>
              ))}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full bg-[#8CC63F] flex items-center justify-center hover:bg-[#7db138] transition-all active:scale-95 cursor-pointer flex-shrink-0 w-10 sm:w-11 h-10 sm:h-11 border-0 ml-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={18} className="text-[#1A1A1A]" /> : <MenuIcon />}
            </button>
          </div>

          {/* Quote Button - hidden on mobile, shown on md screens */}
          <button className="hidden md:flex bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center gap-2 md:gap-3 min-h-[68px] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0 px-4 md:px-6 py-0 mr-0 ml-1 mt-1 mb-1 whitespace-nowrap">
            <span className="text-[#1A1A1A] text-base md:text-lg lg:text-[18px] font-normal tracking-normal leading-9">
              <Link href="/users">Pedir ya</Link>
            </span>
            <QuoteCharacter />
          </button>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[80px] px-3 sm:px-4 z-40 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="fixed inset-0 bg-black/5" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-full max-w-[400px] mx-auto bg-white rounded-[14px] p-4 sm:p-6 shadow-2xl border border-gray-100">
              <div className="flex flex-col gap-4 sm:gap-5">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-base sm:text-[17px] font-semibold text-[#1A1A1A] flex justify-between items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown size={18} className="text-gray-300" />}
                  </a>
                ))}
                <hr className="border-gray-50" />
                <button className="w-full bg-[#1A96FF] text-white rounded-[10px] py-2.5 sm:py-3.5 px-4 sm:px-6 font-bold flex items-center justify-between text-sm sm:text-base">
                  <span>Pedir ya</span>
                  <QuoteCharacter />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    )
  }

  export default Header
