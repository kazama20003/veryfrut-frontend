"use client"

import type React from "react"

import Image from "next/image"
import { useEffect, useState, useCallback } from "react"
import { Building, InfoIcon, Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/lib/axiosInstance"
import { getUserIdFromCookies } from "@/lib/cookies"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// Añadir la importación del componente ProductSearchEdit
import { ProductSearchEdit } from "./history/product-search-edit"

// Enum para los estados de la orden
enum OrderStatus {
  CREATED = "created",
  PROCESS = "process",
  DELIVERED = "delivered",
}

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
  createdAt: string
  updatedAt: string
  productUnits: ProductUnit[]
  quantity: number
  selectedUnitId: number
}

interface Area {
  id: number
  name: string
  companyId: number
}

interface UserData {
  id: number
  firstName: string
  lastName: string
  email: string
  areas: Area[]
}

// Interfaz para las órdenes devueltas por el API
interface Order {
  id: number
  userId: number
  areaId: number
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
}

// Modificar la interfaz ShoppingCartDrawerProps para incluir la información del área
interface ShoppingCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Product[]
  onUpdateQuantity: (productId: number, selectedUnitId: number, quantity: number) => void
  onRemoveItem: (productId: number, selectedUnitId: number) => void
  onClearCart: () => void
  totalPrice: number
  onPageBlock?: (blocked: boolean) => void
  isEditMode?: boolean
  orderToEdit?: Order
  editAreaName?: string // Añadir el nombre del área que se está editando
}

