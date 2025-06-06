"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/axiosInstance"
import { type CreateOrderDto, OrderStatus } from "@/types/order"

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  areas?: Area[]
}

interface Area {
  id: number
  name: string
  companyId?: number
}

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

interface Product {
  id: number
  name: string
  price: number
  stock: number
  categoryId?: number
  productUnits: ProductUnit[]
}

interface OrderItem {
  productId: number
  productName: string
  quantity: number
  price: number
  total: number
  unitMeasurementId: number
  unitMeasurementName: string
}

export default function NewOrderPage() {
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [observation, setObservation] = useState("")
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.CREATED)

  // Cargar clientes y productos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [usersRes, productsRes] = await Promise.all([api.get("/users"), api.get("/products")])

        setCustomers(usersRes.data)
        setProducts(productsRes.data)
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("No se pudieron cargar los datos necesarios. Por favor, intenta de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Actualizar cliente seleccionado
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === Number(selectedCustomerId))
      setSelectedCustomer(customer || null)

      // Si el cliente tiene áreas, seleccionar la primera por defecto
      if (customer?.areas && customer.areas.length > 0) {
        setSelectedAreaId(customer.areas[0].id.toString())
      } else {
        setSelectedAreaId("")
      }
    } else {
      setSelectedCustomer(null)
      setSelectedAreaId("")
    }
  }, [selectedCustomerId, customers])

  // Filtrar clientes por búsqueda
  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
    const email = customer.email?.toLowerCase() || ""
    const searchTerm = customerSearch.toLowerCase()

    return fullName.includes(searchTerm) || email.includes(searchTerm)
  })

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
      productName: productToAdd.name,
      quantity: 1,
      price: productToAdd.price,
      total: productToAdd.price,
      unitMeasurementId: defaultUnit.unitMeasurementId,
      unitMeasurementName: defaultUnit.unitMeasurement.name,
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
  const handleQuantityChange = (index: number, value: string) => {
    const quantity = Number.parseFloat(value) || 0
    if (quantity < 0) return

    const newItems = [...orderItems]
    newItems[index].quantity = quantity
    newItems[index].total = quantity * newItems[index].price
    setOrderItems(newItems)
  }

  // Actualizar producto seleccionado
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product || !product.productUnits || product.productUnits.length === 0) return

    const defaultUnit = product.productUnits[0]

    const newItems = [...orderItems]
    newItems[index].productId = product.id
    newItems[index].productName = product.name
    newItems[index].price = product.price
    newItems[index].total = newItems[index].quantity * product.price
    newItems[index].unitMeasurementId = defaultUnit.unitMeasurementId
    newItems[index].unitMeasurementName = defaultUnit.unitMeasurement.name
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
    newItems[index].unitMeasurementName = unit.unitMeasurement.name
    setOrderItems(newItems)
  }

  // Calcular total del pedido
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0)
  }

  // Validar formulario
  const validateForm = () => {
    if (!selectedCustomerId) {
      toast.error("Error de validación", {
        description: "Debes seleccionar un cliente.",
      })
      return false
    }

    if (!selectedAreaId) {
      toast.error("Error de validación", {
        description: "Debes seleccionar un área.",
      })
      return false
    }

    if (orderItems.length === 0) {
      toast.error("Error de validación", {
        description: "Debes añadir al menos un producto al pedido.",
      })
      return false
    }

    // Validar que todas las cantidades sean válidas
    const invalidItems = orderItems.filter((item) => item.quantity <= 0)
    if (invalidItems.length > 0) {
      toast.error("Error de validación", {
        description: "Todas las cantidades deben ser mayores a 0.",
      })
      return false
    }

    return true
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const orderData: CreateOrderDto = {
        userId: Number(selectedCustomerId),
        areaId: Number(selectedAreaId),
        totalAmount: calculateTotal(),
        status,
        ...(observation.trim() && { observation: observation.trim() }),
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitMeasurementId: item.unitMeasurementId,
        })),
      }

      const response = await api.post("/orders", orderData)

      toast.success("Pedido creado", {
        description: "El pedido ha sido creado correctamente.",
      })

      router.push(`/dashboard/orders/${response.data.id}`)
    } catch (err) {
      console.error("Error al crear el pedido:", err)
      toast.error("Error al crear el pedido", {
        description: "No se pudo crear el pedido. Por favor, intenta de nuevo.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 mb-4 text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nuevo Pedido</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información del cliente */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerSearch">Buscar cliente</Label>
                <Input
                  id="customerSearch"
                  placeholder="Buscar por nombre o email"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerId">Seleccionar cliente</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customerId">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.firstName} {customer.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">No se encontraron clientes</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <>
                  <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                    </div>

                    {selectedCustomer.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono:</p>
                        <p className="text-sm">{selectedCustomer.phone}</p>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Dirección:</p>
                        <p className="text-sm">{selectedCustomer.address}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaId">Área</Label>
                    <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                      <SelectTrigger id="areaId">
                        <SelectValue placeholder="Seleccionar área" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCustomer.areas && selectedCustomer.areas.length > 0 ? (
                          selectedCustomer.areas.map((area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">No hay áreas disponibles</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Estado del pedido</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrderStatus.CREATED}>Pendiente</SelectItem>
                    <SelectItem value={OrderStatus.PROCESS}>En proceso</SelectItem>
                    <SelectItem value={OrderStatus.DELIVERED}>Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observación (opcional)</Label>
                <Textarea
                  id="observation"
                  placeholder="Añadir observación sobre el pedido..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Productos del pedido */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Productos</CardTitle>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/30">
                    <p className="text-muted-foreground">No hay productos en el pedido</p>
                    <Button type="button" variant="link" onClick={handleAddProduct} className="mt-2">
                      Añadir producto
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Cantidad</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Unidad</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Precio</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                          <th className="px-4 py-3 text-center text-sm font-medium w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId)
                          const availableUnits = product?.productUnits || []

                          return (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3">
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
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                                  onBlur={(e) => {
                                    // Asegurar que el valor mínimo sea 0.001 cuando se pierde el foco
                                    const value = Number.parseFloat(e.target.value) || 0
                                    if (value > 0 && value < 0.001) {
                                      handleQuantityChange(index, "0.001")
                                    } else if (value === 0) {
                                      handleQuantityChange(index, "0.001")
                                    }
                                  }}
                                  className="w-20 mx-auto text-center"
                                  placeholder="0.001"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Select
                                  value={item.unitMeasurementId.toString()}
                                  onValueChange={(value) => handleUnitChange(index, Number(value))}
                                >
                                  <SelectTrigger className="w-24 mx-auto">
                                    <SelectValue placeholder="Unidad" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableUnits.map((unit) => (
                                      <SelectItem
                                        key={unit.unitMeasurementId}
                                        value={unit.unitMeasurementId.toString()}
                                      >
                                        {unit.unitMeasurement.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-medium">${item.total.toFixed(2)}</td>
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
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr className="border-t">
                          <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right">${calculateTotal().toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard/orders">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear pedido
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
