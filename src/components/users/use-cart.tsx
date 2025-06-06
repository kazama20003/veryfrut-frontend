"use client"

import { useState, useEffect } from "react"

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
  // Añadir un ID único para cada item del carrito
  cartItemId?: string
}

// Clave para almacenar el carrito en localStorage
const CART_STORAGE_KEY = "user_cart"

// Función para generar un ID único para cada item del carrito
const generateCartItemId = () => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function useCart() {
  const [cart, setCart] = useState<Product[]>([])

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Asegurar que cada item tenga un cartItemId único
        const cartWithIds = parsedCart.map((item: Product) => ({
          ...item,
          cartItemId: item.cartItemId || generateCartItemId(),
        }))
        setCart(cartWithIds)
      } catch (error) {
        console.error("Error al cargar el carrito desde localStorage:", error)
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  // Añadir producto al carrito - MODIFICADO para permitir duplicados
  const addToCart = (product: Product, selectedUnitId: number, allowDuplicate = false) => {
    setCart((prevCart) => {
      if (!allowDuplicate) {
        // Comportamiento original: verificar si el producto ya está en el carrito con la misma unidad
        const existingItemIndex = prevCart.findIndex(
          (item) => item.id === product.id && item.selectedUnitId === selectedUnitId,
        )

        if (existingItemIndex >= 0) {
          // Si ya existe, incrementar la cantidad
          const updatedCart = [...prevCart]
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: updatedCart[existingItemIndex].quantity + 1,
          }
          return updatedCart
        }
      }

      // Nuevo comportamiento: siempre añadir como nuevo item con ID único
      const newCartItem = {
        ...product,
        quantity: 1,
        selectedUnitId,
        cartItemId: generateCartItemId(),
      }

      return [...prevCart, newCartItem]
    })
  }

  // Actualizar cantidad de un producto en el carrito - MODIFICADO para usar cartItemId
  const updateCartItemQuantity = (productId: number, selectedUnitId: number, quantity: number, cartItemId?: string) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        // Si la cantidad es 0 o menos, eliminar el producto
        if (cartItemId) {
          // Si tenemos cartItemId, eliminar ese item específico
          return prevCart.filter((item) => item.cartItemId !== cartItemId)
        } else {
          // Comportamiento original para compatibilidad
          return prevCart.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId))
        }
      }

      // Actualizar la cantidad
      return prevCart.map((item) => {
        if (cartItemId) {
          // Si tenemos cartItemId, actualizar ese item específico
          return item.cartItemId === cartItemId ? { ...item, quantity } : item
        } else {
          // Comportamiento original para compatibilidad
          return item.id === productId && item.selectedUnitId === selectedUnitId ? { ...item, quantity } : item
        }
      })
    })
  }

  // Eliminar un producto del carrito - MODIFICADO para usar cartItemId
  const removeFromCart = (productId: number, selectedUnitId: number, cartItemId?: string) => {
    setCart((prevCart) => {
      if (cartItemId) {
        // Si tenemos cartItemId, eliminar ese item específico
        return prevCart.filter((item) => item.cartItemId !== cartItemId)
      } else {
        // Comportamiento original para compatibilidad
        return prevCart.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId))
      }
    })
  }

  // Limpiar todo el carrito
  const clearCart = () => {
    setCart([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  // Calcular el precio total
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Obtener el número total de items
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Nueva función para añadir producto como duplicado
  const addToCartAsDuplicate = (product: Product, selectedUnitId: number) => {
    addToCart(product, selectedUnitId, true)
  }

  // Nueva función para obtener items agrupados (para mostrar resumen)
  const getGroupedItems = () => {
    const grouped = cart.reduce(
      (acc, item) => {
        const key = `${item.id}-${item.selectedUnitId}`
        if (!acc[key]) {
          acc[key] = {
            product: item,
            totalQuantity: 0,
            items: [],
          }
        }
        acc[key].totalQuantity += item.quantity
        acc[key].items.push(item)
        return acc
      },
      {} as Record<string, { product: Product; totalQuantity: number; items: Product[] }>,
    )

    return Object.values(grouped)
  }

  return {
    cart,
    setCart,
    addToCart,
    addToCartAsDuplicate, // Nueva función
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getGroupedItems, // Nueva función
  }
}
