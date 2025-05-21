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
}

// Clave para almacenar el carrito en localStorage
const CART_STORAGE_KEY = "user_cart"

export function useCart() {
  const [cart, setCart] = useState<Product[]>([])

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
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

  // Añadir producto al carrito
  const addToCart = (product: Product, selectedUnitId: number) => {
    setCart((prevCart) => {
      // Verificar si el producto ya está en el carrito con la misma unidad
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
      } else {
        // Si no existe, añadir como nuevo item
        return [
          ...prevCart,
          {
            ...product,
            quantity: 1,
            selectedUnitId,
          },
        ]
      }
    })
  }

  // Actualizar cantidad de un producto en el carrito
  const updateCartItemQuantity = (productId: number, selectedUnitId: number, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        // Si la cantidad es 0 o menos, eliminar el producto
        return prevCart.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId))
      }

      // Actualizar la cantidad
      return prevCart.map((item) =>
        item.id === productId && item.selectedUnitId === selectedUnitId ? { ...item, quantity } : item,
      )
    })
  }

  // Eliminar un producto del carrito
  const removeFromCart = (productId: number, selectedUnitId: number) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.selectedUnitId === selectedUnitId)))
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

  return {
    cart,
    setCart, // Exportar setCart para permitir establecer el carrito directamente
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
  }
}
