"use client"

import { useMemo, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import {
  useOrderQuery,
  useProductsQuery,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { OrderItem } from "@/types/order"

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

export default function OrderHistoryDetailPage() {
  const params = useParams()
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const orderId = useMemo(() => {
    const raw = params?.id
    const value = Array.isArray(raw) ? raw[0] : raw
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }, [params?.id])

  const { data: order, isLoading: isOrderLoading, error: orderError } = useOrderQuery(orderId)
  const { data: productsResponse } = useProductsQuery({ page: 1, limit: 500, order: "asc", sortBy: "name" })
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

  const canEdit = useMemo(() => {
    return isHydrated && isToday(order?.createdAt)
  }, [isHydrated, order?.createdAt])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Link href="/users/history">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Historial</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Pedido {order?.id ? `#${order.id}` : ""}
              </h1>
              <p className="text-sm text-gray-500">Detalles y edicion del pedido.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {isOrderLoading ? (
          <div className="text-sm text-gray-500">Cargando pedido...</div>
        ) : orderError || !order ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              No se pudo cargar el pedido solicitado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-gray-900">Pedido #{order.id}</CardTitle>
                    <p className="text-xs text-gray-500">Creado: {formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    {order.status || "pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Area: {order.area?.name || `Area #${order.areaId}`}
                </p>
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name ||
                              productNameById.get(item.productId) ||
                              `Producto #${item.productId}`}
                          </p>
                          <p className="text-xs text-gray-500">Cantidad: {getItemLabel(item)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(order.orderItems || []).length === 0 && (
                    <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Edicion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isHydrated ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : !order?.createdAt ? (
                  <p className="text-sm text-red-700">
                    No se puede determinar la fecha del pedido.
                  </p>
                ) : !canEdit ? (
                  <p className="text-sm text-red-700">
                    Solo se pueden editar pedidos del día actual.
                  </p>
                ) : (
                  <p className="text-sm text-green-700">
                    ✅ Este pedido puede ser editado.
                  </p>
                )}
                {canEdit ? (
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href={`/users/edit-order/${order.id}`} className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar pedido
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                      Edición no disponible
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
