"use client"
import * as React from "react"
import {
  GalleryVerticalEnd,
  Home,
  Users,
  ShoppingCart,
  Package,
  Globe,
  LifeBuoy,
} from "lucide-react"

import { NavMain } from '@/components/dashboard/sidebar/nav-main'
import { NavProjects } from '@/components/dashboard/sidebar/nav-projects'
import { NavUser } from '@/components/dashboard/sidebar/nav-user'
import { TeamSwitcher } from '@/components/dashboard/sidebar/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

// This is sample data.
const data = {
  user: {
    name: "Veryfrut",
    email: "admin@veryfrut.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Veryfrut",
      logo: GalleryVerticalEnd,
      plan: "Panel de administración",
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Inicio",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Usuarios",
      url: "/dashboard/users",
      icon: Users,
      items: [
        {
          title: "Clientes",
          url: "/dashboard/users",
        },
      ],
    },
    {
      title: "Órdenes",
      url: "/dashboard/orders",
      icon: ShoppingCart,
      items: [
        {
          title: "Pedidos",
          url: "/dashboard/orders",
        },
      ],
    },
    {
      title: "Productos",
      url: "/dashboard/products",
      icon: Package,
      items: [
        {
          title: "General",
          url: "/dashboard/products",
        },
      ],
    },
    {
      title: "Empresas",
      url: "/dashboard/company",
      icon: Package,
      items: [
        {
          title: "Areas y empresas",
          url: "/dashboard/company",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Página Veryfrut",
      url: "/",
      icon: Globe,
    },
    {
      name: "Soporte",
      url: "/dashboard/support",
      icon: LifeBuoy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
