"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Package, Plus, X, Trash2, Send, Printer, Download, Loader2 } from "lucide-react"
import { useProductsQuery } from "@/lib/api/hooks/useProduct"
import { useCreateOrderMutation, useCheckOrderQuery } from "@/lib/api/hooks/useOrder"
import { useMeQuery } from "@/lib/api/hooks/useUsers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Suspense } from "react"
import Loading from "@/components/dashboard/sidebar/loading"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Product, ProductUnit } from "@/types/product"
import type { User } from "@/types/users"
import { CreateOrderDto, CreateOrderItemDto, CheckOrderResponse } from "@/types/order"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TableProduct {
  id: string
  product: Product
  quantity: number // Supports decimal values (e.g., 0.25, 0.5, 0.75, 1)
  selectedUnitId: number
  selectedUnit: ProductUnit["unitMeasurement"]
  isEditing: boolean
}

const FastOrdersPage = () => {
  const [tableProducts, setTableProducts] = useState<TableProduct[]>([])
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})
  const [productSearch, setProductSearch] = useState("")
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [areas, setAreas] = useState<Array<{id: number; name: string}>>([])
  const [blockedAreaIds, setBlockedAreaIds] = useState<Set<number>>(new Set())
  const [orderObservations, setOrderObservations] = useState<string>("")
  const [shouldCheckOrder, setShouldCheckOrder] = useState(false)
  const [existingOrder, setExistingOrder] = useState<{id: number; status: string; areaId: number; totalAmount: number} | undefined>(undefined)
  
  // Track orders created in this session to prevent duplicates
  const [sessionOrders, setSessionOrders] = useState<Set<number>>(new Set())
  const createOrderMutation = useCreateOrderMutation()
  
  // Prevent hydration mismatches by only rendering after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current user and products
  const { data: currentUser } = useMeQuery()
  const { data: productsData, isLoading, error } = useProductsQuery()
  const products = useMemo(() => productsData?.items || [], [productsData?.items])
  
  // Get today's date in Peru local time to avoid UTC day rollover
  const todayDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return formatter.format(new Date())
  }, [])

  // Check for existing order when area is selected
  const checkOrderData = useMemo(() => {
    if (!selectedAreaId || !shouldCheckOrder) return null
    const data = {
      areaId: selectedAreaId.toString(),
      date: todayDate // Use stable date
    }
    console.log('[FastOrdersPage] checkOrderData:', data)
    return data
  }, [selectedAreaId, shouldCheckOrder, todayDate])
  
  const { data: existingOrderData, isLoading: isCheckingOrder } = useCheckOrderQuery(
    checkOrderData, 
    shouldCheckOrder
  ) as { data: CheckOrderResponse | undefined, isLoading: boolean }

  // Load areas when user data is available
  useEffect(() => {
    console.log("[FastOrdersPage] currentUser:", currentUser)
    console.log("[FastOrdersPage] User object keys:", currentUser ? Object.keys(currentUser) : 'No user')
    
    // Check if user has areas embedded in the response
    const userAreas = (currentUser as User & {areas?: Array<{id: number; name: string}>})?.areas || []
    const userAreaIds = currentUser?.areaIds || []
    
    console.log("[FastOrdersPage] userAreas (embedded):", userAreas)
    console.log("[FastOrdersPage] userAreaIds:", userAreaIds)
    
    if (userAreas.length > 0) {
      // Use embedded areas if available
      console.log("[FastOrdersPage] Using embedded areas:", userAreas)
      setAreas(userAreas)
      
      // Auto-select first available area if none selected
      if (!selectedAreaId) {
        const firstAvailable = userAreas.find((area) => !blockedAreaIds.has(area.id))
        if (firstAvailable) {
          setSelectedAreaId(firstAvailable.id)
          console.log("[FastOrdersPage] Auto-selected area:", firstAvailable.id)
        }
      }
    } else if (userAreaIds.length > 0) {
      console.log("[FastOrdersPage] User has areaIds but no embedded areas. areaIds:", userAreaIds)
      // Could load areas by IDs here if needed
      const mappedAreas = userAreaIds.map(id => ({ id, name: `Area ${id}` }))
      setAreas(mappedAreas)
      
      if (!selectedAreaId) {
        const firstAvailable = mappedAreas.find((area) => !blockedAreaIds.has(area.id))
        if (firstAvailable) {
          setSelectedAreaId(firstAvailable.id)
        }
      }
    } else {
      console.log("[FastOrdersPage] No areas found for user")
    }
  }, [blockedAreaIds, currentUser, selectedAreaId])

  // Check for existing order when area changes
  useEffect(() => {
    if (selectedAreaId && currentUser?.id) {
      console.log('[FastOrdersPage] Checking for existing order in area:', selectedAreaId)
      // Don't reset existingOrder immediately - let the check response determine it
      setShouldCheckOrder(true)
    } else {
      setShouldCheckOrder(false)
      setExistingOrder(undefined)
    }
  }, [selectedAreaId, currentUser])

  useEffect(() => {
    if (!selectedAreaId) return
    if (!blockedAreaIds.has(selectedAreaId)) return

    const firstAvailable = areas.find((area) => !blockedAreaIds.has(area.id))
    if (firstAvailable) {
      setSelectedAreaId(firstAvailable.id)
    }
  }, [areas, blockedAreaIds, selectedAreaId])
  
  // Handle existing order found
  useEffect(() => {
    if (existingOrderData && shouldCheckOrder) {
      console.log('[FastOrdersPage] Existing order data from check:', existingOrderData)
      console.log('[FastOrdersPage] exists value:', existingOrderData.exists)
      console.log('[FastOrdersPage] order value:', existingOrderData.order)
      
      if (existingOrderData.exists) {
        if (selectedAreaId) {
          setBlockedAreaIds((prev) => {
            const next = new Set(prev)
            next.add(selectedAreaId)
            return next
          })
        }

        // Si existe una orden (con o sin detalles del objeto order)
        if (existingOrderData.order) {
          setExistingOrder(existingOrderData.order)
          
          // Show toast notification about existing order
          if (existingOrderData.order.status === 'created') {
            toast.info(`Ya existe una orden creada hoy para esta área. Puedes agregar más productos.`)
          } else {
            toast.warning(`Ya existe una orden (${existingOrderData.order.status}) para esta área hoy. No se pueden crear más pedidos.`)
          }
        } else {
          // Si existe pero no hay detalles del objeto, crear un objeto genérico para bloquear
          const blockOrder = {
            id: 0,
            status: 'unknown',
            areaId: selectedAreaId || 0,
            totalAmount: 0
          }
          setExistingOrder(blockOrder)
          console.log('[FastOrdersPage] Blocking with generic order:', blockOrder)
          toast.warning(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
        }
        setShouldCheckOrder(false)
      } else if (existingOrderData.exists === false) {
        console.log('[FastOrdersPage] No existing order found according to backend check')
        setShouldCheckOrder(false)
        // Set to undefined to let fallback potentially find it
        setExistingOrder(undefined)
      }
    } else if (!existingOrderData && shouldCheckOrder && !isCheckingOrder) {
      console.log('[FastOrdersPage] No order data returned from check')
      setShouldCheckOrder(false)
    }
  }, [existingOrderData, shouldCheckOrder, isCheckingOrder, selectedAreaId])

  // Handle errors
  if (error) {
    console.error("[FastOrdersPage] Error loading products:", error)

  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter = Create order
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (tableProducts.length > 0 && selectedAreaId) {
          setIsConfirmDialogOpen(true)
        } else {
        
        
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tableProducts, selectedAreaId])

  const productUnitOptions = useMemo(() => {
    return products.flatMap((product) => {
      if (!product.productUnits || product.productUnits.length === 0) return []
      return product.productUnits.map((unit) => ({
        key: `${product.id}__${unit.id}`,
        productId: product.id,
        productUnitId: unit.id,
        label: `${product.name} - ${unit.unitMeasurement.name}`,
      }))
    })
  }, [products])

  const filteredProductUnitOptions = useMemo(() => {
    const search = productSearch.trim().toLowerCase()
    if (!search) return productUnitOptions.slice(0, 30)

    return productUnitOptions
      .filter((option) => option.label.toLowerCase().includes(search))
      .slice(0, 30)
  }, [productSearch, productUnitOptions])

  const handleAddProductByKey = useCallback((key: string) => {
    const selectedOption = productUnitOptions.find((option) => option.key === key)
    if (!selectedOption) return

    const product = products.find((p) => p.id === selectedOption.productId)
    if (!product) return

    const selectedProductUnit = product.productUnits?.find((unit) => unit.id === selectedOption.productUnitId)
    const selectedUnit = selectedProductUnit?.unitMeasurement || { id: 0, name: "Unidad", description: "" }
    const selectedUnitId = selectedProductUnit?.id || 0

    const uniqueId = Math.random().toString(36).slice(2, 11)
    const newTableProduct: TableProduct = {
      id: `${product.id}-${selectedUnitId}-${uniqueId}`,
      product,
      quantity: 0,
      selectedUnitId: selectedUnitId,
      selectedUnit: selectedUnit,
      isEditing: true,
    }

    setTableProducts((prev) => [...prev, newTableProduct])
    setProductSearch("")
  }, [productUnitOptions, products, tableProducts])
  // Update product quantity with 0.25 increments
  const handleUpdateQuantity = useCallback((tableProductId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    // Round to nearest 0.25 increment
    const roundedQuantity = Math.round(newQuantity * 4) / 4

    setTableProducts(prev => prev.map(tp => {
      if (tp.id === tableProductId) {
        return { ...tp, quantity: roundedQuantity }
      }
      return tp
    }))
  }, [])

  const handleQuantityChange = useCallback((tableProductId: string, nextValue: string) => {
    const cleaned = nextValue.replace(/[^0-9.,]/g, "")
    const normalized = cleaned.replace(",", ".")
    const parts = normalized.split(".")
    const normalizedSingle =
      parts.length > 1 ? `${parts.shift()}.${parts.join("")}` : normalized

    setQuantityDrafts((prev) => ({ ...prev, [tableProductId]: cleaned }))
    const parsed = Number.parseFloat(normalizedSingle)
    if (Number.isFinite(parsed)) {
      handleUpdateQuantity(tableProductId, parsed)
    }
  }, [handleUpdateQuantity])

  const handleQuantityBlur = useCallback((tableProductId: string) => {
    setQuantityDrafts((prev) => {
      const current = prev[tableProductId]
      const normalized = (current ?? "").replace(",", ".").trim()
      const parsed = Number.parseFloat(normalized)
      if (!normalized) {
        handleUpdateQuantity(tableProductId, 0)
      } else if (Number.isFinite(parsed)) {
        handleUpdateQuantity(tableProductId, parsed)
      }
      const next = { ...prev }
      delete next[tableProductId]
      return next
    })
  }, [handleUpdateQuantity])

  // Update product unit
  const handleUpdateUnit = useCallback((tableProductId: string, newUnitId: number) => {
    setTableProducts(prev => prev.map(tp => {
      if (tp.id === tableProductId) {
        const selectedUnit = tp.product.productUnits?.find(u => u.id === newUnitId)?.unitMeasurement || tp.selectedUnit
        return { ...tp, selectedUnitId: newUnitId, selectedUnit }
      }
      return tp
    }))
  }, [])

  // Remove product from table
  const handleRemoveProduct = useCallback((tableProductId: string) => {
    setTableProducts(prev => {
      const product = prev.find(tp => tp.id === tableProductId)
      if (product) {
    
      }
      return prev.filter(tp => tp.id !== tableProductId)
    })
  }, [])

  // Clear all products
  const handleClearAll = useCallback(() => {
    if (tableProducts.length === 0) {
  
      return
    }

    if (window.confirm(`¿Deseas eliminar los ${tableProducts.length} productos?`)) {
      setTableProducts([])
  
    }
  }, [tableProducts])

  // Create order
  const handleCreateOrder = async () => {
    if (!selectedAreaId) {
      return
    }

    if (tableProducts.length === 0) {
      return
    }

    if (tableProducts.some((tp) => !tp.quantity || tp.quantity <= 0)) {
      toast.error("No puedes crear un pedido con cantidad 0. Ajusta las cantidades.")
      return
    }

    if (!currentUser?.id) {
  
      return
    }

    if (selectedAreaId && blockedAreaIds.has(selectedAreaId)) {
      toast.error("Esta area ya tiene un pedido hoy y esta bloqueada.")
      return
    }

    // Check if there's already an order for this area in the current session
    if (selectedAreaId && sessionOrders.has(selectedAreaId)) {
      toast.error(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order that's not in 'created' status
    if (existingOrder && existingOrder.status !== 'created') {
      toast.error(`Ya existe una orden con estado "${existingOrder.status}" para esta área hoy. Solo se puede hacer un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order in 'created' status
    if (existingOrder && existingOrder.status === 'created') {
      toast.info(`Se agregarán los productos a la orden existente en esta área.`)
    }
    
    // If there's an existing order with status 'unknown' (when backend only returns exists: true)
    if (existingOrder && existingOrder.status === 'unknown') {
      toast.error(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order in 'created' status
    if (existingOrder && existingOrder.status === 'created') {
  
    }
    
    // If there's an existing order with status 'unknown' (when backend only returns exists: true)
    if (existingOrder && existingOrder.status === 'unknown') {
  
      return
    }

    setIsCreatingOrder(true)
    try {
      // Crear orderItems con la estructura exacta que espera el backend
      const orderItems = tableProducts.map(tp => {
        // IMPORTANT: Use unitMeasurementId from the selected unit, not the ProductUnit id
        const selectedUnit = tp.product.productUnits?.find(u => u.id === tp.selectedUnitId);
        const unitMeasurementId = selectedUnit?.unitMeasurementId || tp.selectedUnitId;
        
        console.log(`[FastOrdersPage] Product ${tp.product.name}:`, {
          productUnitId: tp.selectedUnitId,
          unitMeasurementId: unitMeasurementId,
          selectedUnit: selectedUnit
        });
        
        const item: CreateOrderItemDto = {
          productId: tp.product.id,
          quantity: tp.quantity,
          price: tp.product.price || 0,
          unitMeasurementId: unitMeasurementId,
        };
        return item;
      });

      const orderData: CreateOrderDto = {
        userId: currentUser.id, // Validado arriba, así que siempre existe
        areaId: selectedAreaId,
        totalAmount: tableProducts.reduce((sum, tp) => sum + (tp.quantity * (tp.product.price || 0)), 0),
        status: "created",
        observation: orderObservations.trim() || undefined,
        orderItems: orderItems,
      };

      console.log('[FastOrdersPage] Enviando orderData:', JSON.stringify(orderData, null, 2))
      
      const result = await createOrderMutation.mutateAsync(orderData)
      
      // Add this area to session orders to prevent duplicates
      if (result && selectedAreaId) {
        setSessionOrders(prev => new Set([...prev, selectedAreaId]))
        setBlockedAreaIds((prev) => {
          const next = new Set(prev)
          next.add(selectedAreaId)
          return next
        })
        console.log('[FastOrdersPage] Added area to session orders:', selectedAreaId)
      }
  
       
// Reset form
      setTableProducts([])
      setOrderObservations("")
      setIsConfirmDialogOpen(false)
      setExistingOrder(selectedAreaId ? {
        id: 0,
        status: "unknown",
        areaId: selectedAreaId,
        totalAmount: 0,
      } : undefined)
      setShouldCheckOrder(false) // Reset order check

      if (selectedAreaId) {
        const nextArea = areas.find((area) => area.id !== selectedAreaId && !blockedAreaIds.has(area.id))
        if (nextArea) {
          setSelectedAreaId(nextArea.id)
        }
      }
      
    } catch (error: unknown) {
      console.error("Error creating order:", error)
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const selectedAreaName = useMemo(
    () => areas.find((area) => area.id === selectedAreaId)?.name ?? "",
    [areas, selectedAreaId],
  )

  const handlePrint = useCallback(async () => {
    if (!selectedAreaId) {
      toast.error("Selecciona un area para imprimir")
      return
    }

    if (tableProducts.length === 0) {
      toast.error("No hay productos para imprimir")
      return
    }

    try {
      setIsPrinting(true)

      const payload = {
        areaName: selectedAreaName || `Area ${selectedAreaId}`,
        observation: orderObservations || "",
        items: tableProducts.map((tp) => ({
          productName: tp.product.name,
          quantity: tp.quantity,
          unitName: tp.selectedUnit.name,
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar impresion")
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
    } catch (error) {
      console.error("[FastOrdersPage] Error printing order:", error)
      toast.error("Error al generar impresion")
    } finally {
      setIsPrinting(false)
    }
  }, [orderObservations, selectedAreaId, selectedAreaName, tableProducts])

  const handleDownload = useCallback(async () => {
    if (!selectedAreaId) {
      toast.error("Selecciona un area para descargar")
      return
    }

    if (tableProducts.length === 0) {
      toast.error("No hay productos para descargar")
      return
    }

    try {
      setIsDownloading(true)

      const payload = {
        areaName: selectedAreaName || `Area ${selectedAreaId}`,
        observation: orderObservations || "",
        items: tableProducts.map((tp) => ({
          productName: tp.product.name,
          quantity: tp.quantity,
          unitName: tp.selectedUnit.name,
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar descarga")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-rapido-${selectedAreaId}-${todayDate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (error) {
      console.error("[FastOrdersPage] Error downloading order:", error)
      toast.error("Error al descargar PDF")
    } finally {
      setIsDownloading(false)
    }
  }, [orderObservations, selectedAreaId, selectedAreaName, tableProducts, todayDate])
  const stats = useMemo(() => ({
    totalProducts: tableProducts.length,
    totalItems: tableProducts.reduce((sum, tp) => sum + tp.quantity, 0),
    totalPrice: 0 // Price calculation removed from frontend
  }), [tableProducts])

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Pedidos</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pedidos rapidos</h1>
                <p className="text-sm text-gray-500">Registra pedidos de forma rapida por area.</p>
              </div>
              {stats.totalProducts > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {stats.totalProducts > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="h-10 px-4"
                >
                  Limpiar Todo
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {/* Area and Product Selection */}
          <div className="mb-6 grid gap-5 grid-cols-1 sm:grid-cols-2">
            {/* Area Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Area</label>
              <Select value={selectedAreaId?.toString()} onValueChange={(value) => setSelectedAreaId(parseInt(value))}>
                <SelectTrigger className="rounded-lg border-gray-300">
                  <SelectValue placeholder="Selecciona un área..." />
                </SelectTrigger>
                <SelectContent>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()} disabled={blockedAreaIds.has(area.id)}>
                        {area.name}{blockedAreaIds.has(area.id) ? " (bloqueada)" : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {currentUser ? "Cargando áreas..." : "Esperando datos del usuario..."}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedAreaId && blockedAreaIds.has(selectedAreaId) && (
                <p className="mt-2 text-xs text-red-600">Bloqueada: esta area ya tiene pedido hoy.</p>
              )}
              {/* Order Status */}
              {existingOrder && (
                <div className={`mt-2 p-2 rounded-md text-xs ${
                  existingOrder.status === 'created' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="font-medium">
                    {existingOrder.status === 'created' ? '📝 Orden abierta' : 
                     existingOrder.status === 'unknown' ? '🚫 Pedido existente' : '🚫 Orden cerrada'}
                  </div>
                  <div>
                    Estado: <span className="font-medium">
                      {existingOrder.status === 'created' ? 'Abierta' :
                       existingOrder.status === 'unknown' ? 'Existente' : existingOrder.status}
                    </span>
                  </div>
                  {existingOrder.id !== 0 && (
                    <div>
                      ID: <span className="font-medium">#{existingOrder.id}</span>
                    </div>
                  )}
                  {existingOrder.status === 'created' ? (
                    <div>Puedes agregar más productos a esta orden</div>
                  ) : (
                    <div>No se pueden crear más pedidos hoy para esta área</div>
                  )}
                </div>
              )}
              
              {/* Checking Status */}
              {isCheckingOrder && (
                <div className="mt-2 p-2 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="font-medium">🔍 Verificando pedidos existentes...</div>
                </div>
              )}
               
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <label htmlFor="fast-product-search" className="text-sm font-semibold text-gray-700 block mb-3">
                Buscar producto
              </label>
              <div className="space-y-3">
                <Input
                  id="fast-product-search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre producto - unidad (agrega con clic)"
                  className="rounded-lg border-gray-300"
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {filteredProductUnitOptions.length > 0 ? (
                    filteredProductUnitOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleAddProductByKey(option.key)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{option.label}</span>
                        <Plus className="h-4 w-4 flex-shrink-0 text-green-600" />
                      </button>
                    ))
                  ) : productSearch.trim().length > 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">No hay coincidencias</div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500">Escribe para filtrar productos</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Producto
                    </th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Presentación
                     </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cantidad
                      </th>
                     <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Acciones
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-8 bg-gray-300 rounded w-16 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-8 bg-gray-300 rounded w-16 mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : tableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-4 p-3 bg-gray-100 rounded-full">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Tabla vacía</h3>
                          <p className="text-gray-600 mt-2">Busca productos para agregarlos automáticamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableProducts.map((tableProduct) => {
                      const { product, quantity, id, selectedUnit, isEditing } = tableProduct
                      const draftValue = quantityDrafts[id]
                      const displayQuantity = Number.isFinite(quantity) ? quantity : 0
                      const inputValue = draftValue ?? String(displayQuantity)

                      return (
                        <tr key={id} className="hover:bg-gray-50 transition-colors duration-150">
                          {/* Producto */}
                          <td className="px-6 py-4">
                             <div>
                               <div className="text-sm font-medium text-gray-900">{product.name}</div>
                               <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                             </div>
                          </td>
                          
                          {/* Presentación */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <Select
                                value={tableProduct.selectedUnitId.toString()}
                                onValueChange={(value) => handleUpdateUnit(id, parseInt(value))}
                              >
                                <SelectTrigger className="h-10 w-48 border border-gray-300 bg-white rounded-lg font-semibold">
                                  <SelectValue placeholder="Selecciona presentación" />
                                </SelectTrigger>
                                <SelectContent>
                                  {product.productUnits?.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                      {unit.unitMeasurement.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="inline-block">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-1.5 text-sm font-semibold rounded-lg cursor-default">
                                  {selectedUnit.name}
                                </Badge>
                              </div>
                            )}
                          </td>
                          
                           {/* Cantidad */}
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                               <Input
                                 type="text"
                                 inputMode="decimal"
                                 pattern="^\\d*(?:[\\.,]\\d+)?$"
                                 value={inputValue}
                                 onChange={(e) => handleQuantityChange(id, e.target.value)}
                                 onBlur={() => handleQuantityBlur(id)}
                                 className="w-20 h-8 text-center border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30"
                               />
                               <span className="text-sm text-gray-600 min-w-fit">
                                 {selectedUnit.name}
                               </span>
                             </div>
                           </td>
                           
                          {/* Acciones */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveProduct(id)}
                                className="h-8 px-3 text-red-700 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 bg-red-50 font-medium"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200 mb-2" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 mb-3" />
                    <div className="h-9 w-full rounded bg-gray-200" />
                  </div>
                ))
              ) : tableProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mb-3 inline-flex rounded-full bg-gray-100 p-3">
                    <Package className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Tabla vacia</h3>
                  <p className="mt-1 text-sm text-gray-600">Busca productos para agregarlos automaticamente</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    <span>Producto</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-center">Accion</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {tableProducts.map((tableProduct) => {
                      const { product, quantity, id, selectedUnit } = tableProduct
                      const draftValue = quantityDrafts[id]
                      const displayQuantity = Number.isFinite(quantity) ? quantity : 0
                      const inputValue = draftValue ?? String(displayQuantity)
                      return (
                        <div key={id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                            <p className="text-[11px] text-gray-500">{selectedUnit.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="^\\d*(?:[\\.,]\\d+)?$"
                              value={inputValue}
                              onChange={(e) => handleQuantityChange(id, e.target.value)}
                              onBlur={() => handleQuantityBlur(id)}
                              className="w-20 h-8 text-center border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(id)}
                              className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Summary */}
          {tableProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold">Productos:</span> <span className="font-semibold text-lg text-green-600">{stats.totalProducts}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-bold">Unidades:</span> <span className="font-semibold text-lg text-green-600">{stats.totalItems}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrint}
                      disabled={!selectedAreaId || tableProducts.length === 0 || isPrinting}
                      aria-label="Imprimir pedido"
                      title="Imprimir pedido"
                    >
                      {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownload}
                      disabled={!selectedAreaId || tableProducts.length === 0 || isDownloading}
                      aria-label="Descargar PDF"
                      title="Descargar PDF"
                    >
                      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => setIsConfirmDialogOpen(true)}
                      disabled={
                        !selectedAreaId ||
                        isCreatingOrder ||
                        (selectedAreaId ? blockedAreaIds.has(selectedAreaId) : false) ||
                        (existingOrder && existingOrder.status !== 'created')
                      }
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCreatingOrder 
                        ? "Procesando..." 
                        : (existingOrder && existingOrder.status === 'created' ? "Agregar a Orden" : "Crear Orden")
                      }
                    </Button>
                   <Badge variant="outline" className="text-xs bg-gray-800 text-white border-gray-700 font-mono">
                     ⌘ Ctrl+Enter
                   </Badge>
                 </div>
              </div>
            </div>
          )}
        </main>

        {/* Create Order Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle className="text-xl font-bold">
                 Confirmar Pedido
               </DialogTitle>
               <DialogDescription>
                 {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""} agregado{stats.totalProducts !== 1 ? "s" : ""}
               </DialogDescription>
             </DialogHeader>
            
             <div className="space-y-4">
               <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                 <span className="font-semibold text-gray-700">Area: </span>
                 <span className="text-gray-800">{selectedAreaName || "Sin area seleccionada"}</span>
               </div>
               <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                 <p className="text-sm font-semibold text-gray-700 mb-2">Resumen:</p>
                 <div className="space-y-2 max-h-40 overflow-y-auto">
                   {tableProducts.map((tp) => (
                     <div key={tp.id} className="flex justify-between text-sm">
                       <span className="text-gray-700">{tp.product.name}</span>
                       <span className="font-semibold">{tp.quantity % 1 === 0 ? tp.quantity : tp.quantity.toFixed(2)} {tp.selectedUnit.name}</span>
                     </div>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="text-sm font-semibold text-gray-700 block mb-2">
                   Observaciones (opcional)
                 </label>
                 <textarea
                   value={orderObservations}
                   onChange={(e) => setOrderObservations(e.target.value)}
                   placeholder="Notas especiales..."
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                   rows={2}
                 />
               </div>
             </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
                disabled={!selectedAreaId || tableProducts.length === 0 || isPrinting}
                aria-label="Imprimir pedido"
                title="Imprimir pedido"
              >
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={!selectedAreaId || tableProducts.length === 0 || isDownloading}
                aria-label="Descargar PDF"
                title="Descargar PDF"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isCreatingOrder}
              >
                Cancelar
              </Button>
               <Button
                 onClick={handleCreateOrder}
                 disabled={
                   isCreatingOrder ||
                   !selectedAreaId ||
                   (selectedAreaId ? blockedAreaIds.has(selectedAreaId) : false)
                 }
                 className="bg-green-600 hover:bg-green-700 text-white"
               >
                 {isCreatingOrder ? "Creando..." : "Crear Pedido"}
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}

export default FastOrdersPage