// Actualizar la desestructuración de props para incluir editAreaName
export function ShoppingCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
  onPageBlock,
  isEditMode = false,
  orderToEdit,
  editAreaName,
}: ShoppingCartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOrderComplete, setIsOrderComplete] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areaOrderStatus, setAreaOrderStatus] = useState<Record<string, boolean>>({})
  const [isCheckingAreaOrders, setIsCheckingAreaOrders] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  // Estado para manejar la edición de cantidades
  const [editingQuantity, setEditingQuantity] = useState<{
    productId: number
    selectedUnitId: number
    value: string
  } | null>(null)

  // Memoizar fetchUserData para evitar recreaciones
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoadingUserData(true)
      setError(null)

      // Obtener el ID del usuario desde las cookies
      const userId = getUserIdFromCookies()

      if (!userId) {
        setError("No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.")
        return
      }

      // Obtener los datos del usuario
      const response = await api.get(`/users/${userId}`)
      setUserData(response.data)

      // Si el usuario tiene áreas, seleccionar la primera por defecto
      if (response.data.areas && response.data.areas.length > 0) {
        setSelectedAreaId(response.data.areas[0].id.toString())

        // Verificar todas las órdenes del día actual
        fetchTodayOrders()
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      setError("No se pudieron cargar tus áreas. Por favor, intenta nuevamente.")
    } finally {
      setIsLoadingUserData(false)
    }
  }, []) // No hay dependencias externas

  // Notificar al componente padre sobre el estado de bloqueo
  useEffect(() => {
    if (onPageBlock) {
      // Solo bloquear durante la operación de envío
      onPageBlock(isSubmitting)
    }

    // Limpiar al desmontar
    return () => {
      if (onPageBlock) {
        onPageBlock(false)
      }
    }
  }, [isSubmitting, onPageBlock])

  // Cargar datos del usuario cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      // Reiniciar el estado de órdenes por área cada vez que se abre el drawer
      setAreaOrderStatus({})
      fetchUserData()
      // Asegurarse de que isOrderComplete se reinicie al abrir el drawer
      setIsOrderComplete(false)
    }
  }, [isOpen, fetchUserData]) // Añadida la dependencia fetchUserData

  // Nueva función para obtener todas las órdenes del día actual
  const fetchTodayOrders = async () => {
    try {
      setIsCheckingAreaOrders(true)

      // Obtener la fecha actual
      const today = new Date()

      // Crear startDate (inicio del día) y endDate (fin del día)
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

      // Consultar todas las órdenes para el día actual sin filtrar por área
      const response = await api.get(`/orders/filter?startDate=${startDate}&endDate=${endDate}`)

      console.log("Órdenes del día:", response.data)

      // Si hay órdenes, determinar qué áreas ya tienen pedidos
      if (Array.isArray(response.data) && response.data.length > 0) {
        const orders = response.data as Order[]

        // Crear un objeto con el estado de cada área
        const newAreaOrderStatus: Record<string, boolean> = {}

        // Marcar las áreas que ya tienen pedidos
        orders.forEach((order) => {
          newAreaOrderStatus[order.areaId.toString()] = true
        })

        // Actualizar el estado
        setAreaOrderStatus(newAreaOrderStatus)

        console.log("Áreas con pedidos:", newAreaOrderStatus)
      } else {
        // No hay órdenes hoy, todas las áreas están disponibles
        console.log("No hay órdenes hoy")
        setAreaOrderStatus({})
      }
    } catch (error) {
      console.error("Error al verificar órdenes del día:", error)
      // Si hay un error, asumimos que no hay órdenes para estar seguros
      setAreaOrderStatus({})
    } finally {
      setIsCheckingAreaOrders(false)
    }
  }

  // Función para verificar si un área específica tiene pedido (solo se usa cuando es necesario confirmar)
  const checkSpecificAreaOrder = async (areaId: string) => {
    try {
      // Obtener la fecha actual
      const today = new Date()
      const dateStr = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()

      // Consultar si existe una orden para esta área y fecha
      const response = await api.get(`/orders/check?areaId=${areaId}&date=${dateStr}`)

      // La respuesta debería indicar si existe o no un pedido
      const hasOrder = response.data.exists || false

      // Actualizar el estado solo para esta área específica
      setAreaOrderStatus((prev) => ({
        ...prev,
        [areaId]: hasOrder,
      }))

      return hasOrder
    } catch (error) {
      console.error(`Error al verificar pedido específico para área ${areaId}:`, error)
      return false
    }
  }

  // Función para obtener el nombre de la unidad de medida
  const getUnitName = (product: Product) => {
    // Verificar que productUnits existe y no es undefined
    if (!product.productUnits || !Array.isArray(product.productUnits)) {
      return "Unidad"
    }

    const selectedUnit = product.productUnits.find((pu) => pu.unitMeasurement.id === product.selectedUnitId)
    return selectedUnit?.unitMeasurement.name || "Unidad"
  }

  // Función para formatear números con coma como separador decimal
  const formatQuantity = (quantity: number): string => {
    if (quantity % 1 === 0) {
      return quantity.toFixed(0)
    } else {
      // Reemplazar punto por coma en el número con 2 decimales
      return quantity.toFixed(2).replace(".", ",")
    }
  }

  // Función para manejar el cambio de cantidad con decimales
  const handleQuantityChange = (productId: number, selectedUnitId: number, value: string) => {
    // Permitir números con coma como separador decimal
    // Reemplazar comas por puntos para el procesamiento interno
    const normalizedValue = value.replace(",", ".")
    const regex = /^\d*\.?\d{0,2}$/

    if (regex.test(normalizedValue) || value === "") {
      // Guardar el valor con coma para la visualización
      setEditingQuantity({
        productId,
        selectedUnitId,
        value: value,
      })
    }
  }

  // Función para confirmar el cambio de cantidad
  const handleQuantityBlur = (productId: number, selectedUnitId: number) => {
    if (
      editingQuantity &&
      editingQuantity.productId === productId &&
      editingQuantity.selectedUnitId === selectedUnitId
    ) {
      // Normalizar el valor reemplazando coma por punto para el cálculo
      const normalizedValue = editingQuantity.value.replace(",", ".")
      const numValue = Number.parseFloat(normalizedValue)

      if (!isNaN(numValue) && numValue > 0) {
        // Redondear a múltiplos de 0.25
        const roundedValue = Math.round(numValue * 4) / 4
        onUpdateQuantity(productId, selectedUnitId, roundedValue)
      } else {
        // Si el valor no es válido, mantener la cantidad actual
        const currentItem = cart.find((item) => item.id === productId && item.selectedUnitId === selectedUnitId)
        if (currentItem) {
          setEditingQuantity({
            productId,
            selectedUnitId,
            value: formatQuantity(currentItem.quantity),
          })
        }
      }
      setEditingQuantity(null)
    }
  }

  // Función para manejar Enter en el input de cantidad
  const handleQuantityKeyPress = (e: React.KeyboardEvent, productId: number, selectedUnitId: number) => {
    if (e.key === "Enter") {
      handleQuantityBlur(productId, selectedUnitId)
    }
  }

  // Función para mostrar el diálogo de confirmación
  const handleShowConfirmation = async () => {
    if (cart.length === 0) return

    // En modo edición, no necesitamos verificar si ya existe una orden para el área
    if (isEditMode) {
      setIsConfirmDialogOpen(true)
      return
    }

    // Validar que se haya seleccionado un área
    if (!selectedAreaId) {
      toast.error("Selecciona un área", {
        description: "Debes seleccionar un área para realizar el pedido.",
      })
      return
    }

    // Verificar nuevamente si ya existe una orden para esta área específica hoy
    // Esto es una doble verificación para asegurarnos de tener la información más actualizada
    const hasOrder = await checkSpecificAreaOrder(selectedAreaId)

    if (hasOrder) {
      toast.error("Orden ya existente", {
        description: "Ya existe una orden para esta área hoy. Solo se permite una orden por área por día.",
      })
      return
    }

    setIsConfirmDialogOpen(true)
  }

  // Modificar la función handleSubmitOrder para incluir unitMeasurementId
  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true)

      // Obtener el ID del usuario
      const userId = getUserIdFromCookies()

      if (!userId) {
        toast.error("Error de autenticación", {
          description: "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
        })
        return
      }

      // Si estamos en modo edición, usamos el endpoint de edición
      if (isEditMode && orderToEdit) {
        // Preparar los datos para la edición según el DTO
        const updateData = {
          totalAmount: totalPrice,
          orderItems:
            cart.length === 0
              ? []
              : cart.map((item) => ({
                  productId: item.id,
                  quantity: item.quantity,
                  price: item.price,
                  unitMeasurementId: item.selectedUnitId, // Añadir unitMeasurementId
                })),
        }

        console.log("Actualizando orden:", updateData)

        // Enviar la actualización al backend
        await api.patch(`/orders/${orderToEdit.id}`, updateData)

        // Cerrar el diálogo de confirmación
        setIsConfirmDialogOpen(false)

        // Mostrar mensaje de éxito
        toast.success(cart.length === 0 ? "Pedido vaciado con éxito" : "Pedido actualizado con éxito", {
          description:
            cart.length === 0
              ? "Tu pedido ha sido vaciado. Ya no recibirás productos mañana."
              : "Tu pedido ha sido actualizado y será procesado pronto. La entrega será mañana.",
        })

        // Mostrar mensaje de confirmación
        setIsOrderComplete(true)

        // Cerrar el drawer después de un breve retraso
        setTimeout(() => {
          setIsOrderComplete(false)
          // Desbloquear la página antes de cerrar
          if (onPageBlock) {
            onPageBlock(false)
          }
          onClose()
        }, 2000)
      } else {
        // Verificar una última vez si ya existe una orden para esta área
        const hasOrder = await checkSpecificAreaOrder(selectedAreaId)

        if (hasOrder) {
          toast.error("Orden ya existente", {
            description: "Ya existe una orden para esta área hoy. Solo se permite una orden por área por día.",
          })
          setIsConfirmDialogOpen(false)
          return
        }

        // Preparar los datos de la orden con la estructura correcta según el backend
        const orderData = {
          userId: Number(userId),
          areaId: Number(selectedAreaId),
          totalAmount: totalPrice,
          status: OrderStatus.CREATED,
          orderItems: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            unitMeasurementId: item.selectedUnitId, // Añadir unitMeasurementId
          })),
        }

        console.log("Enviando orden:", orderData)

        // Enviar la orden al backend
        await api.post("/orders", orderData)

        // Cerrar el diálogo de confirmación
        setIsConfirmDialogOpen(false)

        // Mostrar mensaje de éxito
        toast.success("Pedido realizado con éxito", {
          description: "Tu pedido ha sido enviado y será procesado pronto. La entrega será mañana.",
        })

        // Actualizar el estado de las áreas con pedidos
        setAreaOrderStatus((prev) => ({
          ...prev,
          [selectedAreaId]: true,
        }))

        // Mostrar mensaje de confirmación
        setIsOrderComplete(true)

        // Cerrar el drawer después de un breve retraso
        setTimeout(() => {
          setIsOrderComplete(false)
          // Desbloquear la página antes de cerrar
          if (onPageBlock) {
            onPageBlock(false)
          }
          onClose()
        }, 2000)
      }

      // Limpiar el carrito
      onClearCart()
    } catch (error: unknown) {
      console.error("Error al procesar el pedido:", error)

      // Manejar el error de forma segura con TypeScript
      let errorMessage = "Ha ocurrido un error. Por favor, inténtalo de nuevo."

      if (error && typeof error === "object") {
        const errorObj = error as Record<string, unknown>

        if ("response" in errorObj && errorObj.response && typeof errorObj.response === "object") {
          const responseObj = errorObj.response as Record<string, unknown>

          if ("data" in responseObj && responseObj.data && typeof responseObj.data === "object") {
            const dataObj = responseObj.data as Record<string, unknown>

            if ("message" in dataObj && typeof dataObj.message === "string") {
              errorMessage = dataObj.message
            }
          }
        }
      }

      toast.error(isEditMode ? "Error al actualizar el pedido" : "Error al realizar el pedido", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
      // Asegurarse de desbloquear la página incluso si hay un error
      if (onPageBlock) {
        onPageBlock(false)
      }
    }
  }

  // Obtener el nombre del área seleccionada
  const getSelectedAreaName = () => {
    if (!userData?.areas || !selectedAreaId) return ""
    const area = userData.areas.find((area) => area.id.toString() === selectedAreaId)
    return area?.name || ""
  }

  // Función para manejar el cierre del drawer
  const handleClose = () => {
    // Asegurarse de que todos los estados se reinicien correctamente
    if (!isSubmitting) {
      // Desbloquear la página antes de cerrar
      if (onPageBlock) {
        onPageBlock(false)
      }

      // Cerrar el drawer
      onClose()
    }
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="h-[85vh] flex flex-col">
          <DrawerHeader className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div>
              <DrawerTitle className="flex items-center text-lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isEditMode ? "Editar Pedido" : "Carrito de Compras"}
              </DrawerTitle>
              {isEditMode && editAreaName && (
                <div className="mt-1 flex items-center">
                  <Building className="h-4 w-4 mr-1.5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Área: {editAreaName}</span>
                </div>
              )}
              <DrawerDescription>
                {cart.length === 0
                  ? "Tu carrito está vacío"
                  : `${cart.length} ${cart.length === 1 ? "producto" : "productos"} en tu carrito`}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" disabled={isSubmitting}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {isOrderComplete ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-medium">
                  {isEditMode ? "¡Pedido actualizado con éxito!" : "¡Pedido realizado con éxito!"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? "Tu pedido ha sido actualizado y será procesado pronto. La entrega será mañana."
                    : "Tu pedido ha sido enviado y será procesado pronto. La entrega será mañana."}
                </p>
                <Button
                  onClick={() => {
                    setIsOrderComplete(false)
                    if (onPageBlock) {
                      onPageBlock(false)
                    }
                    onClose()
                  }}
                  className="mt-4"
                >
                  Continuar comprando
                </Button>
              </div>
            ) : (
              <>
                {/* Contenido fijo (no scrolleable) */}
                <div className="px-4 py-2 shrink-0">
                  {cart.length > 0 && (
                    <>
                      {/* Información importante sobre pedidos */}
                      <Alert className="mb-4 bg-blue-50 border-blue-200">
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                        <AlertTitle className="text-blue-700">Información importante</AlertTitle>
                        <AlertDescription className="text-blue-600">
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li>Solo se permite una orden por área por día.</li>
                            <li>La orden se puede editar hasta el final del día.</li>
                            <li>La entrega de los productos será al día siguiente.</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      {/* Añadir un banner informativo en modo edición que muestre el área */}
                      {isEditMode && (
                        <Alert className="mb-4 bg-blue-50 border-blue-200">
                          <InfoIcon className="h-4 w-4 text-blue-500" />
                          <AlertTitle className="text-blue-700 flex items-center">
                            <Building className="h-4 w-4 mr-1.5" />
                            Editando pedido para área: {editAreaName || "No especificada"}
                          </AlertTitle>
                          <AlertDescription className="text-blue-600">
                            <ul className="list-disc pl-5 space-y-1 text-xs">
                              <li>Puedes añadir o quitar productos de este pedido.</li>
                              <li>La edición solo está disponible hasta el final del día de hoy.</li>
                              <li>La entrega de los productos será mañana.</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Selector de área - solo visible cuando no estamos en modo edición */}
                      {!isEditMode && (
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-medium">Selecciona el área para el pedido</label>
                          {isLoadingUserData || isCheckingAreaOrders ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                {isLoadingUserData ? "Cargando áreas..." : "Verificando pedidos existentes..."}
                              </span>
                            </div>
                          ) : error ? (
                            <Alert variant="destructive" className="mb-4">
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          ) : userData?.areas && userData.areas.length > 0 ? (
                            <>
                              <Select value={selectedAreaId} onValueChange={setSelectedAreaId} disabled={isSubmitting}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecciona un área" />
                                </SelectTrigger>
                                <SelectContent>
                                  {userData.areas.map((area) => (
                                    <SelectItem
                                      key={area.id}
                                      value={area.id.toString()}
                                      disabled={areaOrderStatus[area.id.toString()]}
                                    >
                                      <div className="flex items-center">
                                        <Building className="mr-2 h-4 w-4" />
                                        {area.name}
                                        {areaOrderStatus[area.id.toString()] && " (Ya tiene pedido hoy)"}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {areaOrderStatus[selectedAreaId] && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTitle className="text-sm">Área con pedido existente</AlertTitle>
                                  <AlertDescription className="text-xs">
                                    El área {getSelectedAreaName()} ya tiene un pedido para hoy. Por favor, selecciona
                                    otra área o edita el pedido existente.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No tienes áreas asignadas. Contacta al administrador.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Dentro del componente ShoppingCartDrawer, añadir la sección de búsqueda de productos en modo edición */}
                      {isEditMode && (
                        <div className="mb-4">
                          <ProductSearchEdit
                            onAddProduct={(product, selectedUnitId) => {
                              // Añadir directamente al carrito con la unidad seleccionada
                              onUpdateQuantity(product.id, selectedUnitId, 1)
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Área scrolleable para productos - CORREGIDA */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {cart.length > 0 ? (
                    <ul className="space-y-3">
                      {cart.map((item) => (
                        <li key={`${item.id}-${item.selectedUnitId}`} className="rounded-lg border p-3">
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
                                  onClick={() => onRemoveItem(item.id, item.selectedUnitId)}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Controles de cantidad con mejor espaciado */}
                          <div className="mt-3 flex items-center">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.selectedUnitId, Math.max(0.25, item.quantity - 0.25))
                                }
                                disabled={item.quantity <= 0.25 || isSubmitting}
                              >
                                <Minus className="h-3 w-3" />
                                <span className="sr-only">Disminuir</span>
                              </Button>

                              {/* Input editable para cantidad con decimales */}
                              <div className="mx-1 w-16 text-center">
                                {editingQuantity &&
                                editingQuantity.productId === item.id &&
                                editingQuantity.selectedUnitId === item.selectedUnitId ? (
                                  <Input
                                    type="text"
                                    value={editingQuantity.value}
                                    onChange={(e) => handleQuantityChange(item.id, item.selectedUnitId, e.target.value)}
                                    onBlur={() => handleQuantityBlur(item.id, item.selectedUnitId)}
                                    onKeyPress={(e) => handleQuantityKeyPress(e, item.id, item.selectedUnitId)}
                                    className="h-7 text-center text-sm"
                                    autoFocus
                                    disabled={isSubmitting}
                                  />
                                ) : (
                                  <button
                                    onClick={() =>
                                      setEditingQuantity({
                                        productId: item.id,
                                        selectedUnitId: item.selectedUnitId,
                                        value: formatQuantity(item.quantity),
                                      })
                                    }
                                    className="w-full h-7 text-center text-sm border rounded px-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  >
                                    {formatQuantity(item.quantity)}
                                  </button>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => onUpdateQuantity(item.id, item.selectedUnitId, item.quantity + 0.25)}
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
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
                      <ShoppingCart className="mb-2 h-10 w-10 opacity-20" />
                      {isEditMode ? (
                        <>
                          <p>Este pedido está vacío</p>
                          <p className="text-sm">Puedes añadir productos usando el buscador de arriba</p>
                        </>
                      ) : (
                        <>
                          <p>No hay productos en tu carrito</p>
                          <p className="text-sm">Agrega algunos productos para continuar</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer siempre visible - Separado claramente del contenido scrolleable */}
                <div className="border-t p-4 pt-3 pb-4 bg-background shrink-0 mt-auto">
                  {cart.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onClearCart} disabled={isSubmitting}>
                          Vaciar Carrito
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleShowConfirmation}
                          disabled={
                            isSubmitting ||
                            (!isEditMode &&
                              (!selectedAreaId ||
                                cart.length === 0 ||
                                areaOrderStatus[selectedAreaId] ||
                                isCheckingAreaOrders))
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : isEditMode ? (
                            cart.length === 0 ? (
                              "Guardar pedido vacío"
                            ) : (
                              "Actualizar Pedido"
                            )
                          ) : (
                            "Revisar Pedido"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  {cart.length === 0 && (
                    <Button onClick={handleClose} disabled={isSubmitting}>
                      Continuar Comprando
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Diálogo de confirmación de pedido */}
      {isConfirmDialogOpen && (
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              {/* Modificar el diálogo de confirmación para mostrar el área en modo edición */}
              <DialogTitle>{isEditMode ? "Actualizar Pedido" : "Confirmar Pedido"}</DialogTitle>
              <DialogDescription>
                Revisa los productos de tu pedido antes de confirmar. La entrega será mañana.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center mb-2">
                <Building className="h-4 w-4 mr-1.5 text-blue-600" />
                <h3 className="font-medium text-sm">
                  Área: {isEditMode ? editAreaName || "No especificada" : getSelectedAreaName()}
                </h3>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <h4 className="text-sm font-medium">Resumen del pedido</h4>
                </div>

                <div className="p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-3">
                    {cart.map((item) => (
                      <li
                        key={`confirm-${item.id}-${item.selectedUnitId}`}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-md">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatQuantity(item.quantity)} {getUnitName(item)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 text-xs">
                  {isEditMode
                    ? "Recuerda que solo puedes editar tu pedido hasta el final del día."
                    : "Recuerda que solo puedes realizar un pedido por área por día. La orden se puede editar hasta el final del día."}
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitOrder} className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : isEditMode ? (
                  "Actualizar Pedido"
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
