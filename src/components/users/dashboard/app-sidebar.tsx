"use client"

import * as React from "react"
import {
  BarChart3,
  ShoppingCart,
  User,
  Calendar,
  MoreHorizontal,
  LifeBuoy,
} from "lucide-react"

import { NavUser } from "./nav-user"
import { NavSecondary } from "./nav-secondary"
import { NavMain } from "./nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  user: {
    name: "kazama c",
    email: "kazama@veryfrut.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Productos",
      url: "#",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Pedidos - Rápido",
      url: "#",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Pedidos - Historial",
      url: "#",
      icon: ShoppingCart,
      isActive: false,
    },
    {
      title: "Perfil",
      url: "#",
      icon: User,
      isActive: false,
    },
  ],
  navPages: [
    {
      title: "Veryfrut",
      url: "#",
      icon: Calendar,
    },
    {
      title: "More",
      url: "#",
      icon: MoreHorizontal,
    },
  ],
  navSecondary: [
    {
      title: "Soporte",
      url: "#",
      icon: LifeBuoy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <img 
                  src="/veryfrut-logo.png" 
                  alt="Veryfrut" 
                  className="size-8 rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Veryfrut</span>
                  <span className="truncate text-xs text-muted-foreground">Orgánico & Fresco</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavMain items={data.navPages} label="Paginas" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
