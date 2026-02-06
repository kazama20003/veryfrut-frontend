"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Package, Plus, X, Trash2, Edit, Save, XCircle, Send, Users } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useProductsQuery } from "@/lib/api/hooks/useProduct"
import { useCreateOrderMutation, useCheckOrderQuery, useOrdersQuery } from "@/lib/api/hooks/useOrder"
import { useUsersQuery } from "@/lib/api/hooks/useUsers"
import { useAreasQuery } from "@/lib/api/hooks/useArea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Suspense } from "react"
import Loading from "@/components/dashboard/sidebar/loading"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SimpleProductCombobox } from "@/components/users/simple-product-combobox"
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
  selectedUnit: ProductUnit['unitMeasurement']
  isEditing: boolean
}

const AdminFastOrdersPage = () => {
  const [tableProducts, setTableProducts] = useState<TableProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>()
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [areas, setAreas] = useState<Array<{id: number; name: string}>>([])
  const [orderObservations, setOrderObservations] = useState<string>("")
  const [shouldCheckOrder, setShouldCheckOrder] = useState(false)
  const [existingOrder, setExistingOrder] = useState<{id: number; status: string; areaId: number; totalAmount: number} | undefined>(undefined)
  
  // Track orders created in this session to prevent duplicates
  const [sessionOrders, setSessionOrders] = useState<Set<number>>(new Set())
  const comboboxRef = useRef<HTMLDivElement>(null)
  const createOrderMutation = useCreateOrderMutation()
  
  // Prevent hydration mismatches by only rendering after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get all users, products, and areas for admin
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery()
  const { data: productsData, isLoading, error } = useProductsQuery({ page: 1, limit: 100 })
  const { data: allAreas = [] } = useAreasQuery()
  
  const users = useMemo(() => Array.isArray(usersData) ? usersData : [], [usersData])
  const products = useMemo(() => productsData?.items || [], [productsData?.items])
  
  // Get today's date once to avoid hydration issues
  const todayDate = useMemo(() => {
    // Use a stable date format for hydration
    const now = new Date()
    return now.toISOString().split('T')[0]
  }, [])

  // Get selected user details
  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId)
  }, [users, selectedUserId])

  // Load areas when user changes
  useEffect(() => {
    console.log("[AdminFastOrdersPage] selectedUserId:", selectedUserId)
    console.log("[AdminFastOrdersPage] selectedUser:", selectedUser)

    let nextAreas: Array<{ id: number; name: string }> = []

    if (selectedUser) {
      const embeddedAreas = (selectedUser as User & { areas?: Array<{ id: number; name: string }> })?.areas || []
      const userAreaIds = selectedUser.areaIds || []

      console.log("[AdminFastOrdersPage] userAreas (embedded):", embeddedAreas)
      console.log("[AdminFastOrdersPage] userAreaIds:", userAreaIds)

      if (embeddedAreas.length > 0) {
        nextAreas = embeddedAreas
      } else if (userAreaIds.length > 0) {
        nextAreas = allAreas.filter((area) => userAreaIds.includes(area.id))
      }
    }

    setAreas((prev) => {
      const sameLength = prev.length === nextAreas.length
      const sameValues = sameLength && prev.every((item, index) => item.id === nextAreas[index]?.id && item.name === nextAreas[index]?.name)
      return sameValues ? prev : nextAreas
    })

    setSelectedAreaId((prev) => {
      if (!nextAreas.length) return undefined
      if (prev && nextAreas.some((area) => area.id === prev)) return prev
      return nextAreas[0]?.id
    })
  }, [allAreas, selectedUser, selectedUserId])

  // Check for existing order when user and area are selected
  const checkOrderData = useMemo(() => {
    if (!selectedAreaId || !selectedUserId || !shouldCheckOrder) return null
    const data = {
      areaId: selectedAreaId.toString(),
      date: todayDate, // Use stable date
      userId: selectedUserId.toString() // Include userId for admin checks
    }
    console.log('[AdminFastOrdersPage] checkOrderData:', data)
    return data
  }, [selectedAreaId, selectedUserId, shouldCheckOrder, todayDate])
  
  const { data: existingOrderData, isLoading: isCheckingOrder } = useCheckOrderQuery(
    checkOrderData, 
    shouldCheckOrder
  ) as { data: CheckOrderResponse | undefined, isLoading: boolean }

  // Fallback: Check orders list if check endpoint doesn't work properly
  const { data: ordersData } = useOrdersQuery({
    userId: selectedUserId,
    areaId: selectedAreaId,
    page: 1,
    limit: 10
  })

  // Check for existing order when user or area changes
  useEffect(() => {
    if (selectedAreaId && selectedUserId) {
      console.log('[AdminFastOrdersPage] Checking for existing order for user:', selectedUserId, 'in area:', selectedAreaId)
      // Don't reset existingOrder immediately - let the check response determine it
      setShouldCheckOrder(true)
    } else {
      setShouldCheckOrder(false)
      setExistingOrder(undefined)
    }
  }, [selectedAreaId, selectedUserId])
  
  // Handle existing order found
  useEffect(() => {
    if (existingOrderData && shouldCheckOrder) {
      console.log('[AdminFastOrdersPage] Existing order data from check:', existingOrderData)
      console.log('[AdminFastOrdersPage] exists value:', existingOrderData.exists)
      console.log('[AdminFastOrdersPage] order value:', existingOrderData.order)
      
      if (existingOrderData.exists) {
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
          console.log('[AdminFastOrdersPage] Blocking with generic order:', blockOrder)
          toast.warning(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
        }
        setShouldCheckOrder(false)
      } else if (existingOrderData.exists === false) {
        console.log('[AdminFastOrdersPage] No existing order found according to backend check')
        setShouldCheckOrder(false)
        // Set to undefined to let fallback potentially find it
        setExistingOrder(undefined)
      }
    } else if (!existingOrderData && shouldCheckOrder && !isCheckingOrder) {
      console.log('[AdminFastOrdersPage] No order data returned from check')
      setShouldCheckOrder(false)
    }
  }, [existingOrderData, shouldCheckOrder, isCheckingOrder, selectedAreaId, selectedUserId])

  // Fallback: Check orders list if check endpoint doesn't work properly
  useEffect(() => {
    // Only run fallback after check is complete and no order was found
    if (selectedAreaId && selectedUserId && ordersData && !shouldCheckOrder && !existingOrder && !isCheckingOrder) {
      console.log('[AdminFastOrdersPage] Running fallback check with orders list:', ordersData)
      
      // Look for orders created today for this user and area
      const todayOrders = ordersData.items?.filter(order => {
        const orderDate = new Date(order.createdAt || '').toISOString().split('T')[0]
        const matchesArea = order.areaId === selectedAreaId
        const matchesUser = order.userId === selectedUserId
        const matchesToday = orderDate === todayDate
        return matchesArea && matchesUser && matchesToday
      }) || []
      
      console.log('[AdminFastOrdersPage] Today orders for user and area:', todayOrders)
      
      if (todayOrders.length > 0) {
        // Use the most recent order
        const latestOrder = todayOrders[0]
        console.log('[AdminFastOrdersPage] Found existing order via fallback:', latestOrder)
        
        setExistingOrder(latestOrder)
        
        if (latestOrder.status === 'created') {
          toast.info(`Ya existe una orden creada hoy para esta área. Puedes agregar más productos.`)
        } else {
          toast.warning(`Ya existe una orden (${latestOrder.status}) para esta área hoy. No se pueden crear más pedidos.`)
        }
      } else {
        setExistingOrder(undefined)
      }
    }
  }, [ordersData, selectedAreaId, selectedUserId, shouldCheckOrder, existingOrder, todayDate, isCheckingOrder])

  // Handle errors
  if (error) {
    console.error("[AdminFastOrdersPage] Error loading products:", error)
  }

  // Auto-focus user selection on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const userSelect = document.querySelector('[data-testid="user-select"]') as HTMLSelectElement
      if (userSelect) {
        userSelect.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-focus combobox when area is selected
  useEffect(() => {
    if (selectedAreaId) {
      const timer = setTimeout(() => {
        const searchInput = comboboxRef.current?.querySelector("input")
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedAreaId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter = Create order
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (tableProducts.length > 0 && selectedUserId && selectedAreaId) {
          setIsConfirmDialogOpen(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tableProducts, selectedUserId, selectedAreaId])

  // Handle product selection - adds to table automatically
  const handleProductSelect = useCallback((productId: number) => {
    console.log("[AdminFastOrdersPage] handleProductSelect called with:", productId)
    setSelectedProductId(undefined)

    const foundProduct = products.find(p => p.id === productId)
    if (!foundProduct) {
      return
    }

    // Stock validation removed from frontend

    // Validate that product has units available
    if (!foundProduct.productUnits || foundProduct.productUnits.length === 0) {
      return
    }

    // If product has only one unit, use it directly, otherwise set to editing mode
    const hasOnlyOneUnit = foundProduct.productUnits?.length === 1
    const defaultUnit = foundProduct.productUnits?.[0]?.unitMeasurement || { id: 0, name: "Unidad", description: "" }
    const defaultUnitId = foundProduct.productUnits?.[0]?.id || 0

    // For products with multiple units/variations, require user to select the specific one
    if (!hasOnlyOneUnit) {
      const existingProductsWithDifferentUnits = tableProducts.filter(tp => tp.product.id === foundProduct.id)
      if (existingProductsWithDifferentUnits.length > 0) {
        // Product already in table with different unit - allow to add another variation
        console.log("[AdminFastOrdersPage] Product already in table with different variation - allowing to add")
      }
    }

    // Check if product with the SAME presentation already exists - this is not allowed
    const existingProduct = tableProducts.find(tp => 
      tp.product.id === foundProduct.id && tp.selectedUnitId === defaultUnitId
    )
    if (existingProduct) {
      console.log("[AdminFastOrdersPage] Product with same presentation already exists - blocking")
      return
    }

    // Generate a stable ID to avoid hydration issues
    const uniqueId = Math.random().toString(36).substr(2, 9)
    const newTableProduct: TableProduct = {
      id: `${foundProduct.id}-${defaultUnitId}-${uniqueId}`,
      product: foundProduct,
      quantity: 1,
      selectedUnitId: defaultUnitId,
      selectedUnit: defaultUnit,
      isEditing: !hasOnlyOneUnit // Start in edit mode if multiple units available
    }

    setTableProducts(prev => [...prev, newTableProduct])

    // Re-focus combobox for next product
    setTimeout(() => {
      const searchInput = comboboxRef.current?.querySelector("input")
      if (searchInput) {
        searchInput.focus()
        searchInput.value = ""
      }
    }, 100)
  }, [products, tableProducts])

  // Update product quantity with 0.25 increments
  const handleUpdateQuantity = useCallback((tableProductId: string, newQuantity: number) => {
    if (newQuantity < 0.25) return

    // Round to nearest 0.25 increment
    const roundedQuantity = Math.round(newQuantity * 4) / 4

    setTableProducts(prev => prev.map(tp => {
      if (tp.id === tableProductId) {
        return { ...tp, quantity: roundedQuantity }
      }
      return tp
    }))
  }, [])

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

  // Toggle edit mode
  const handleToggleEdit = useCallback((tableProductId: string, isEditing: boolean) => {
    setTableProducts(prev => prev.map(tp => 
      tp.id === tableProductId ? { ...tp, isEditing } : tp
    ))
  }, [])

  // Remove product from table
  const handleRemoveProduct = useCallback((tableProductId: string) => {
    setTableProducts(prev => prev.filter(tp => tp.id !== tableProductId))
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
    if (!selectedUserId || !selectedAreaId) {
      toast.error("Por favor selecciona un usuario y un área")
      return
    }

    if (tableProducts.length === 0) {
      toast.error("Por favor agrega al menos un producto")
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

    setIsCreatingOrder(true)
    try {
      // Crear orderItems con la estructura exacta que espera el backend
      const orderItems = tableProducts.map(tp => {
        // IMPORTANT: Use unitMeasurementId from the selected unit, not the ProductUnit id
        const selectedUnit = tp.product.productUnits?.find(u => u.id === tp.selectedUnitId);
        const unitMeasurementId = selectedUnit?.unitMeasurementId || tp.selectedUnitId;
        
        console.log(`[AdminFastOrdersPage] Product ${tp.product.name}:`, {
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
        userId: selectedUserId,
        areaId: selectedAreaId,
        totalAmount: tableProducts.reduce((sum, tp) => sum + (tp.quantity * (tp.product.price || 0)), 0),
        status: 'created',
        observation: orderObservations.trim() || undefined,
        orderItems: orderItems,
      };

      console.log('[AdminFastOrdersPage] Enviando orderData:', JSON.stringify(orderData, null, 2))
      
      const result = await createOrderMutation.mutateAsync(orderData)
      
      // Add this area to session orders to prevent duplicates
      if (result && selectedAreaId) {
        setSessionOrders(prev => new Set([...prev, selectedAreaId]))
        console.log('[AdminFastOrdersPage] Added area to session orders:', selectedAreaId)
      }
       
      // Reset form
      setTableProducts([])
      setOrderObservations("")
      setIsConfirmDialogOpen(false)
      setExistingOrder(undefined)
      setShouldCheckOrder(false) // Reset order check
      
      // Re-focus user select for next order
      setTimeout(() => {
        const userSelect = document.querySelector('[data-testid="user-select"]') as HTMLSelectElement
        if (userSelect) {
          userSelect.focus()
        }
      }, 200)
    } catch (error: unknown) {
      console.error("Error creating order:", error)
      toast.error("Error al crear el pedido. Por favor intenta de nuevo.")
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const stats = useMemo(() => ({
    totalProducts: tableProducts.length,
    totalItems: tableProducts.reduce((sum, tp) => sum + tp.quantity, 0),
    totalPrice: 0 // Price calculation removed from frontend
  }), [tableProducts])

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Ordenes</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nueva orden</h1>
                <p className="text-sm text-gray-500">Crea pedidos para usuarios y areas.</p>
              </div>
              {stats.totalProducts > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="h-10 px-4 gap-2">
                <Link href="/dashboard/orders">
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Link>
              </Button>
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
          {/* User, Area and Product Selection */}
          <div className="mb-6 grid gap-5 grid-cols-1 sm:grid-cols-3">
            {/* User Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Usuario
              </label>
              <Select 
                value={selectedUserId?.toString()} 
                onValueChange={(value) => {
                  setSelectedUserId(parseInt(value))
                  setSelectedAreaId(undefined) // Reset area when user changes
                  setExistingOrder(undefined) // Reset existing order
                }}
              >
                <SelectTrigger className="rounded-lg border-gray-300" data-testid="user-select">
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Cargando usuarios...
                    </div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No hay usuarios disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Area Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Área</label>
              <Select 
                value={selectedAreaId?.toString()} 
                onValueChange={(value) => setSelectedAreaId(parseInt(value))}
                disabled={!selectedUserId}
              >
                <SelectTrigger className="rounded-lg border-gray-300">
                  <SelectValue placeholder={selectedUserId ? "Selecciona un área..." : "Selecciona un usuario primero..."} />
                </SelectTrigger>
                <SelectContent>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {selectedUserId ? "No hay áreas disponibles" : "Selecciona un usuario primero"}
                    </div>
                  )}
                </SelectContent>
              </Select>
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
            <div ref={comboboxRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Producto</label>
              <SimpleProductCombobox
                products={products}
                selectedProductId={selectedProductId}
                onProductSelect={handleProductSelect}
                placeholder="Busca un producto..."
              />
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> o selecciona para agregar
              </p>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
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
                          <p className="text-gray-600 mt-2">Selecciona un usuario, un área y busca productos para agregarlos automáticamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableProducts.map((tableProduct) => {
                      const { product, quantity, id, selectedUnit, isEditing } = tableProduct

                      return (
                        <tr key={id} className="hover:bg-muted/40 transition-colors">
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
                                <SelectTrigger className="h-10 w-48 border border-gray-300 bg-white rounded-lg font-medium">
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
                                <Badge className="bg-muted text-foreground px-4 py-1.5 text-sm font-medium rounded-lg cursor-default">
                                  {selectedUnit.name}
                                </Badge>
                              </div>
                            )}
                          </td>
                          
                           {/* Cantidad */}
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                               {isEditing ? (
                                 <div className="flex items-center gap-2">
                                   <Button
                                     variant="outline"
                                     size="icon"
                                     onClick={() => handleUpdateQuantity(id, quantity - 0.25)}
                                     disabled={quantity <= 0.25}
                                     className="h-7 w-7"
                                   >
                                     <X className="h-3 w-3 rotate-45" />
                                   </Button>
                                   <Input
                                     type="number"
                                     step={0.25}
                                     value={quantity}
                                     onChange={(e) => handleUpdateQuantity(id, parseFloat(e.target.value) || 0.25)}
                                     className="w-16 h-8 text-center"
                                     min={0.25}
                                     max={product.stock}
                                   />
                                   <Button
                                     variant="outline"
                                     size="icon"
                                     onClick={() => handleUpdateQuantity(id, quantity + 0.25)}
                                     className="h-7 w-7"
                                   >
                                     <Plus className="h-3 w-3" />
                                   </Button>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1">
                                   <Button
                                     variant="outline"
                                     size="icon"
                                     onClick={() => handleUpdateQuantity(id, quantity - 0.25)}
                                     disabled={quantity <= 0.25}
                                     className="h-7 w-7"
                                   >
                                     <X className="h-3 w-3 rotate-45" />
                                   </Button>
                                   <span className="w-12 text-center text-sm font-medium">
                                     {quantity % 1 === 0 ? quantity : quantity.toFixed(2)}
                                   </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleUpdateQuantity(id, quantity + 0.25)}
                                      className="h-7 w-7"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                 </div>
                               )}
                               <span className="text-sm text-gray-600 min-w-fit">
                                 {selectedUnit.name}
                               </span>
                             </div>
                           </td>
                           
                           {/* Acciones */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleEdit(id, false)}
                                    className="h-8 px-3 text-green-700 hover:text-green-800 hover:bg-green-100 border-green-200 bg-green-50 font-medium"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Guardar
                                  </Button>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleToggleEdit(id, false)}
                                     className="h-8 px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-200"
                                   >
                                     <XCircle className="h-4 w-4 mr-1" />
                                     Cancelar
                                   </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleEdit(id, true)}
                                    className="h-8 px-3 text-blue-700 hover:text-blue-800 hover:bg-blue-100 border-blue-200 bg-blue-50 font-medium"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveProduct(id)}
                                    className="h-8 px-3 text-red-700 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 bg-red-50 font-medium"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Eliminar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {tableProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold">Productos:</span> <span className="font-semibold text-lg text-primary">{stats.totalProducts}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="font-bold">Unidades:</span> <span className="font-semibold text-lg text-primary">{stats.totalItems}</span>
                  {selectedUser && (
                    <>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="font-bold">Usuario:</span> <span className="font-semibold text-lg text-primary">{selectedUser.firstName} {selectedUser.lastName}</span>
                    </>
                  )}
                </div>
                 <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setIsConfirmDialogOpen(true)}
                      disabled={!selectedUserId || !selectedAreaId || isCreatingOrder || (existingOrder && existingOrder.status !== 'created')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg"
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
                  {selectedUser && (
                    <span> para {selectedUser.firstName} {selectedUser.lastName}</span>
                  )}
                </DialogDescription>
              </DialogHeader>
             
              <div className="space-y-4">
                {selectedUser && (
                  <div className="bg-muted/40 rounded-lg p-3 border border-border">
                    <p className="text-sm font-semibold text-foreground mb-1">Pedido para:</p>
                    <p className="text-sm text-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                    {areas.find(a => a.id === selectedAreaId) && (
                      <p className="text-sm text-muted-foreground">Área: {areas.find(a => a.id === selectedAreaId)?.name}</p>
                    )}
                  </div>
                )}

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                  />
                </div>
              </div>

             <DialogFooter className="gap-2">
               <Button
                 variant="outline"
                 onClick={() => setIsConfirmDialogOpen(false)}
                 disabled={isCreatingOrder}
               >
                 Cancelar
               </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
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

export default AdminFastOrdersPage



