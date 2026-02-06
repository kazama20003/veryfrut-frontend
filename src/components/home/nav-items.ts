export interface DropdownItem {
  label: string
  href: string
}

export interface NavItem {
  label: string
  href: string
  hasDropdown?: boolean
  dropdownTitle?: string
  dropdownImage?: string
  dropdownItems?: DropdownItem[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Servicios", href: "/services" },
  {
    label: "Nosotros",
    href: "#",
    hasDropdown: true,
    dropdownTitle: "Nosotros",
    dropdownImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=500&fit=crop",
    dropdownItems: [
      { label: "Quienes Somos", href: "/quienes-somos" },
      { label: "Nuestra Historia", href: "/historia" },
      { label: "Mision y Vision", href: "/mision-vision" },
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

export function getPublicNavRoutes(): string[] {
  const routes = new Set<string>()

  for (const item of NAV_ITEMS) {
    if (item.href && item.href !== "#" && item.href.startsWith("/")) {
      routes.add(item.href)
    }
    for (const dropdownItem of item.dropdownItems ?? []) {
      if (dropdownItem.href && dropdownItem.href.startsWith("/")) {
        routes.add(dropdownItem.href)
      }
    }
  }

  return Array.from(routes)
}
