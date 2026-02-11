"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, RefreshCw, Printer, Loader2, Download, Trash2 } from "lucide-react"
import { useDeleteOrderMutation, useMeQuery, useOrdersByCustomerQuery, useProductsQuery } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Order, OrderItem } from "@/types/order"
import { toast } from "sonner"

const PERU_TIME_ZONE = "America/Lima"
const peruDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PERU_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const peruDateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: PERU_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

function getPeruDateKey(dateValue?: string) {
  if (!dateValue) return null

  // Backend often returns "YYYY-MM-DD HH:mm:ss" already in Peru local time.
  const peruLocalMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/)
  if (peruLocalMatch) {
    const [, year, month, day] = peruLocalMatch
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return peruDateKeyFormatter.format(parsed)
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Sin fecha"

  // Backend often returns "YYYY-MM-DD HH:mm:ss" already in Peru local time.
  const peruLocalMatch = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (peruLocalMatch) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = peruLocalMatch
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return "Sin fecha"
  return peruDateTimeFormatter.format(parsed)
}

function isToday(dateValue?: string) {
  const orderDateKey = getPeruDateKey(dateValue)
  if (!orderDateKey) return false
  const todayKey = peruDateKeyFormatter.format(new Date())
  return orderDateKey === todayKey
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export default function UsersHistoryPage() {
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null)
  const [isClearingOrders, setIsClearingOrders] = useState(false)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useMeQuery()
  const deleteOrderMutation = useDeleteOrderMutation()
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

  const buildOrderHtml = useCallback((order: Order) => {
    const areaName = order.area?.name || `Area #${order.areaId}`
    const createdAt = formatDate(order.createdAt)
    const observation = order.observation?.trim() || "-"
    const rows = (order.orderItems || [])
      .map((item, idx) => {
        const productName =
          item.product?.name ||
          productNameById.get(item.productId) ||
          `Producto #${item.productId}`
        const quantity = formatQuantity(item.quantity)
        const unitName = item.unitMeasurement?.name || "Unidad"
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(productName)}</td>
            <td style="text-align:right">${escapeHtml(quantity)}</td>
            <td>${escapeHtml(unitName)}</td>
          </tr>
        `
      })
      .join("")

    return `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pedido #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 8px 0; font-size: 20px; }
          p { margin: 4px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; }
          .obs { margin-top: 12px; padding: 10px; background: #fffbeb; border: 1px solid #fde68a; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Pedido #${order.id}</h1>
        <p><strong>Fecha:</strong> ${escapeHtml(createdAt)}</p>
        <p><strong>Area:</strong> ${escapeHtml(areaName)}</p>
        <p><strong>Estado:</strong> ${escapeHtml(order.status || "pendiente")}</p>
        <div class="obs"><strong>Observacion:</strong> ${escapeHtml(observation)}</div>
        <table>
          <thead>
            <tr>
              <th style="width:56px">#</th>
              <th>Producto</th>
              <th style="width:96px; text-align:right">Cantidad</th>
              <th style="width:120px">Unidad</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `
  }, [productNameById])

  const handlePrintOrder = useCallback(async (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No hay productos para imprimir en este pedido")
      return
    }

    try {
      setPrintingOrderId(order.id)
      const html = buildOrderHtml(order)
      const printWindow = window.open("", "_blank", "noopener,noreferrer")
      if (!printWindow) {
        throw new Error("No se pudo abrir la ventana de impresion")
      }

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      toast.success("Impresion lista")
    } catch (error) {
      console.error("[UsersHistoryPage] Error printing order:", error)
      toast.error("Error al generar impresion")
    } finally {
      setPrintingOrderId(null)
    }
  }, [buildOrderHtml])

  const handleDownloadOrder = useCallback(async (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No hay productos para descargar en este pedido")
      return
    }

    try {
      setDownloadingOrderId(order.id)
      const payload = {
        areaName: order.area?.name || `Area #${order.areaId}`,
        observation: order.observation?.trim() || "",
        items: (order.orderItems || []).map((item) => ({
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
        let backendMessage = "No se pudo generar PDF"
        try {
          const errorBody = await response.json()
          if (typeof errorBody?.message === "string" && errorBody.message.trim()) {
            backendMessage = errorBody.message
          }
        } catch {
          // ignore json parse errors
        }
        throw new Error(backendMessage)
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
      const message = error instanceof Error ? error.message : "Error al descargar PDF"
      toast.error(message)
    } finally {
      setDownloadingOrderId(null)
    }
  }, [productNameById])

  const handleDeleteOrder = useCallback(async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido #${order.id}?`)) return

    try {
      setDeletingOrderId(order.id)
      await deleteOrderMutation.mutateAsync(order.id)
      await refetch()
      toast.success("Pedido eliminado")
    } catch (error) {
      console.error("[UsersHistoryPage] Error deleting order:", error)
      toast.error("No se pudo eliminar el pedido")
    } finally {
      setDeletingOrderId(null)
    }
  }, [deleteOrderMutation, refetch])

  const handleClearAllOrders = useCallback(async () => {
    if (orders.length === 0) {
      toast.error("No hay pedidos para vaciar")
      return
    }

    if (!window.confirm(`¿Vaciar ${orders.length} pedido(s)? Esta accion no se puede deshacer.`)) return

    try {
      setIsClearingOrders(true)
      for (const order of orders) {
        await deleteOrderMutation.mutateAsync(order.id)
      }
      await refetch()
      toast.success("Pedidos eliminados")
    } catch (error) {
      console.error("[UsersHistoryPage] Error clearing orders:", error)
      toast.error("No se pudieron vaciar todos los pedidos")
    } finally {
      setIsClearingOrders(false)
    }
  }, [deleteOrderMutation, orders, refetch])

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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-700 hover:text-red-800"
              onClick={() => void handleClearAllOrders()}
              disabled={isClearingOrders || orders.length === 0}
            >
              {isClearingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Vaciar pedidos
            </Button>
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
                      onClick={() => void handleDeleteOrder(order)}
                      disabled={deletingOrderId === order.id}
                      aria-label="Eliminar pedido"
                      title="Eliminar pedido"
                    >
                      {deletingOrderId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
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
