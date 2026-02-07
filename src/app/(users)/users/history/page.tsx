"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, RefreshCw, Printer, Loader2, Download } from "lucide-react"
import { useMeQuery, useOrdersByCustomerQuery, useProductsQuery } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Order, OrderItem } from "@/types/order"
import { toast } from "sonner"

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

// Memoize today's date to avoid hydration issues
const getTodayString = (() => {
  let cached: string | null = null
  return () => {
    if (!cached) {
      cached = new Date().toDateString()
    }
    return cached
  }
})()

function isToday(dateValue?: string) {
  if (!dateValue) return false
  const orderDate = new Date(dateValue)
  if (Number.isNaN(orderDate.getTime())) return false
  return orderDate.toDateString() === getTodayString()
}

function formatQuantity(value: number) {
  if (!Number.isFinite(value)) return "0"
  if (value % 1 === 0) return value.toFixed(0)
  return value.toFixed(3).replace(/\.?0+$/, "")
}

function getItemLabel(item: OrderItem) {
  const unitName = item.unitMeasurement?.name ?? "Unidad"
  return `${formatQuantity(item.quantity)} ${unitName}`
}

export default function UsersHistoryPage() {
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useMeQuery()
  const userId = currentUser?.id ?? null
  const showLoadingUser = !isHydrated || isUserLoading

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch,
  } = useOrdersByCustomerQuery(userId, { page: 1, limit: 100, sortBy: "createdAt", order: "desc" })
  const { data: productsResponse } = useProductsQuery({ page: 1, limit: 500, order: "asc", sortBy: "name" })

  const orders = useMemo(() => ordersResponse?.items ?? [], [ordersResponse?.items])
  const productNameById = useMemo(() => {
    const map = new Map<number, string>()
    const items = productsResponse?.items ?? []
    for (const product of items) {
      map.set(product.id, product.name)
    }
    return map
  }, [productsResponse?.items])
  const productImageById = useMemo(() => {
    const map = new Map<number, string>()
    const items = productsResponse?.items ?? []
    for (const product of items) {
      if (product.imageUrl) {
        map.set(product.id, product.imageUrl)
      }
    }
    return map
  }, [productsResponse?.items])

  const handlePrintOrder = useCallback(async (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No hay productos para imprimir en este pedido")
      return
    }

    try {
      setPrintingOrderId(order.id)

      const payload = {
        areaName: order.area?.name || `Area #${order.areaId}`,
        observation: order.observation || "",
        items: order.orderItems.map((item) => ({
          productName:
            item.product?.name ||
            productNameById.get(item.productId) ||
            `Producto #${item.productId}`,
          quantity: item.quantity,
          unitName: item.unitMeasurement?.name || "Unidad",
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar la impresion")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, "_blank", "noopener,noreferrer")

      if (!win) {
        const link = document.createElement("a")
        link.href = url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.click()
      }

      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success("Impresion lista")
    } catch (error) {
      console.error("[UsersHistoryPage] Error printing order:", error)
      toast.error("Error al generar impresion")
    } finally {
      setPrintingOrderId(null)
    }
  }, [productNameById])

  const handleDownloadOrder = useCallback(async (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No hay productos para descargar en este pedido")
      return
    }

    try {
      setDownloadingOrderId(order.id)

      const payload = {
        areaName: order.area?.name || `Area #${order.areaId}`,
        observation: order.observation || "",
        items: order.orderItems.map((item) => ({
          productName:
            item.product?.name ||
            productNameById.get(item.productId) ||
            `Producto #${item.productId}`,
          quantity: item.quantity,
          unitName: item.unitMeasurement?.name || "Unidad",
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar el PDF")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-${order.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success("Descarga lista")
    } catch (error) {
      console.error("[UsersHistoryPage] Error downloading order:", error)
      toast.error("Error al descargar PDF")
    } finally {
      setDownloadingOrderId(null)
    }
  }, [productNameById])

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

        {showLoadingUser ? (
          <div className="text-sm text-gray-500">Cargando usuario...</div>
        ) : !userId ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              Necesitas iniciar sesion para ver tu historial.
            </CardContent>
          </Card>
        ) : userError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              No se pudo cargar el usuario autenticado.
            </CardContent>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  <p className="text-sm text-gray-600">
                    Area: {order.area?.name || `Area #${order.areaId}`}
                  </p>
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
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white">
                            <Image
                              src={
                                item.product?.imageUrl ||
                                productImageById.get(item.productId) ||
                                "/placeholder.svg"
                              }
                              alt={item.product?.name || `Producto ${item.productId}`}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name ||
                              productNameById.get(item.productId) ||
                              `Producto #${item.productId}`}
                          </p>
                          <p className="text-xs text-gray-500">Cantidad: {getItemLabel(item)}</p>
                        </div>
                      </div>
                    ))}
                    {(order.orderItems || []).length === 0 && (
                      <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() => void handlePrintOrder(order)}
                      disabled={printingOrderId === order.id}
                      aria-label="Imprimir pedido"
                      title="Imprimir pedido"
                    >
                      {printingOrderId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() => void handleDownloadOrder(order)}
                      disabled={downloadingOrderId === order.id}
                      aria-label="Descargar pedido"
                      title="Descargar pedido"
                    >
                      {downloadingOrderId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  {isToday(order.createdAt) && (
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                        <Link href={`/users/history/${order.id}`} className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modificar pedido
                        </Link>
                      </Button>
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
