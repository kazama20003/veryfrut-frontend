"use client"

import type React from "react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Minus, Plus, ShoppingCart, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { areaService, orderService, useCreateOrderMutation, usersService } from "@/lib/api"
import type { Area } from "@/types/area"
import type { User } from "@/types/users"
import type { CreateOrderDto } from "@/types/order"

// Alternative user interface with areas instead of areaIds
interface UserWithAreas extends Omit<User, 'areaIds'> {
  areas: Array<{
    id: number
    name: string
    description?: string
  }>
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
  productUnits: Array<{
    id: number
    productId: number
    unitMeasurementId: number
    unitMeasurement: {
      id: number
      name: string
      description: string
    }
  }>
  quantity: number
  selectedUnitId: number
  cartItemId?: string
  rating?: number
}

interface ShoppingCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Product[]
  onUpdateQuantity: (productId: number, selectedUnitId: number, quantity: number, cartItemId?: string) => void
  onRemoveItem: (productId: number, selectedUnitId: number, cartItemId?: string) => void
  onClearCart: () => void
  totalPrice: number
}

function formatQuantity(quantity: number): string {
  if (quantity % 1 === 0) {
    return quantity.toFixed(0)
  }
  return Number.parseFloat(quantity.toFixed(2)).toString().replace(".", ",")
}

