"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Printer, Truck, AlertCircle, CheckCircle2, Clock, Download, Plus, Trash2, Save } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { api } from "@/lib/axiosInstance"
import {
  type Order,
  OrderStatus,
  type OrderItem as BackendOrderItem,
  type Product as BackendProduct,
} from "@/types/order"
import { useParams } from "next/navigation"

// Interfaces para las respuestas de la API
interface UnitMeasurement {
  id: number
  name: string
  description?: string
}

interface ProductUnit {
  id: number
  productId: number
  unitMeasurementId: number
  unitMeasurement: UnitMeasurement
}

// Extendemos la interfaz Product del backend para incluir productUnits
interface Product extends BackendProduct {
  productUnits: ProductUnit[]
}

// Interfaz para nuestro OrderItem local que incluye las propiedades necesarias
interface OrderItem extends Omit<BackendOrderItem, "product"> {
  unitMeasurement?: UnitMeasurement
  product?: Product
}

// Tipo intermedio para los items del pedido tal como los recibimos del backend
interface OrderItemWithExtras extends BackendOrderItem {
  unitMeasurement?: UnitMeasurement
  product?: BackendProduct & { productUnits?: ProductUnit[] }
}

// Componente para mostrar el estado del pedido
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case OrderStatus.CREATED:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pendiente</span>
        </Badge>
      )
    case OrderStatus.PROCESS:
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
          <Truck className="h-3 w-3" />
          <span>En proceso</span>
        </Badge>
      )
    case OrderStatus.DELIVERED:
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3" />
          <span>Entregado</span>
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id

  const [order, setOrder] = useState<Order | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.CREATED)
  const [updating, setUpdating] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [observation, setObservation] = useState("")

  // Cargar datos del pedido, cliente y productos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [orderResponse, productsResponse, unitMeasurementsResponse] = await Promise.all([
          api.get(`/orders/${orderId}`),
          api.get("/products"),
          api.get("/unit-measurements"),
        ])

        const orderData = orderResponse.data
        const productsData = productsResponse.data
        const unitMeasurementsData = unitMeasurementsResponse.data

        // Si la respuesta ya incluye User, asignarlo como customer
        if (orderData.User) {
          orderData.customer = orderData.User
        }
        // Si no hay User pero hay userId, intentar obtenerlo
        else if (orderData.userId && !orderData.customer) {
          try {
            const customerResponse = await api.get(`/users/${orderData.userId}`)
            orderData.customer = customerResponse.data
          } catch (err) {
            console.error("Error al cargar datos del cliente:", err)
          }
        }

        // Procesar los items del pedido para incluir información completa
        if (orderData.orderItems) {
          const processedItems = orderData.orderItems.map((item: BackendOrderItem) => {
            // Buscar el producto correspondiente
            const product = productsData.find((p: Product) => p.id === item.productId)

            // Buscar la unidad de medida correspondiente
            const unitMeasurement = unitMeasurementsData.find(
              (unit: UnitMeasurement) => unit.id === item.unitMeasurementId,
            )

            return {
              ...item,
              product,
              unitMeasurement,
              unitMeasurementId:
                item.unitMeasurementId ||
                (product?.productUnits && product.productUnits.length > 0
                  ? product.productUnits[0].unitMeasurementId
                  : 1),
            }
          })

          orderData.orderItems = processedItems
        }

        setOrder(orderData)
        setOrderItems(orderData.orderItems || [])
        setNotes(orderData.notes || "")
        setStatus(orderData.status)
        setProducts(productsData)
        setObservation(orderData.observation || "")
      } catch (err) {
        console.error("Error al cargar el pedido:", err)
        setError("No se pudo cargar la información del pedido. Por favor, intenta de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchData()
    }
  }, [orderId])

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter((product) => {
    const name = product.name.toLowerCase()
    const searchTerm = productSearch.toLowerCase()
    return name.includes(searchTerm)
  })

  // Añadir producto al pedido
  const handleAddProduct = () => {
    if (products.length === 0) return

    // Si hay productos disponibles, usar el primero de la lista filtrada o de todos los productos
    const productToAdd = filteredProducts.length > 0 ? filteredProducts[0] : products[0]

    // Verificar que el producto tenga unidades de medida
    if (!productToAdd.productUnits || productToAdd.productUnits.length === 0) {
      toast.error("Error", {
        description: "El producto seleccionado no tiene unidades de medida definidas.",
      })
      return
    }

    // Usar la primera unidad de medida disponible
    const defaultUnit = productToAdd.productUnits[0]

    const newItem: OrderItem = {
      productId: productToAdd.id,
      quantity: 1,
      price: productToAdd.price,
      unitMeasurementId: defaultUnit.unitMeasurementId,
      product: productToAdd,
      unitMeasurement: defaultUnit.unitMeasurement,
    }

    setOrderItems([...orderItems, newItem])
  }

  // Eliminar producto del pedido
  const handleRemoveProduct = (index: number) => {
    const newItems = [...orderItems]
    newItems.splice(index, 1)
    setOrderItems(newItems)
  }

  // Actualizar cantidad de un producto
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return

    const newItems = [...orderItems]
    newItems[index].quantity = quantity
    setOrderItems(newItems)
  }

  // Actualizar producto seleccionado
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product || !product.productUnits || product.productUnits.length === 0) return

    const defaultUnit = product.productUnits[0]

    const newItems = [...orderItems]
    newItems[index].productId = product.id
    newItems[index].price = product.price
    newItems[index].unitMeasurementId = defaultUnit.unitMeasurementId
    newItems[index].product = product
    newItems[index].unitMeasurement = defaultUnit.unitMeasurement
    setOrderItems(newItems)
  }

  // Actualizar unidad de medida seleccionada
  const handleUnitChange = (index: number, unitMeasurementId: number) => {
    const product = products.find((p) => p.id === orderItems[index].productId)
    if (!product) return

    const unit = product.productUnits.find((u) => u.unitMeasurementId === unitMeasurementId)
    if (!unit) return

    const newItems = [...orderItems]
    newItems[index].unitMeasurementId = unitMeasurementId
    newItems[index].unitMeasurement = unit.unitMeasurement
    setOrderItems(newItems)
  }

  // Calcular total del pedido
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  // Actualizar estado del pedido
  const handleUpdateStatus = async () => {
    if (!order) return

    setUpdating(true)
    try {
      // Crear objeto de actualización según el DTO del backend
      const updateData = {
        status,
        ...(observation.trim() && { observation: observation.trim() }),
      }

      await api.patch(`/orders/${orderId}`, updateData)

      setOrder({
        ...order,
        status,
        observation,
      } as Order)

      toast.success("Pedido actualizado", {
        description: "El estado del pedido ha sido actualizado correctamente.",
      })

      setEditMode(false)
    } catch (err) {
      console.error("Error al actualizar el pedido:", err)
      toast.error("Error al actualizar", {
        description: "No se pudo actualizar el estado del pedido. Por favor, intenta de nuevo.",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Restaurar los items originales del pedido
  const restoreOriginalItems = () => {
    if (!order || !order.orderItems) return

    // Crear una nueva lista de items con el tipo correcto
    const originalItems: OrderItem[] = []

    // Procesar cada item del pedido original
    order.orderItems.forEach((item: OrderItemWithExtras) => {
      // Extraer las propiedades básicas que sabemos que existen
      const { id, productId, quantity, price, unitMeasurementId } = item

      // Crear un nuevo item con el tipo correcto
      const newItem: OrderItem = {
        id,
        productId,
        quantity,
        price,
        unitMeasurementId: unitMeasurementId || 1,
      }

      // Añadir unitMeasurement si existe en el item original
      if ("unitMeasurement" in item && item.unitMeasurement) {
        newItem.unitMeasurement = item.unitMeasurement
      }

      // Manejar el producto de manera especial
      if (item.product) {
        // Buscar el producto en nuestra lista de productos cargados
        const matchedProduct = products.find((p) => p.id === item.product?.id)

        if (matchedProduct) {
          // Si encontramos el producto en nuestra lista, usarlo directamente
          newItem.product = matchedProduct
        } else {
          // Si no lo encontramos, crear un producto con productUnits vacío
          newItem.product = {
            ...item.product,
            productUnits: [],
          } as Product
        }
      }

      // Añadir el item a la lista
      originalItems.push(newItem)
    })

    // Actualizar el estado
    setOrderItems(originalItems)
    setEditMode(false)
  }

  // Actualizar productos del pedido
  const handleUpdateProducts = async () => {
    if (!order) return

    setUpdating(true)
    try {
      // Crear objeto de actualización con los items del pedido según el formato que espera el backend
      const updateOrderItems = orderItems.map((item) => {
        // Solo incluir el id si existe y no es undefined
        const orderItem: {
          productId: number
          quantity: number
          price: number
          unitMeasurementId: number
          id?: number
        } = {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitMeasurementId: item.unitMeasurementId || 1, // Asegurar que siempre tenga un valor
        }

        // Solo añadir el id si existe y no es undefined
        if (item.id) {
          orderItem.id = item.id
        }

        return orderItem
      })

      // Crear el objeto de actualización con el formato correcto
      const updateData = {
        orderItems: updateOrderItems,
        totalAmount: calculateTotal(),
        ...(observation.trim() && { observation: observation.trim() }),
      }

      console.log("Enviando datos de actualización:", updateData)

      // Usar el mismo endpoint que para actualizar el estado
      await api.patch(`/orders/${orderId}`, updateData)

      // Actualizar el pedido local con los nuevos items
      if (order) {
        // Crear una copia tipada correctamente
        const updatedOrderItems = orderItems.map((item) => ({ ...item })) as OrderItem[]

        setOrder({
          ...order,
          orderItems: updatedOrderItems,
          totalAmount: calculateTotal(),
        })
      }

      toast.success("Productos actualizados", {
        description: "Los productos del pedido han sido actualizados correctamente.",
      })

      setEditMode(false)
    } catch (err) {
      console.error("Error al actualizar los productos:", err)
      toast.error("Error al actualizar", {
        description: "No se pudieron actualizar los productos del pedido. Por favor, intenta de nuevo.",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Simular impresión del pedido
  const handlePrint = () => {
    toast.success("Preparando impresión", {
      description: "El documento se está preparando para imprimir.",
    })
    setTimeout(() => {
      window.print()
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">{error || "No se encontró el pedido solicitado."}</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/orders">Volver a pedidos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Pedidos
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-3">
            Pedido #{order.id}
            <OrderStatusBadge status={order.status} />
          </h1>
          <p className="text-muted-foreground mt-1">
            {order.createdAt
              ? `Realizado el ${format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}`
              : "Fecha no disponible"}
          </p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información del cliente */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Información del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Cliente</h3>
                <p className="text-sm">
                  {order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : `Cliente #${order.userId}`}
                </p>
                {order.customer?.email && <p className="text-sm text-muted-foreground">{order.customer.email}</p>}
                {order.customer?.phone && <p className="text-sm text-muted-foreground">{order.customer.phone}</p>}
              </div>

              {order.area && (
                <div>
                  <h3 className="font-medium">Área</h3>
                  <p className="text-sm">{order.area.name}</p>
                </div>
              )}

              {order.shippingAddress && (
                <div>
                  <h3 className="font-medium">Dirección de envío</h3>
                  <p className="text-sm">{order.shippingAddress}</p>
                </div>
              )}

              {order.deliveryDate && (
                <div>
                  <h3 className="font-medium">Fecha de entrega</h3>
                  <p className="text-sm">
                    {format(new Date(order.deliveryDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalles del pedido */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Detalles del pedido</CardTitle>
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-1">
                Editar productos
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative w-48 hidden sm:block">
                  <Input
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="button" size="sm" onClick={handleAddProduct} className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Añadir producto</span>
                  <span className="sm:hidden">Añadir</span>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Cantidad</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Unidad</th>
                      {editMode && <th className="px-4 py-3 text-center text-sm font-medium w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={item.id || index} className="border-t">
                        <td className="px-4 py-3 text-sm">
                          {editMode ? (
                            <Select
                              value={item.productId.toString()}
                              onValueChange={(value) => handleProductChange(index, Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {filteredProducts.length > 0
                                  ? filteredProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))
                                  : products.map((product) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              {item.product?.imageUrl && (
                                <div className="relative w-8 h-8">
                                  <Image
                                    src={item.product.imageUrl || "/placeholder.svg"}
                                    alt={item.product?.name || `Producto ${item.productId}`}
                                    fill
                                    className="rounded-md object-cover"
                                    sizes="32px"
                                  />
                                </div>
                              )}
                              <span>{item.product?.name || `Producto #${item.productId}`}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {editMode ? (
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                              className="w-20 mx-auto text-center"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {editMode ? (
                            <Select
                              value={item.unitMeasurementId?.toString() || ""}
                              onValueChange={(value) => handleUnitChange(index, Number(value))}
                            >
                              <SelectTrigger className="w-24 mx-auto">
                                <SelectValue placeholder="Unidad" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.product?.productUnits?.map((unit) => (
                                  <SelectItem key={unit.unitMeasurementId} value={unit.unitMeasurementId.toString()}>
                                    {unit.unitMeasurement.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            item.unitMeasurement?.name || ""
                          )}
                        </td>
                        {editMode && (
                          <td className="px-4 py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(index)}
                              className="h-8 w-8 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editMode && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={restoreOriginalItems}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateProducts}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Estado del pedido</h3>
                  <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrderStatus.CREATED}>Pendiente</SelectItem>
                      <SelectItem value={OrderStatus.PROCESS}>En proceso</SelectItem>
                      <SelectItem value={OrderStatus.DELIVERED}>Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Notas</h3>
                  <Textarea
                    placeholder="Añadir notas sobre el pedido..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">Observaciones</h3>
                  <Textarea
                    placeholder="Observaciones especiales del cliente sobre el pedido..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 500 caracteres. Observaciones específicas del cliente.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateStatus} disabled={updating} className="bg-green-600 hover:bg-green-700">
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar estado"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}