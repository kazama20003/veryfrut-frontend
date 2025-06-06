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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// Añadir la importación del componente ProductSearchEdit
import { ProductSearchEdit } from "./history/product-search-edit"
import { Textarea } from "@/components/ui/textarea"

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
  cartItemId?: string
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
  observation?: string
}

// Modificar la interfaz ShoppingCartDrawerProps para incluir la información del área
interface ShoppingCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Product[]
  onUpdateQuantity: (productId: number, selectedUnitId: number, quantity: number, cartItemId?: string) => void
  onRemoveItem: (productId: number, selectedUnitId: number, cartItemId?: string) => void
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
    cartItemId?: string
  } | null>(null)
  const [observation, setObservation] = useState<string>("")

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

  // Función para formatear números con coma como separador decimal - MEJORADA para 3 decimales
  const formatQuantity = (quantity: number): string => {
    if (quantity % 1 === 0) {
      return quantity.toFixed(0)
    } else {
      // Reemplazar punto por coma en el número con hasta 3 decimales
      return Number.parseFloat(quantity.toFixed(3)).toString().replace(".", ",")
    }
  }

  // Función para manejar el cambio de cantidad con decimales - ACTUALIZADA
  const handleQuantityChange = (productId: number, selectedUnitId: number, value: string, cartItemId?: string) => {
    const normalizedValue = value.replace(",", ".")
    const regex = /^\d*\.?\d{0,3}$/

    if (regex.test(normalizedValue) || value === "") {
      setEditingQuantity({
        productId,
        selectedUnitId,
        cartItemId,
        value: value,
      })
    }
  }

  // Función para confirmar el cambio de cantidad - ACTUALIZADA
  const handleQuantityBlur = (productId: number, selectedUnitId: number, cartItemId?: string) => {
    if (
      editingQuantity &&
      editingQuantity.productId === productId &&
      editingQuantity.selectedUnitId === selectedUnitId &&
      editingQuantity.cartItemId === cartItemId
    ) {
      const normalizedValue = editingQuantity.value.replace(",", ".")
      const numValue = Number.parseFloat(normalizedValue)

      if (!isNaN(numValue) && numValue > 0) {
        const roundedValue = Math.round(numValue * 1000) / 1000
        onUpdateQuantity(productId, selectedUnitId, roundedValue, cartItemId)
      } else {
        const currentItem = cart.find(
          (item) => item.id === productId && item.selectedUnitId === selectedUnitId && item.cartItemId === cartItemId,
        )
        if (currentItem) {
          setEditingQuantity({
            productId,
            selectedUnitId,
            cartItemId,
            value: formatQuantity(currentItem.quantity),
          })
        }
      }
      setEditingQuantity(null)
    }
  }

  // Función para manejar Enter en el input de cantidad
  const handleQuantityKeyPress = (
    e: React.KeyboardEvent,
    productId: number,
    selectedUnitId: number,
    cartItemId?: string,
  ) => {
    if (e.key === "Enter") {
      handleQuantityBlur(productId, selectedUnitId, cartItemId)
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
          ...(observation.trim() && { observation: observation.trim() }),
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

        setObservation("")

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
          ...(observation.trim() && { observation: observation.trim() }),
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

        setObservation("")

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
      setObservation("")
    }
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="h-[90vh] sm:h-[85vh] flex flex-col">
          {/* Header mejorado para móvil */}
          <DrawerHeader className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-white">
            <div className="flex-1">
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
              <DrawerDescription className="text-sm text-muted-foreground">
                {cart.length === 0
                  ? "Tu carrito está vacío"
                  : `${cart.length} ${cart.length === 1 ? "producto" : "productos"} en tu carrito`}
              </DrawerDescription>
            </div>

            {/* Botón de cerrar mejorado para móvil */}
            <div className="flex items-center gap-2 ml-4">
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </DrawerClose>
            </div>
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
                <p className="text-sm text-muted-foreground mb-4 px-4">
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
                  className="mt-2"
                >
                  Continuar comprando
                </Button>
              </div>
            ) : (
              <>
                {/* Contenido fijo (no scrolleable) */}
                <div className="px-4 py-3 shrink-0">
                  {cart.length > 0 && (
                    <>
                      {/* Información importante sobre pedidos */}
                      <Alert className="mb-4 bg-blue-50 border-blue-200">
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                        <AlertTitle className="text-blue-700 text-sm">Información importante</AlertTitle>
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
                          <AlertTitle className="text-blue-700 flex items-center text-sm">
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
                        <li
                          key={item.cartItemId || `${item.id}-${item.selectedUnitId}`}
                          className="rounded-lg border p-3 bg-white"
                        >
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
                            <div className="flex flex-1 flex-col min-w-0">
                              <h4 className="font-medium text-sm truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-xs font-medium">{getUnitName(item)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                  onClick={() => onRemoveItem(item.id, item.selectedUnitId, item.cartItemId)}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Controles de cantidad con mejor espaciado - MEJORADOS para 0.001 */}
                          <div className="mt-3 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  onUpdateQuantity(
                                    item.id,
                                    item.selectedUnitId,
                                    Math.max(0.001, item.quantity - 0.001),
                                    item.cartItemId,
                                  )
                                }
                                disabled={item.quantity <= 0.001 || isSubmitting}
                              >
                                <Minus className="h-3 w-3" />
                                <span className="sr-only">Disminuir</span>
                              </Button>

                              {/* Input editable para cantidad con decimales */}
                              <div className="mx-1 w-20 text-center">
                                {editingQuantity &&
                                editingQuantity.productId === item.id &&
                                editingQuantity.selectedUnitId === item.selectedUnitId &&
                                editingQuantity.cartItemId === item.cartItemId ? (
                                  <Input
                                    type="text"
                                    value={editingQuantity.value}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        item.id,
                                        item.selectedUnitId,
                                        e.target.value,
                                        item.cartItemId,
                                      )
                                    }
                                    onBlur={() => handleQuantityBlur(item.id, item.selectedUnitId, item.cartItemId)}
                                    onKeyPress={(e) =>
                                      handleQuantityKeyPress(e, item.id, item.selectedUnitId, item.cartItemId)
                                    }
                                    className="h-8 text-center text-sm"
                                    autoFocus
                                    disabled={isSubmitting}
                                  />
                                ) : (
                                  <button
                                    onClick={() =>
                                      setEditingQuantity({
                                        productId: item.id,
                                        selectedUnitId: item.selectedUnitId,
                                        cartItemId: item.cartItemId,
                                        value: formatQuantity(item.quantity),
                                      })
                                    }
                                    className="w-full h-8 text-center text-sm border rounded px-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  >
                                    {formatQuantity(item.quantity)}
                                  </button>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.selectedUnitId, item.quantity + 0.001, item.cartItemId)
                                }
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
                <div className="border-t p-4 pt-3 pb-6 bg-white shrink-0 mt-auto">
                  {cart.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={onClearCart} disabled={isSubmitting} className="h-11">
                          Vaciar Carrito
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 h-11"
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
                    <Button onClick={handleClose} disabled={isSubmitting} className="w-full h-11">
                      Continuar Comprando
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Diálogo de confirmación de pedido CORREGIDO - Accesible y sin duplicados */}
      {isConfirmDialogOpen && (
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent
            className="w-[95vw] max-w-md mx-auto my-2 h-[85vh] flex flex-col p-0 gap-0 rounded-xl shadow-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header con título accesible */}
            <DialogHeader className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-xl flex-shrink-0">
              <DialogTitle className="text-lg font-bold text-white flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isEditMode ? "Actualizar Pedido" : "Confirmar Pedido"}
              </DialogTitle>
              <p className="text-green-100 text-xs mt-0.5">Revisa tu pedido antes de confirmar</p>
            </DialogHeader>

            {/* Contenido scrolleable optimizado para teclado */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Información del área */}
              <div className="px-4 py-3 bg-blue-50 border-b">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-2">
                    <Building className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 text-sm">Área de entrega</h3>
                    <p className="text-blue-700 text-xs">
                      {isEditMode ? editAreaName || "No especificada" : getSelectedAreaName()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen del pedido compacto */}
              <div className="px-4 py-3">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900 text-sm flex items-center">
                      <ShoppingCart className="h-3 w-3 mr-1 text-gray-600" />
                      Pedido ({cart.length} {cart.length === 1 ? "producto" : "productos"})
                    </h4>
                  </div>

                  <div className="p-3 max-h-32 overflow-y-auto">
                    <ul className="space-y-2">
                      {cart.map((item, index) => (
                        <li
                          key={item.cartItemId || `confirm-${item.id}-${item.selectedUnitId}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <div className="relative h-8 w-8 overflow-hidden rounded flex-shrink-0 bg-gray-100">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs text-gray-900 truncate">{item.name}</p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {formatQuantity(item.quantity)} {getUnitName(item)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Campo de observaciones compacto */}
              <div className="px-4 pb-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <label htmlFor="observation" className="block text-sm font-medium text-gray-900 mb-2">
                    💬 Observaciones
                  </label>
                  <Textarea
                    id="observation"
                    placeholder="¿Algo especial para tu pedido?"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[50px] text-sm resize-none border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                    maxLength={500}
                    rows={2}
                  />
                  <p className="text-xs text-gray-400 mt-1">{observation.length}/500</p>
                </div>
              </div>

              {/* Información importante compacta */}
              <div className="px-4 pb-3">
                <Alert className="bg-amber-50 border-amber-200 py-2">
                  <InfoIcon className="h-3 w-3 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    {isEditMode ? "Solo puedes editar hasta el final del día." : "Solo un pedido por área por día."}
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Footer fijo con botones - Siempre visible */}
            <div className="border-t bg-white px-4 py-3 flex-shrink-0 rounded-b-xl">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 text-sm h-10 border-gray-300 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm h-10"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      {isEditMode ? "Actualizar" : "Confirmar"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
