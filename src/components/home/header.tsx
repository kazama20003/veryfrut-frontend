"use client"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import { ChevronDown, X, ChevronRight } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"

interface DropdownItem {
  label: string
  href: string
}

interface NavItem {
  label: string
  href: string
  hasDropdown?: boolean
  dropdownTitle?: string
  dropdownImage?: string
  dropdownItems?: DropdownItem[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Servicios", href: "/services" },
  {
    label: "Nosotros",
    href: "#",
    hasDropdown: true,
    dropdownTitle: "Nosotros",
    dropdownImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=500&fit=crop",
    dropdownItems: [
      { label: "Quiénes Somos", href: "/quienes-somos" },
      { label: "Nuestra Historia", href: "/historia" },
      { label: "Misión y Visión", href: "/mision-vision" },
      { label: "Equipo", href: "/equipo" },
      { label: "Valores", href: "/valores" },
      { label: "Responsabilidad Social", href: "/responsabilidad" },
      { label: "Certificaciones", href: "/certificaciones" },
      { label: "Premios", href: "/premios" },
      { label: "Alianzas", href: "/alianzas" },
      { label: "Trabaja con Nosotros", href: "/trabaja" },
    ],
  },
  {
    label: "Industry Sectors",
    href: "#",
    hasDropdown: true,
    dropdownTitle: "Methodology",
    dropdownImage: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop",
    dropdownItems: [
      { label: "Online Bulletin Boards", href: "/online-bulletin" },
      { label: "Taste Testing", href: "/taste-testing" },
      { label: "Customer Intercept", href: "/customer-intercept" },
      { label: "Mystery Shopping", href: "/mystery-shopping" },
      { label: "UX Research", href: "/ux-research" },
      { label: "Ethnographic Research", href: "/ethnographic" },
      { label: "Focus Groups, Dyads & Triads", href: "/focus-groups" },
      { label: "Central Location Testing", href: "/central-location" },
      { label: "Online Diary", href: "/online-diary" },
      { label: "Shop-Along", href: "/shop-along" },
      { label: "In-depth Interviews", href: "/interviews" },
    ],
  },
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
    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[85%] h-[10px] bg-[#1A1A1A] rounded-sm z-10 overflow-hidden flex">
      <div className="w-1/2 border-r border-white/5"></div>
      <div className="w-1/2"></div>
    </div>
    <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[20px] h-[12px] bg-[#1A1A1A] rounded-b-full overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[14px] h-[3px] bg-white rounded-b-[1px]"></div>
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mainBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openDropdown && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      )
    }
  }, [openDropdown])

  const handleDropdownHover = (itemLabel: string | null) => {
    setOpenDropdown(itemLabel)
  }

  return (
    <div className="relative">
      <nav ref={navRef} className="fixed top-3 left-0 right-0 z-50 flex justify-center mx-auto px-3 sm:px-4 md:px-6 lg:px-40 h-auto">
        <div className="flex w-full max-w-[1300px] gap-2 sm:gap-3 items-stretch">
          {/* Main Bar */}
          <div ref={mainBarRef} className="relative flex-1 bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-3 sm:px-4 md:px-5 lg:px-6 py-2 flex justify-between min-h-[66px] mx-0 my-1.5 border-0 items-stretch flex-row font-normal tracking-normal">
            {/* Logo */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 cursor-pointer">
              <LogoIcon />
              <span className="text-[#1A1A1A] text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-5 font-normal whitespace-nowrap">
                Veryfrut
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0 ml-auto pr-0 relative">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  onMouseEnter={() => item.hasDropdown && handleDropdownHover(item.label)}
                  onMouseLeave={() => item.hasDropdown && handleDropdownHover(null)}
                  className="relative"
                >
                  <a
                    href={item.href}
                    className="text-[#1A1A1A] hover:text-[#8CC63F] transition-colors flex font-normal text-[18px] items-center gap-0 leading-7 tracking-normal whitespace-nowrap px-2.5"
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown size={13} className="text-[#1A1A1A]/40 mt-0.5 ml-1" />}
                  </a>
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full bg-[#8CC63F] flex items-center justify-center hover:bg-[#7db138] transition-all active:scale-95 cursor-pointer flex-shrink-0 w-10 sm:w-11 h-10 sm:h-11 border-0 ml-2 lg:hidden"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={18} className="text-[#1A1A1A]" /> : <MenuIcon />}
            </button>
          </div>

          {/* Quote Button */}
          <button className="hidden md:flex bg-white rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center gap-2 md:gap-3 min-h-[68px] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0 px-4 md:px-6 py-0 mr-0 ml-1 mt-1 mb-1 whitespace-nowrap">
            <span className="text-[#1A1A1A] text-base md:text-lg lg:text-[18px] font-normal tracking-normal leading-9">
              <Link href="/users">Pedir ya</Link>
            </span>
            <QuoteCharacter />
          </button>
        </div>
      </nav>

      {/* Mega Menu - Fixed position below navbar */}
      {openDropdown && (
        <div
          ref={dropdownRef}
          onMouseEnter={() => handleDropdownHover(openDropdown)}
          onMouseLeave={() => handleDropdownHover(null)}
          className="fixed top-[calc(12px+66px+12px)] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] lg:w-auto lg:max-w-[900px] bg-white rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-40 px-3 sm:px-4 md:px-6 lg:px-0"
        >
          {NAV_ITEMS.find((item) => item.label === openDropdown) && (
            <div className="flex p-6 gap-8">
              {/* Image Section */}
              <div className="relative w-80 h-80 flex-shrink-0 rounded-[10px] overflow-hidden">
                <img
                  src={
                    NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownImage || "/placeholder.svg"
                  }
                  alt={NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h3 className="text-xl font-medium text-white">
                    {NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownTitle}
                  </h3>
                  <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Menu Links */}
              <div className="flex-1 flex gap-16 py-4">
                <div className="space-y-4">
                  {(NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || [])
                    .slice(0, Math.ceil((NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || []).length / 2))
                    .map((dropdownItem) => (
                      <Link
                        key={dropdownItem.href}
                        href={dropdownItem.href}
                        className="block text-[#1A1A1A] hover:text-[#8CC63F] transition-colors text-base font-normal"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {dropdownItem.label}
                      </Link>
                    ))}
                </div>
                <div className="space-y-4">
                  {(NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || [])
                    .slice(Math.ceil((NAV_ITEMS.find((item) => item.label === openDropdown)?.dropdownItems || []).length / 2))
                    .map((dropdownItem) => (
                      <Link
                        key={dropdownItem.href}
                        href={dropdownItem.href}
                        className="block text-[#1A1A1A] hover:text-[#8CC63F] transition-colors text-base font-normal"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {dropdownItem.label}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] px-3 sm:px-4 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/5" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full max-w-[400px] mx-auto bg-white rounded-[14px] p-4 sm:p-6 shadow-2xl border border-gray-100">
            <div className="flex flex-col gap-4 sm:gap-5">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (item.hasDropdown) {
                        setOpenDropdown(openDropdown === item.label ? null : item.label)
                      } else {
                        setIsMobileMenuOpen(false)
                      }
                    }}
                    className="text-base sm:text-[17px] font-semibold text-[#1A1A1A] flex justify-between items-center w-full"
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown size={18} className="text-gray-300" />}
                  </button>
                  {item.hasDropdown && openDropdown === item.label && (
                    <div className="ml-4 mt-3 space-y-2 border-l-2 border-[#8CC63F] pl-4">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="block py-2 text-sm text-[#1A1A1A] hover:text-[#8CC63F] transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
    </div>
  )
}

export default Header
