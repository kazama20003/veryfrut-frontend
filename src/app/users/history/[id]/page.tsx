"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import React from "react"
import Image from "next/image"
import { Building, ChevronLeft, InfoIcon, Loader2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/lib/axiosInstance"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Interfaces
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
  createdAt?: string
  updatedAt?: string
  productUnits?: ProductUnit[]
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
  status: string
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
}

interface CartItem {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  quantity: number
  selectedUnitId: number
  productUnits: ProductUnit[]
}

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use para acceder a los parámetros
  const { id } = React.use(params)

  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [unitMeasurements, setUnitMeasurements] = useState<UnitMeasurement[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // Actualizar la función fetchOrderData para manejar correctamente las unidades de medida
  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Obtener unidades de medida
      const unitResponse = await api.get("/unit-measurements")
      setUnitMeasurements(unitResponse.data || [])

      // Obtener todos los productos para la búsqueda
      const productsResponse = await api.get("/products")
      setAllProducts(productsResponse.data || [])

      // Obtener detalles del pedido
      const response = await api.get(`/orders/${id}`)
      const orderData = response.data

      setOrder(orderData)

      // Convertir items del pedido al formato del carrito
      const cartItems: CartItem[] = []

      for (const item of orderData.orderItems) {
        // Obtener detalles completos del producto si no están disponibles
        let productDetails = item.product

        if (!productDetails) {
          const productResponse = await api.get(`/products/${item.productId}`)
          productDetails = productResponse.data
        }

        if (!productDetails) {
          console.error(`No se pudo obtener el producto con ID ${item.productId}`)
          continue
        }

        // Asegurarse de que el producto tenga unidades de medida
        if (
          !productDetails.productUnits ||
          !Array.isArray(productDetails.productUnits) ||
          productDetails.productUnits.length === 0
        ) {
          // Crear una unidad por defecto
          const defaultUnit = unitResponse.data.find((um: UnitMeasurement) => um.id === 1) || {
            id: 1,
            name: "Unidad",
            description: "Unidad estándar",
          }

          productDetails.productUnits = [
            {
              id: 1,
              productId: productDetails.id,
              unitMeasurementId: defaultUnit.id,
              unitMeasurement: defaultUnit,
            },
          ]
        }

        // Usar unitMeasurementId del item si está disponible, de lo contrario usar el primero disponible
        const selectedUnitId = item.unitMeasurementId || productDetails.productUnits[0].unitMeasurement.id

        // Añadir al carrito
        cartItems.push({
          id: productDetails.id,
          name: productDetails.name,
          description: productDetails.description,
          price: item.price,
          imageUrl: productDetails.imageUrl || "",
          quantity: item.quantity,
          selectedUnitId: selectedUnitId,
          productUnits: productDetails.productUnits,
        })
      }

      setCart(cartItems)
    } catch (error) {
      console.error("Error al cargar el pedido:", error)
      toast.error("Error al cargar el pedido", {
        description: "No se pudo cargar la información del pedido. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // Cargar datos del pedido
  useEffect(() => {
    fetchOrderData()
  }, [fetchOrderData])

  // Buscar productos
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)

      // Filtrar productos localmente en lugar de hacer una llamada API
      const query = searchQuery.toLowerCase()
      const filtered = allProducts.filter(
        (product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query),
      )

      setSearchResults(filtered.slice(0, 5)) // Limitar a 5 resultados
    } catch (error) {
      console.error("Error al buscar productos:", error)
      toast.error("Error al buscar productos", {
        description: "No se pudieron cargar los resultados de búsqueda.",
      })
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, allProducts])

  // Actualizar búsqueda cuando cambia la consulta
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  // Añadir producto al carrito
  const addToCart = (product: Product, unitId: number) => {
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.findIndex((item) => item.id === product.id && item.selectedUnitId === unitId)

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar la cantidad
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      setCart(updatedCart)
    } else {
      // Si no existe, añadir como nuevo item
      setCart((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl || "",
          quantity: 1,
          selectedUnitId: unitId,
          productUnits: product.productUnits || [],
        },
      ])
    }

    toast.success("Producto añadido", {
      description: `${product.name} ha sido añadido al pedido.`,
    })
  }

  // Actualizar cantidad de un producto
  const updateQuantity = (productId: number, selectedUnitId: number, quantity: number) => {
    if (quantity <= 0) {
      // Si la cantidad es 0 o menos, eliminar el producto
      setCart((prev) => prev.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId)))
    } else {
      // Actualizar la cantidad
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId && item.selectedUnitId === selectedUnitId ? { ...item, quantity } : item,
        ),
      )
    }
  }

  // Eliminar un producto del carrito
  const removeFromCart = (productId: number, selectedUnitId: number) => {
    setCart((prev) => prev.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId)))
  }

  // Obtener el nombre de la unidad de medida
  const getUnitName = (item: CartItem) => {
    if (!item.productUnits || !Array.isArray(item.productUnits)) {
      return "Unidad"
    }

    const selectedUnit = item.productUnits.find((pu) => pu.unitMeasurement.id === item.selectedUnitId)
    return selectedUnit?.unitMeasurement.name || "Unidad"
  }

  // Guardar cambios en el pedido
  const handleSaveChanges = async () => {
    if (!order) return

    try {
      setIsSubmitting(true)

      // Preparar los datos para la actualización
      const updateData = {
        totalAmount: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        orderItems: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          unitMeasurementId: item.selectedUnitId, // Añadir unitMeasurementId
        })),
      }

      console.log("Actualizando pedido con PATCH:", order.id, updateData)

      // Enviar la actualización al backend usando PATCH
      await api.patch(`/orders/${order.id}`, updateData)

      toast.success("Pedido actualizado con éxito", {
        description:
          cart.length === 0
            ? "Tu pedido ha sido vaciado. Ya no recibirás productos mañana."
            : "Tu pedido ha sido actualizado y será procesado pronto. La entrega será mañana.",
      })

      // Redirigir a la página de historial de pedidos
      setTimeout(() => {
        router.push("/users/history")
      }, 1500)
    } catch (error) {
      console.error("Error al actualizar el pedido:", error)
      toast.error("Error al actualizar el pedido", {
        description: "No se pudo actualizar el pedido. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancelar la edición
  const handleCancel = () => {
    router.push("/users/history")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
          <Button variant="ghost" size="icon" className="mr-2" onClick={handleCancel}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold md:text-xl">Cargando pedido...</h1>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando información del pedido...</span>
          </div>
        </main>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
          <Button variant="ghost" size="icon" className="mr-2" onClick={handleCancel}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold md:text-xl">Pedido no encontrado</h1>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudo encontrar el pedido solicitado. Por favor, regresa al historial de pedidos e intenta
              nuevamente.
            </AlertDescription>
          </Alert>

          <Button className="mt-4" onClick={handleCancel}>
            Volver al historial
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4 md:px-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={handleCancel}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold md:text-xl">Editar Pedido #{order.id}</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {/* Información del área */}
        <div className="mb-4 flex items-center">
          <Building className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-medium text-blue-700">Área: {order.area?.name || `Área #${order.areaId}`}</h2>
        </div>

        {/* Información importante */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Información importante</AlertTitle>
          <AlertDescription className="text-blue-600">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Puedes añadir o quitar productos de este pedido.</li>
              <li>La edición solo está disponible hasta el final del día de hoy.</li>
              <li>La entrega de los productos será mañana.</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Buscador de productos */}
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">Añadir productos al pedido</h3>
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar productos para añadir..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSubmitting}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />

            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 shadow-lg">
                <CardContent className="p-0">
                  <ScrollArea className="max-h-80">
                    <ul className="divide-y">
                      {searchResults.map((product) => (
                        <li key={product.id} className="p-3 hover:bg-muted/50">
                          <div className="flex items-start gap-3">
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                              <Image
                                src={product.imageUrl || "/placeholder.svg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{product.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>

                              <div className="mt-2 flex items-center justify-between">
                                <Select
                                  defaultValue={
                                    product.productUnits && product.productUnits.length > 0
                                      ? product.productUnits[0].unitMeasurement.id.toString()
                                      : "1"
                                  }
                                  onValueChange={(value) => {
                                    // Cuando se selecciona una unidad, añadir el producto con esa unidad
                                    addToCart(product, Number(value))
                                    // Limpiar la búsqueda después de añadir
                                    setSearchQuery("")
                                    setSearchResults([])
                                  }}
                                  disabled={isSubmitting}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32 bg-background border-border/60">
                                    <SelectValue placeholder="Seleccionar unidad" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {product.productUnits && product.productUnits.length > 0
                                      ? product.productUnits.map((pu) => (
                                          <SelectItem key={pu.id} value={pu.unitMeasurement.id.toString()}>
                                            {pu.unitMeasurement.name}
                                          </SelectItem>
                                        ))
                                      : unitMeasurements.map((um) => (
                                          <SelectItem key={um.id} value={um.id.toString()}>
                                            {um.name}
                                          </SelectItem>
                                        ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Lista de productos en el pedido */}
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">Productos en el pedido</h3>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/20">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No hay productos en el pedido</p>
              <p className="text-sm text-muted-foreground">Busca y añade productos usando el buscador de arriba</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((item, index) => (
                <li key={`cart-item-${item.id}-${item.selectedUnitId}-${index}`} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-medium">{getUnitName(item)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeFromCart(item.id, item.selectedUnitId)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQuantity(item.id, item.selectedUnitId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isSubmitting}
                      >
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Disminuir</span>
                      </Button>
                      <span className="mx-2 w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQuantity(item.id, item.selectedUnitId, item.quantity + 1)}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Aumentar</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator className="my-6" />

        {/* Botones de acción */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setCart([])} disabled={cart.length === 0 || isSubmitting}>
              Vaciar pedido
            </Button>

            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveChanges} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
