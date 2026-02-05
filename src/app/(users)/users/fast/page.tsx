"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Package, Plus, X, Trash2, Edit, Save, XCircle, Send } from "lucide-react"
import { useProductsQuery } from "@/lib/api/hooks/useProduct"
import { useCreateOrderMutation, useCheckOrderQuery, useOrdersQuery } from "@/lib/api/hooks/useOrder"
import { useMeQuery } from "@/lib/api/hooks/useUsers"
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

const FastOrdersPage = () => {
  const [tableProducts, setTableProducts] = useState<TableProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>()
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

  // Get current user and products
  const { data: currentUser } = useMeQuery()
  const { data: productsData, isLoading, error } = useProductsQuery()
  const products = useMemo(() => productsData?.items || [], [productsData?.items])
  
  // Get today's date once to avoid hydration issues
  const todayDate = useMemo(() => {
    // Use a stable date format for hydration
    const now = new Date()
    return now.toISOString().split('T')[0]
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

  // Fallback: Check orders list if check endpoint doesn't work properly
  const { data: ordersData } = useOrdersQuery({
    areaId: selectedAreaId,
    page: 1,
    limit: 10
  })

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
      
      // Auto-select the first area if none selected
      if (!selectedAreaId && userAreas[0]) {
        setSelectedAreaId(userAreas[0].id)
        console.log("[FastOrdersPage] Auto-selected area:", userAreas[0].id)
      }
    } else if (userAreaIds.length > 0) {
      console.log("[FastOrdersPage] User has areaIds but no embedded areas. areaIds:", userAreaIds)
      // Could load areas by IDs here if needed
      setAreas(userAreaIds.map(id => ({ id, name: `Área ${id}` })))
      
      if (!selectedAreaId && userAreaIds[0]) {
        setSelectedAreaId(userAreaIds[0])
      }
    } else {
      console.log("[FastOrdersPage] No areas found for user")
    }
  }, [currentUser, selectedAreaId])

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
  
  // Handle existing order found
  useEffect(() => {
    if (existingOrderData && shouldCheckOrder) {
      console.log('[FastOrdersPage] Existing order data from check:', existingOrderData)
      console.log('[FastOrdersPage] exists value:', existingOrderData.exists)
      console.log('[FastOrdersPage] order value:', existingOrderData.order)
      
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

  // Fallback: Check orders list if check endpoint doesn't work properly
  useEffect(() => {
    // Only run fallback after check is complete and no order was found
    if (selectedAreaId && ordersData && !shouldCheckOrder && !existingOrder && !isCheckingOrder) {
      console.log('[FastOrdersPage] Running fallback check with orders list:', ordersData)
      
      // Look for orders created today for this area
      const todayOrders = ordersData.items?.filter(order => {
        const orderDate = new Date(order.createdAt || '').toISOString().split('T')[0]
        const matchesArea = order.areaId === selectedAreaId
        const matchesToday = orderDate === todayDate
        return matchesArea && matchesToday
      }) || []
      
      console.log('[FastOrdersPage] Today orders for area:', todayOrders)
      
      if (todayOrders.length > 0) {
        // Use the most recent order
        const latestOrder = todayOrders[0]
        console.log('[FastOrdersPage] Found existing order via fallback:', latestOrder)
        
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
  }, [ordersData, selectedAreaId, shouldCheckOrder, existingOrder, todayDate, isCheckingOrder])

  // Handle errors
  if (error) {
    console.error("[FastOrdersPage] Error loading products:", error)

  }

  // Auto-focus combobox on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const searchInput = comboboxRef.current?.querySelector("input")
      if (searchInput) {
        searchInput.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

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

  // Handle product selection - adds to table automatically
  const handleProductSelect = useCallback((productId: number) => {
    console.log("[FastPage] handleProductSelect called with:", productId)
    setSelectedProductId(undefined)

    const product = products.find(p => p.id === productId)
    if (!product) {
  
      return
    }

    // Stock validation removed from frontend

    // Validate that product has units available
    if (!product.productUnits || product.productUnits.length === 0) {
  
      return
    }

    // If product has only one unit, use it directly, otherwise set to editing mode
    const hasOnlyOneUnit = product.productUnits?.length === 1
    const defaultUnit = product.productUnits?.[0]?.unitMeasurement || { id: 0, name: "Unidad", description: "" }
    const defaultUnitId = product.productUnits?.[0]?.id || 0

    // For products with multiple units/variations, require user to select the specific one
    if (!hasOnlyOneUnit) {
      const existingProductsWithDifferentUnits = tableProducts.filter(tp => tp.product.id === product.id)
      if (existingProductsWithDifferentUnits.length > 0) {
        // Product already in table with different unit - allow to add another variation
        console.log("[FastPage] Product already in table with different variation - allowing to add")
      }
    }

    // Check if product with the SAME presentation already exists - this is not allowed
    const existingProduct = tableProducts.find(tp => 
      tp.product.id === product.id && tp.selectedUnitId === defaultUnitId
    )
    if (existingProduct) {
      console.log("[FastPage] Product with same presentation already exists - blocking")
      return
    }

    // Generate a stable ID to avoid hydration issues
    const uniqueId = Math.random().toString(36).substr(2, 9)
    const newTableProduct: TableProduct = {
      id: `${product.id}-${defaultUnitId}-${uniqueId}`,
      product,
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

    if (!currentUser?.id) {
  
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
        console.log('[FastOrdersPage] Added area to session orders:', selectedAreaId)
      }
  
       
// Reset form
      setTableProducts([])
      setOrderObservations("")
      setIsConfirmDialogOpen(false)
      setExistingOrder(undefined)
      setShouldCheckOrder(false) // Reset order check
      
      // Re-focus combobox
      setTimeout(() => {
        const searchInput = comboboxRef.current?.querySelector("input")
        if (searchInput) {
          searchInput.focus()
        }
      }, 200)
    } catch (error: unknown) {
      console.error("Error creating order:", error)
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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white border-gray-200 shadow-md">
          <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sistema</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pedidos Rápidos</h1>
              </div>
              {stats.totalProducts > 0 && (
                <Badge variant="default" className="hidden sm:inline-flex bg-gradient-to-r from-green-600 to-green-700 shadow-md">
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {stats.totalProducts > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="h-10 px-4 text-red-700 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 bg-red-50 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
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
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <label className="text-sm font-bold text-gray-800 block mb-3 uppercase tracking-wide">Área</label>
              <Select value={selectedAreaId?.toString()} onValueChange={(value) => setSelectedAreaId(parseInt(value))}>
                <SelectTrigger className="rounded-xl border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-orange-500 transition-all">
                  <SelectValue placeholder="Selecciona un área..." />
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
                      {currentUser ? "Cargando áreas..." : "Esperando datos del usuario..."}
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
               
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  Usuario: {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'No cargado'}
                  <br />
                  Áreas ID: {currentUser?.areaIds?.join(', ') || 'Ninguno'}
                  <br />
                  Áreas cargadas: {areas.length}
                  {isCheckingOrder && <><br />Verificando orden existente...</>}
                  {existingOrder && <><br />Orden existente: {JSON.stringify(existingOrder, null, 1)}</>}
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div ref={comboboxRef} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg hover:shadow-xl transition-shadow">
              <label className="text-sm font-bold text-gray-800 block mb-3 uppercase tracking-wide">Producto</label>
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Producto
                    </th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                       Presentación
                     </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                        Cantidad
                      </th>
                     <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
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

                      return (
                        <tr key={id} className="hover:bg-orange-50 transition-colors duration-150 border-l-4 border-l-transparent hover:border-l-orange-400">
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
                                <SelectTrigger className="h-10 w-48 border-2 border-gray-400 bg-white rounded-lg font-semibold hover:border-orange-400 focus:ring-2 focus:ring-orange-500 transition-all shadow-sm">
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
                                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-2 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 cursor-default">
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
                                    className="h-8 px-3 text-green-700 hover:text-green-800 hover:bg-green-100 border-green-200 bg-green-50 font-medium transition-all duration-200"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Guardar
                                  </Button>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleToggleEdit(id, false)}
                                     className="h-8 px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-200 transition-all duration-200"
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
                                    className="h-8 px-3 text-blue-700 hover:text-blue-800 hover:bg-blue-100 border-blue-200 bg-blue-50 font-medium transition-all duration-200"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveProduct(id)}
                                    className="h-8 px-3 text-red-700 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 bg-red-50 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
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
            <div className="mt-6 bg-gradient-to-r from-white to-orange-50 rounded-2xl border border-gray-200 p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold">Productos:</span> <span className="font-semibold text-lg text-orange-600">{stats.totalProducts}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="font-bold">Unidades:</span> <span className="font-semibold text-lg text-orange-600">{stats.totalItems}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setIsConfirmDialogOpen(true)}
                      disabled={!selectedAreaId || isCreatingOrder || (existingOrder && existingOrder.status !== 'created')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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

export default FastOrdersPage