export function ShoppingCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
}: ShoppingCartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [blockedAreaIds, setBlockedAreaIds] = useState<Set<number>>(new Set())
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [observation, setObservation] = useState("")
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [isCheckingAreas, setIsCheckingAreas] = useState(false)
  const createOrderMutation = useCreateOrderMutation()
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], [])

  const fetchAreas = useCallback(async () => {
    try {
      setIsLoadingAreas(true)

      const currentUser = await usersService.getMe()
      const currentUserAreaIds = Array.isArray(currentUser?.areaIds)
        ? currentUser.areaIds
        : currentUser && 'areas' in currentUser && Array.isArray((currentUser as UserWithAreas).areas)
          ? (currentUser as UserWithAreas).areas.map((area) => area.id)
          : null
      console.log("[v0] Usuario actual:", currentUser)
      console.log("[v0] Areas del usuario:", currentUserAreaIds)

      if (!currentUserAreaIds || currentUserAreaIds.length === 0) {
        toast.error("No tienes areas asignadas")
        setAreas([])
        return
      }

      const allAreas = await areaService.getAll()
      const userAreas = allAreas.filter((area: Area) => currentUserAreaIds.includes(area.id))

      console.log("[v0] Areas filtradas:", userAreas)

      setAreas(userAreas)
      if (userAreas.length > 0) {
        setSelectedAreaId(userAreas[0].id.toString())
      }

      // Block areas that already have an order today
      setIsCheckingAreas(true)
      try {
        const blockedIds = await Promise.all(
          userAreas.map(async (area) => {
            try {
              const check = await orderService.check({ areaId: area.id.toString(), date: todayDate })
              return check.exists ? area.id : null
            } catch (error) {
              console.warn("[shopping-cart-drawer] Error checking order for area:", area.id, error)
              return null
            }
          }),
        )

        const blocked = new Set<number>(blockedIds.filter((id): id is number => typeof id === "number"))
        setBlockedAreaIds(blocked)

        const firstAvailable = userAreas.find((a) => !blocked.has(a.id))
        if (firstAvailable) {
          setSelectedAreaId(firstAvailable.id.toString())
        }
      } finally {
        setIsCheckingAreas(false)
      }
    } catch (error) {
      console.warn("[v0] Error cargando usuario, no se cargaran areas:", error)
      toast.error("Error al cargar el usuario actual")
      setAreas([])
    } finally {
      setIsLoadingAreas(false)
    }
  }, [todayDate])

  // Cargar áreas disponibles
  useEffect(() => {
    if (isOpen && areas.length === 0) {
      fetchAreas()
    }
  }, [fetchAreas, isOpen, areas.length])

  useEffect(() => {
    if (!selectedAreaId) return
    const asNumber = Number(selectedAreaId)
    if (!Number.isFinite(asNumber)) return

    if (blockedAreaIds.has(asNumber)) {
      const firstAvailable = areas.find((a) => !blockedAreaIds.has(a.id))
      if (firstAvailable) {
        setSelectedAreaId(firstAvailable.id.toString())
        toast.error("Esa área ya tiene un pedido hoy. Selecciona otra área.")
      }
    }
  }, [areas, blockedAreaIds, selectedAreaId])
  const handleSubmit = async () => {
    if (!selectedAreaId) {
      toast.error("Por favor selecciona un área")
      return
    }

    if (cart.length === 0) {
      toast.error("El carrito está vacío")
      return
    }

     try {
      setIsSubmitting(true)

      // Final guard: don't allow creating a second order for the same area/day
      const check = await orderService.check({ areaId: selectedAreaId, date: todayDate })
      if (check.exists) {
        toast.error("Ya existe un pedido para esta área hoy. No se puede crear otro.")
        return
      }

      // Get current user to obtain userId
      const currentUser = await usersService.getMe()
      if (!currentUser || !currentUser.id) {
        toast.error("No se pudo obtener la información del usuario")
        return
      }
      
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        unitMeasurementId: item.selectedUnitId,
      }))

      const orderData: CreateOrderDto = {
        userId: currentUser.id,
        areaId: parseInt(selectedAreaId, 10),
        totalAmount: totalPrice,
        status: "created",
        observation: observation || undefined,
        orderItems,
      }

      console.log("[v0] Creando orden con datos:", orderData)

      await createOrderMutation.mutateAsync(orderData)
      
      toast.success("✓ Orden creada exitosamente")
      setBlockedAreaIds((prev) => {
        const next = new Set(prev)
        const asNumber = Number(selectedAreaId)
        if (Number.isFinite(asNumber)) next.add(asNumber)
        return next
      })
      onClearCart()
      setObservation("")
      onClose()
    } catch (error) {
      console.error("[v0] Error creando orden:", error)
      toast.error("Error al crear la orden")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 rounded-xl">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrito ({cart.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length > 0 ? (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li key={item.cartItemId || `${item.id}-${item.selectedUnitId}`} className="rounded-lg border p-3">
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
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => onRemoveItem(item.id, item.selectedUnitId, item.cartItemId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(
                          item.id,
                          item.selectedUnitId,
                          Math.max(0.001, item.quantity - 0.001),
                          item.cartItemId,
                        )
                      }
                      disabled={item.quantity <= 0.001}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-20 text-center">
                      <span className="inline-block text-sm font-semibold px-2 py-1 border rounded">
                        {formatQuantity(item.quantity)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.selectedUnitId, item.quantity + 0.001, item.cartItemId)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center text-gray-600">
              <ShoppingCart className="mb-2 h-10 w-10 opacity-20" />
              <p>No hay productos</p>
            </div>
          )}
        </div>

        <div className="border-t p-6 space-y-4">
          {cart.length > 0 && (
            <>
              {/* Seleccionar Área */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Área de entrega *</label>
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId} disabled={isLoadingAreas || isCheckingAreas}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAreas ? (
                      <div className="p-2 text-center text-sm text-gray-500">Cargando áreas...</div>
                    ) : areas.length > 0 ? (
                      areas.map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()} disabled={blockedAreaIds.has(area.id)}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: area.color }}
                            />
                            <span className="truncate">
                              {area.name}
                              {blockedAreaIds.has(area.id) ? " (bloqueada)" : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">No hay áreas disponibles</div>
                    )}
                  </SelectContent>
                </Select>
                {areas.length > 0 && areas.every((a) => blockedAreaIds.has(a.id)) && (
                  <p className="text-xs text-red-600">Todas tus áreas están bloqueadas hoy por pedidos existentes.</p>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Observaciones</label>
                <Textarea
                  placeholder="Agrega notas especiales para tu orden..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={onClearCart}>
                  Vaciar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !selectedAreaId ||
                    isLoadingAreas ||
                    isCheckingAreas ||
                    (areas.length > 0 && areas.every((a) => blockedAreaIds.has(a.id)))
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Confirmar Orden"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
