"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { isToday } from "date-fns"
import { Calendar, Clock, Eye, Package, ShoppingBag, Truck, Building } from "lucide-react"

import { api } from "@/lib/axiosInstance"
import { getUserIdFromCookies } from "@/lib/cookies"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { OrderEditButton } from "@/components/users/history/order-edit-button"

// Enum para los estados de la orden
enum OrderStatus {
  CREATED = "created",
  PROCESS = "process",
  DELIVERED = "delivered",
}

// Interfaces para los tipos de datos
interface UnitMeasurement {
  id: number
  name: string
  description: string
}

interface ProductUnit {
  id: number
  productId: number
  unitMeasurementId: number
  unitMeasurement: UnitMeasurement
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  categoryId: number
  productUnits: ProductUnit[]
}

// Actualizar la interfaz OrderItem para incluir unitMeasurementId y unitMeasurement
interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  price: number
  unitMeasurementId: number
  unitMeasurement?: UnitMeasurement
  product?: Product
}

interface Area {
  id: number
  name: string
  companyId: number
}

interface Order {
  id: number
  userId: number
  areaId: number
  area?: Area
  totalAmount: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [productsCache, setProductsCache] = useState<Record<number, Product>>({})
  const [areasCache, setAreasCache] = useState<Record<number, Area>>({})

  // Función para obtener los detalles de un producto
  const fetchProductDetails = useCallback(
    async (productId: number) => {
      try {
        // Verificar si ya tenemos el producto en caché
        if (productsCache[productId]) {
          return productsCache[productId]
        }

        // Si no está en caché, obtenerlo de la API
        const response = await api.get(`/products/${productId}`)
        const product = response.data

        // Actualizar la caché
        setProductsCache((prev) => ({
          ...prev,
          [productId]: product,
        }))

        return product
      } catch (error) {
        console.error(`Error al obtener detalles del producto ${productId}:`, error)
        return null
      }
    },
    [productsCache],
  )

  // Función para obtener los detalles de un área
  const fetchAreaDetails = useCallback(
    async (areaId: number) => {
      try {
        // Verificar si ya tenemos el área en caché
        if (areasCache[areaId]) {
          return areasCache[areaId]
        }

        // Si no está en caché, obtenerla de la API
        const response = await api.get(`/areas/${areaId}`)
        const area = response.data

        // Actualizar la caché
        setAreasCache((prev) => ({
          ...prev,
          [areaId]: area,
        }))

        return area
      } catch (error) {
        console.error(`Error al obtener detalles del área ${areaId}:`, error)
        return null
      }
    },
    [areasCache],
  )

  // Función para enriquecer las órdenes con los detalles de los productos y áreas
  const enrichOrdersWithDetails = useCallback(
    async (ordersData: Order[]) => {
      const enrichedOrders = [...ordersData]

      // Para cada orden
      for (const order of enrichedOrders) {
        // Obtener detalles del área si no existe
        if (!order.area) {
          const areaDetails = await fetchAreaDetails(order.areaId)
          if (areaDetails) {
            order.area = areaDetails
          }
        }

        // Para cada item de la orden
        for (let i = 0; i < order.orderItems.length; i++) {
          const item = order.orderItems[i]
          // Obtener detalles del producto
          const productDetails = await fetchProductDetails(item.productId)
          if (productDetails) {
            order.orderItems[i] = {
              ...item,
              product: productDetails,
            }
          }
        }
      }

      return enrichedOrders
    },
    [fetchProductDetails, fetchAreaDetails],
  )

  // Función para cargar las órdenes del usuario
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // Obtener el ID del usuario
      const userId = getUserIdFromCookies()

      if (!userId) {
        setErrorMessage("No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.")
        toast.error("Error de autenticación", {
          description: "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
        })
        return
      }

      // Obtener las órdenes del usuario
      const response = await api.get(`/orders/customer/${userId}`)
      const ordersData = response.data

