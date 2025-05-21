"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ShoppingCart, Filter, Search, X, AlertTriangle } from "lucide-react"

import { api } from "@/lib/axiosInstance"
import { ProductCard } from "@/components/users/product-card"
import { ProductFilter } from "@/components/users/product-filter"
import { ProductSearch } from "@/components/users/product-search"
import { ShoppingCartDrawer } from "@/components/users/shopping-cart-drawer"
import { useCart } from "@/components/users/use-cart"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  createdAt: string
  updatedAt: string
  productUnits: ProductUnit[]
}

interface Category {
  id: number
  name: string
  description: string
}

export default function ProductsPage() {
  // Estados para los datos
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [activeFilter, setActiveFilter] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isPageBlocked, setIsPageBlocked] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [mobileSearchValue, setMobileSearchValue] = useState("")
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  // Hook para el carrito
  const { cart, addToCart, updateCartItemQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart()

  // Función para cargar datos, ahora memoizada con useCallback
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Obtener productos
      const productsResponse = await api.get("/products")
      setProducts(productsResponse.data)
      setFilteredProducts(productsResponse.data)

      // Obtener categorías
      const categoriesResponse = await api.get("/categories")
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos. Por favor, intenta nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Aplicar filtros (categoría y búsqueda)
  const applyFilters = useCallback(
    (categoryId: number | null, query: string) => {
      let filtered = [...products]

      // Filtrar por categoría si está seleccionada
      if (categoryId !== null) {
        filtered = filtered.filter((product) => product.categoryId === categoryId)
      }

      // Filtrar por término de búsqueda si existe
      if (query.trim() !== "") {
        const searchTerms = query.toLowerCase().split(" ")
        filtered = filtered.filter((product) => {
          const productText = `${product.name} ${product.description}`.toLowerCase()
          return searchTerms.every((term) => productText.includes(term))
        })
      }

      setFilteredProducts(filtered)
    },
    [products],
  )

  // Función para filtrar productos por categoría
  const handleFilterChange = useCallback(
    (categoryId: number | null) => {
      setActiveFilter(categoryId)
      applyFilters(categoryId, searchQuery)
      setIsMobileFilterOpen(false)
    },
    [applyFilters, searchQuery],
  )

  // Función para buscar productos
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      applyFilters(activeFilter, query)
    },
    [applyFilters, activeFilter],
  )

  // Manejar búsqueda móvil
  const handleMobileSearch = useCallback(() => {
    setSearchQuery(mobileSearchValue)
    applyFilters(activeFilter, mobileSearchValue)
  }, [mobileSearchValue, activeFilter, applyFilters])

  // Limpiar búsqueda móvil
  const clearMobileSearch = useCallback(() => {
    setMobileSearchValue("")
    setSearchQuery("")
    applyFilters(activeFilter, "")
    if (mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus()
    }
  }, [activeFilter, applyFilters])

  // Función para determinar si un producto es nuevo (menos de 7 días)
  const isNewProduct = useCallback((createdAt: string) => {
    const productDate = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - productDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }, [])

  // Función para determinar si un producto es destacado (simulado)
  const isFeaturedProduct = useCallback((id: number) => {
    // Simulamos que algunos productos son destacados
    return id % 5 === 0
  }, [])

  // Manejar la adición al carrito con notificación
  const handleAddToCart = useCallback(
    (product: Product, selectedUnitId: number) => {
      if (isPageBlocked) return // Evitar acciones si la página está bloqueada

      addToCart(product, selectedUnitId)

      // Obtener el nombre de la unidad seleccionada
      const selectedUnit = product.productUnits.find((pu) => pu.unitMeasurement.id === selectedUnitId)
      const unitName = selectedUnit?.unitMeasurement.name || ""

      toast.success("Producto agregado", {
        description: `${product.name} (${unitName}) se ha agregado al carrito.`,
      })
    },
    [addToCart, isPageBlocked],
  )

  // Función para abrir el carrito
  const handleOpenCart = useCallback(() => {
    if (isPageBlocked) return // Evitar acciones si la página está bloqueada
    setIsCartOpen(true)
  }, [isPageBlocked])

  // Función para cerrar el carrito y asegurar que la página se desbloquee
  const handleCloseCart = useCallback(() => {
    // Cerrar el carrito
    setIsCartOpen(false)

    // Desbloquear la página
    setIsPageBlocked(false)
  }, [])

  // Función para manejar el estado de bloqueo de la página
  const handlePageBlock = useCallback((blocked: boolean) => {
    console.log("Página bloqueada:", blocked)
    setIsPageBlocked(blocked)
  }, [])

  // Función para desbloquear manualmente la página
  const handleManualUnblock = useCallback(() => {
    setIsPageBlocked(false)
    setIsCartOpen(false)
    toast.success("Página desbloqueada manualmente", {
      description: "La interfaz ha sido desbloqueada. Puedes continuar usando la aplicación.",
    })
  }, [])

  // Efecto para monitorear el estado de bloqueo y aplicar un temporizador de seguridad
  useEffect(() => {
    // Si la página está bloqueada, configurar un temporizador de seguridad para desbloquearla
    let safetyTimer: NodeJS.Timeout | null = null
    if (isPageBlocked) {
      safetyTimer = setTimeout(() => {
        console.log("Desbloqueo de seguridad activado")
        setIsPageBlocked(false)
        setIsCartOpen(false)
        toast.info("Desbloqueo automático", {
          description: "La página ha sido desbloqueada automáticamente por seguridad.",
        })
      }, 5000) // 5 segundos para mayor seguridad
    }

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer)
    }
  }, [isPageBlocked])

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-3 md:px-6">
          <h1 className="text-lg font-semibold md:text-2xl">Productos Premium</h1>

          {/* Controles móviles */}
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative" disabled={isPageBlocked}>
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium mb-4">Filtrar por categoría</h2>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={activeFilter === null ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleFilterChange(null)}
                    >
                      Todos los productos
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={activeFilter === category.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleFilterChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative">
              <Input
                ref={mobileSearchInputRef}
                type="search"
                placeholder="Buscar..."
                className="w-[140px] h-9 pl-8 pr-7 text-sm"
                value={mobileSearchValue}
                onChange={(e) => setMobileSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMobileSearch()}
                disabled={isPageBlocked}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              {mobileSearchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={clearMobileSearch}
                  disabled={isPageBlocked}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={handleOpenCart}
              disabled={isPageBlocked}
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                  {getTotalItems()}
                </span>
              )}
            </Button>
          </div>

          {/* Botón de carrito para desktop */}
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={handleOpenCart}
              disabled={isPageBlocked}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                  {getTotalItems()}
                </span>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6">
          {/* Indicador de bloqueo con botón de desbloqueo manual */}
          {isPageBlocked && (
            <Alert className="mb-4 bg-yellow-100 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-800" />
              <AlertDescription className="flex items-center justify-between text-yellow-800">
                <span>La página está bloqueada temporalmente. Por favor, espera...</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 bg-yellow-200 border-yellow-400 hover:bg-yellow-300"
                  onClick={handleManualUnblock}
                >
                  Desbloquear
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filtros y búsqueda para desktop */}
          <div className="hidden md:flex mb-6 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Filtros de categorías */}
            <div className="w-full md:w-auto">
              {isLoading ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                  ))}
                </div>
              ) : (
                <ProductFilter
                  categories={categories}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  disabled={isPageBlocked}
                />
              )}
            </div>

            {/* Buscador de productos */}
            <div className="w-full md:w-auto">
              {isLoading ? (
                <Skeleton className="h-10 w-full max-w-md" />
              ) : (
                <ProductSearch onSearch={handleSearch} disabled={isPageBlocked} />
              )}
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {!isLoading && searchQuery && (
            <div className="mb-4 flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/40">
              <div>
                <p className="text-sm font-medium">
                  Resultados para: <span className="text-green-600">{searchQuery}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setSearchQuery("")
                  setMobileSearchValue("")
                  applyFilters(activeFilter, "")
                }}
                disabled={isPageBlocked}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Limpiar
              </Button>
            </div>
          )}

          {/* Grid de productos - Optimizado para móviles */}
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {isLoading ? (
              // Esqueletos para carga
              Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              // Productos filtrados
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isNew={isNewProduct(product.createdAt)}
                  isFeatured={isFeaturedProduct(product.id)}
                  disabled={isPageBlocked}
                />
              ))
            ) : (
              // Mensaje cuando no hay productos
              <div className="col-span-full flex h-40 md:h-60 flex-col items-center justify-center text-center text-muted-foreground">
                <div className="mb-4 rounded-full bg-muted/50 p-3">
                  <Search className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-base md:text-lg font-medium">No se encontraron productos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? "Intenta con otros términos de búsqueda"
                    : "Intenta con otra búsqueda o selecciona otra categoría"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setMobileSearchValue("")
                    setActiveFilter(null)
                    applyFilters(null, "")
                  }}
                  disabled={isPageBlocked}
                >
                  Ver todos los productos
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Carrito de compras */}
      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalPrice={getTotalPrice()}
        onPageBlock={handlePageBlock}
      />
    </>
  )
}
