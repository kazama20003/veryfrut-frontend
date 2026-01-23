"use client"

import { useEffect, useMemo, useState } from "react"
import { ShoppingBag, RefreshCw } from "lucide-react"
import { usersService, useOrdersByCustomerQuery } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Order, OrderItem } from "@/types/order"

function formatDate(dateValue?: string) {
  if (!dateValue) return "Sin fecha"
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return "Sin fecha"
  return parsed.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getItemLabel(item: OrderItem) {
  const unitName = item.unitMeasurement?.name ?? "Unidad"
  return `${item.quantity} ${unitName}`
}

export default function UsersHistoryPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsUserLoading(true)
    setUserError(null)

    usersService
      .getMe()
      .then((user) => {
        if (!isMounted) return
        setUserId(user?.id ?? null)
        if (!user?.id) {
          setUserError("Necesitas iniciar sesion para ver tu historial.")
        }
      })
      .catch(() => {
        if (!isMounted) return
        setUserError("No se pudo cargar el usuario autenticado.")
      })
      .finally(() => {
        if (!isMounted) return
        setIsUserLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch,
  } = useOrdersByCustomerQuery(userId, { page: 1, limit: 100, sortBy: "createdAt", order: "desc" })

  const orders = useMemo(() => ordersResponse?.items ?? [], [ordersResponse?.items])
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Historial</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de pedidos</h1>
              <p className="text-sm text-gray-500">Tus compras recientes y detalles completos.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Pedidos: {orders.length}</Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pedidos totales</CardTitle>
              <div className="rounded-full bg-green-100 p-2">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <p className="text-xs text-gray-500">Incluye todos los pedidos realizados</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Ultimo pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {orders[0]?.id ? `#${orders[0].id}` : "Sin datos"}
              </div>
              <p className="text-xs text-gray-500">{formatDate(orders[0]?.createdAt)}</p>
            </CardContent>
          </Card>
        </div>

        {isUserLoading ? (
          <div className="text-sm text-gray-500">Cargando usuario...</div>
        ) : userError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{userError}</CardContent>
          </Card>
        ) : ordersError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              Ocurrio un error al cargar tu historial.
            </CardContent>
          </Card>
        ) : isOrdersLoading ? (
          <div className="text-sm text-gray-500">Cargando historial...</div>
        ) : orders.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center text-gray-600">
              Aun no tienes pedidos registrados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <Card key={order.id} className="border border-gray-200 shadow-sm">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-gray-900">Pedido #{order.id}</CardTitle>
                      <p className="text-xs text-gray-500">Creado: {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        {order.status || "pendiente"}
                      </Badge>
                    </div>
                  </div>
                  {order.area?.name && (
                    <p className="text-sm text-gray-600">Area: {order.area.name}</p>
                  )}
                  {order.observation && (
                    <p className="text-sm text-gray-600">Nota: {order.observation}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    {(order.orderItems || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name || `Producto #${item.productId}`}
                          </p>
                          <p className="text-xs text-gray-500">{getItemLabel(item)}</p>
                        </div>
                      </div>
                    ))}
                    {(order.orderItems || []).length === 0 && (
                      <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