      // Enriquecer las órdenes con los detalles de los productos y áreas
      const enrichedOrders = await enrichOrdersWithDetails(ordersData)
      setOrders(enrichedOrders)
    } catch (err) {
      console.error("Error al obtener el historial de pedidos:", err)
      setErrorMessage("Error al cargar el historial de pedidos. Por favor, intenta nuevamente.")
      toast.error("Error al cargar pedidos", {
        description: "No se pudieron cargar tus pedidos. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [enrichOrdersWithDetails])

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchOrders()

    // Configurar un intervalo para actualizar las órdenes cada 30 segundos
    const intervalId = setInterval(() => {
      fetchOrders()
    }, 30000)

    // Limpiar el intervalo al desmontar
    return () => clearInterval(intervalId)
  }, [fetchOrders])

  // Función para obtener el color y texto del estado de la orden
  const getOrderStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED:
        return {
          color: "bg-blue-500",
          text: "Creado",
          icon: <Package className="h-4 w-4" />,
        }
      case OrderStatus.PROCESS:
        return {
          color: "bg-amber-500",
          text: "En proceso",
          icon: <Truck className="h-4 w-4" />,
        }
      case OrderStatus.DELIVERED:
        return {
          color: "bg-green-600",
          text: "Entregado",
          icon: <ShoppingBag className="h-4 w-4" />,
        }
      default:
        return {
          color: "bg-gray-500",
          text: "Desconocido",
          icon: <Package className="h-4 w-4" />,
        }
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return "Fecha desconocida"
    }
  }

  // Función para formatear la hora
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a", { locale: es })
    } catch {
      return ""
    }
  }

  // Función para ver detalles de un pedido
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  // Función para obtener el nombre del área
  const getAreaName = (order: Order) => {
    if (order.area?.name) {
      return order.area.name
    }
    return `Área #${order.areaId}`
  }

  // Actualizar la función getUnitName para usar directamente unitMeasurement del orderItem
  const getUnitName = (item: OrderItem) => {
    if (item.unitMeasurement) {
      return item.unitMeasurement.name
    }

    if (item.product?.productUnits && item.product.productUnits.length > 0) {
      const selectedUnit = item.product.productUnits.find((pu) => pu.unitMeasurementId === item.unitMeasurementId)
      return selectedUnit?.unitMeasurement.name || "unidad(es)"
    }

    return "unidad(es)"
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <h1 className="text-xl font-semibold md:text-2xl">Historial de Pedidos</h1>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {isLoading ? (
            // Estado de carga
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : errorMessage ? (
            // Estado de error
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">No se pudieron cargar tus pedidos</h2>
              <p className="mb-4 max-w-md text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => fetchOrders()}>Intentar nuevamente</Button>
            </div>
          ) : orders.length === 0 ? (
            // Sin pedidos
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">No tienes pedidos aún</h2>
              <p className="mb-4 max-w-md text-muted-foreground">
                Cuando realices un pedido, podrás ver su estado e historial aquí.
              </p>
              <Button onClick={() => (window.location.href = "/users/products")}>Ir a comprar</Button>
            </div>
          ) : (
            // Lista de pedidos
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status as OrderStatus)
                const canEdit = isToday(new Date(order.createdAt)) && order.status === OrderStatus.CREATED

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                        <span className="mx-1">•</span>
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(order.createdAt)}
                      </CardDescription>
                      {/* Mostrar el área del pedido */}
                      <CardDescription className="flex items-center gap-1 mt-1 text-blue-600">
                        <Building className="h-3.5 w-3.5" />
                        {getAreaName(order)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Productos:</p>
                        {/* Actualizar la visualización de los items en la lista de pedidos para mostrar la unidad de medida */}
                        <ul className="space-y-2">
                          {order.orderItems.slice(0, 3).map((item) => (
                            <li key={`order-item-${item.id}`} className="flex items-center gap-2 text-sm">
                              <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-muted overflow-hidden">
                                {item.product?.imageUrl ? (
                                  <Image
                                    src={item.product.imageUrl || "/placeholder.svg"}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </div>
                              <span className="flex-1 line-clamp-1">
                                {item.product?.name || `Producto #${item.productId}`}
                              </span>
                              <span className="text-muted-foreground">
                                x{item.quantity} {getUnitName(item)}
                              </span>
                            </li>
                          ))}
                          {order.orderItems.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              + {order.orderItems.length - 3} productos más
                            </li>
                          )}
                        </ul>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Fecha:</span>
                        <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
                      </div>

                      {canEdit && (
                        <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                          Este pedido puede ser editado hasta el final del día de hoy.
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Button>

                      {/* Botón de edición que solo aparece si la orden es del día actual y está en estado "created" */}
                      <OrderEditButton order={order} />
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Diálogo de detalles del pedido */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader className="flex flex-col gap-2">
            <DialogTitle className="text-xl">Detalles del Pedido #{selectedOrder?.id}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {selectedOrder && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedOrder.createdAt)}
                    <span className="mx-1">•</span>
                    <Clock className="h-4 w-4" />
                    {formatTime(selectedOrder.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 mt-1">
                    <Building className="h-4 w-4" />
                    {selectedOrder.area?.name || `Área #${selectedOrder.areaId}`}
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Estado del pedido */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Estado del pedido</h3>
                  <Badge
                    className={`${getOrderStatusInfo(selectedOrder.status as OrderStatus).color} flex items-center gap-1`}
                  >
                    {getOrderStatusInfo(selectedOrder.status as OrderStatus).icon}
                    {getOrderStatusInfo(selectedOrder.status as OrderStatus).text}
                  </Badge>
                </div>

                {/* Mostrar mensaje de edición si aplica */}
                {isToday(new Date(selectedOrder.createdAt)) && selectedOrder.status === OrderStatus.CREATED && (
                  <div className="mt-3 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                    Este pedido puede ser editado hasta el final del día de hoy.
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              <div>
                <h3 className="mb-3 font-medium">Productos</h3>
                <div className="space-y-3 rounded-lg border p-4">
                  {/* Actualizar la visualización de los items en el diálogo de detalles para mostrar la unidad de medida */}
                  {selectedOrder.orderItems.map((item) => (
                    <div key={`detail-item-${item.id}`} className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                        {item.product?.imageUrl ? (
                          <Image
                            src={item.product.imageUrl || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name || `Producto #${item.productId}`}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.product?.description || "Sin descripción"}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span className="text-sm text-muted-foreground">
                            Cantidad: {item.quantity} {getUnitName(item)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información adicional */}
              <div>
                <h3 className="mb-3 font-medium">Información adicional</h3>
                <div className="rounded-lg border p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fecha de pedido</span>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hora</span>
                      <span>{formatTime(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Área</span>
                      <span className="font-medium text-blue-600">
                        {selectedOrder.area?.name || `Área #${selectedOrder.areaId}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Número de productos</span>
                      <span>{selectedOrder.orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-medium">
                      <span>Estado</span>
                      <Badge
                        className={`${getOrderStatusInfo(selectedOrder.status as OrderStatus).color} flex items-center gap-1`}
                      >
                        {getOrderStatusInfo(selectedOrder.status as OrderStatus).icon}
                        {getOrderStatusInfo(selectedOrder.status as OrderStatus).text}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>

                {/* Mostrar botón de edición en el diálogo si aplica */}
                {isToday(new Date(selectedOrder.createdAt)) && selectedOrder.status === OrderStatus.CREATED && (
                  <OrderEditButton order={selectedOrder} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
