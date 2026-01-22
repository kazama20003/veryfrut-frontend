# Dashboard de Productos para Usuarios

## 📦 Componentes Creados

### 1. **ProductCardDashboard**
   - **Ubicación**: `src/components/users/product-card-dashboard.tsx`
   - **Descripción**: Tarjeta individual de producto optimizada para panel de usuarios
   - **Características**:
     - Vista bonita con imagen del producto
     - Selector de unidad de medida
     - Controles de cantidad intuitivos
     - Información de stock y disponibilidad
     - Calificación de estrellas
     - Precio destacado

### 2. **UsersDashboard**
   - **Ubicación**: `src/components/users/dashboard/products-grid.tsx`
   - **Descripción**: Panel completo de productos para crear órdenes
   - **Características**:
     - Grid responsive de productos
     - Búsqueda por nombre/descripción
     - Filtrado por categorías
     - Ordenamiento (nombre, precio, más recientes, rating)
     - Carrito de compras integrado
     - Soporte para móvil

### 3. **ShoppingCartDrawer**
   - **Ubicación**: `src/components/users/shopping-cart-drawer.tsx`
   - **Descripción**: Drawer/Dialog del carrito de compras
   - **Características**:
     - Vista del carrito con imágenes de productos
     - Modificación de cantidades
     - Eliminación de productos
     - Resumen de total
     - Limpieza del carrito

### 4. **useCart (Hook)**
   - **Ubicación**: `src/components/users/use-cart.ts`
   - **Descripción**: Hook personalizado para gestión del carrito
   - **Características**:
     - Agregar productos
     - Agregar como elemento separado
     - Actualizar cantidades
     - Eliminar productos
     - Limpiar carrito
     - Cálculo de totales

## 🎨 Componentes UI Creados

### Badge
- `src/components/ui/badge.tsx`
- Componente de etiqueta reutilizable con variantes

### Select
- `src/components/ui/select.tsx`
- Componente de selector dropdown con Radix UI

### Alert
- `src/components/ui/alert.tsx`
- Componente de alerta para notificaciones

## 🚀 Cómo Usar

### Opción 1: Importar todo el Dashboard
```tsx
import { UsersDashboard } from "@/components/users/dashboard/products-grid"

export default function MyPage() {
  return <UsersDashboard />
}
```

### Opción 2: Usar ProductCardDashboard Individualmente
```tsx
import { ProductCardDashboard } from "@/components/users/product-card-dashboard"
import { useCart } from "@/components/users/use-cart"

export default function MyComponent() {
  const { addToCart } = useCart()
  
  return (
    <ProductCardDashboard
      product={product}
      onAddToCart={(cartProduct, unitId) => {
        addToCart(cartProduct, unitId)
      }}
    />
  )
}
```

### Opción 3: Usar useCart Hook
```tsx
import { useCart } from "@/components/users/use-cart"

export default function MyComponent() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart()
  
  return (
    <div>
      <p>Total items: {getTotalItems()}</p>
      <p>Total price: ${getTotalPrice()}</p>
    </div>
  )
}
```

## 📱 Características Responsive

- **Desktop**: Grid de 4-5 columnas con controles de filtrado
- **Tablet**: Grid de 3-4 columnas
- **Móvil**: Grid de 1-2 columnas con filtros en sheet móvil

## 🎯 Flujo de Uso

1. **Usuario ve el catálogo** - UsersDashboard muestra todos los productos
2. **Filtra/Busca** - Puede filtrar por categoría o buscar por nombre
3. **Selecciona cantidad y unidad** - ProductCardDashboard permite seleccionar
4. **Agrega al carrito** - El producto se añade al carrito local
5. **Revisa carrito** - ShoppingCartDrawer muestra resumen
6. **Confirma orden** - Se envía al backend

## 🎨 Personalización

### Cambiar colores
Los colores principales son verde (`green-600`, `green-700`). Puedes cambiarlos en los componentes.

### Ajustar tamaños de grid
En `products-grid.tsx`, línea ~175:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
```

### Modificar cantidad de presets
En `product-card-dashboard.tsx`, línea ~64:
```tsx
const QUANTITY_PRESETS = [0.1, 0.25, 0.5, 1, 5, 10] as const
```

## 🔧 Dependencias Requeridas

- `next/image` - Para optimización de imágenes
- `lucide-react` - Para iconos
- `sonner` - Para notificaciones toast
- `@radix-ui/*` - Para componentes base
- `tailwindcss` - Para estilos

## 📝 Notas Importantes

- ✅ Todos los componentes usan "use client"
- ✅ Soportan decimales en cantidades (0.25, 0.5, etc.)
- ✅ Responsive y mobile-first
- ✅ Sin errores de compilación
- ✅ TypeScript con tipos completos
- ✅ Integrado con el sistema de carrito existente

## 🐛 Troubleshooting

Si los componentes no se importan correctamente:
1. Verifica las rutas de importación (relativas vs absolutas)
2. Asegúrate de tener "use client" en la parte superior
3. Revisa que todos los componentes UI existan en `src/components/ui/`
4. Ejecuta `npm run build` para detectar errores

---

**Creado**: 22 de enero de 2026
**Versión**: 1.0.0
