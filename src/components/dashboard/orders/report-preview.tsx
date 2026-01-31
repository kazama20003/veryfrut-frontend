"use client"

import React from "react"

interface OrderItem {
  id?: number
  productId: number
  quantity: number
  price: number
  unitMeasurementId?: number
  unitMeasurement?: {
    id: number
    name: string
  }
  product?: {
    id: number
    name: string
    price: number
  }
}

interface Order {
  id: number
  userId?: number
  user?: {
    id: number
    firstName: string
    lastName: string
  }
  areaId?: number
  area?: {
    id: number
    name: string
    color?: string
  }
  companyId?: number
  company?: {
    id: number
    name: string
    color?: string
  }
  totalAmount: number
  status: string
  observation?: string
  orderItems?: OrderItem[]
  createdAt?: string
}

interface ReportPreviewProps {
  orders: Order[]
}

export function ReportPreview({ orders }: ReportPreviewProps) {
  // Agrupar órdenes por empresa
  const ordersByCompany: { [key: number]: Order[] } = {}
  orders.forEach((order) => {
    const companyId = order.companyId || 0
    if (!ordersByCompany[companyId]) {
      ordersByCompany[companyId] = []
    }
    ordersByCompany[companyId].push(order)
  })

  const hexToRgba = (hex: string, opacity: number = 1): string => {
    const cleanHex = hex.replace("#", "")
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-border">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse text-xs sm:text-sm">
          {/* Encabezado principal */}
          <thead>
            <tr>
              <th
                colSpan={Object.keys(ordersByCompany).length + 1}
                className="bg-slate-900 text-white py-3 px-4 text-center font-bold"
              >
                REPORTE DE ÓRDENES POR EMPRESA
              </th>
            </tr>
            <tr className="border-b border-gray-300">
              <th className="bg-gray-100 py-2 px-3 text-left font-semibold border-r border-gray-300">Producto / Área</th>
              {Object.entries(ordersByCompany).map(([companyId, companyOrders]) => {
                const company = companyOrders[0]?.company
                const companyColor = company?.color || "#3B82F6"
                return (
                  <th
                    key={companyId}
                    className="py-2 px-3 text-center font-semibold border-r border-gray-300 min-w-[120px]"
                    style={{ backgroundColor: hexToRgba(companyColor, 0.2), color: companyColor }}
                  >
                    <div className="font-bold">{company?.name || `Empresa #${companyId}`}</div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Cuerpo de la tabla */}
          <tbody>
            {/* Agrupar por área */}
            {Array.from(
              new Map(
                orders.map((order) => [
                  order.areaId || 0,
                  { area: order.area, color: order.area?.color || "#4472C4" },
                ])
              ).values()
            ).map((areaData, areaIndex) => {
              const ordersInArea = orders.filter((o) => o.areaId === areaData.area?.id)
              return (
                <React.Fragment key={areaIndex}>
                  {/* Fila de encabezado de área */}
                  <tr className="border-b-2 border-gray-400">
                    <td
                      colSpan={Object.keys(ordersByCompany).length + 1}
                      className="py-2 px-3 font-bold text-white"
                      style={{
                        backgroundColor: areaData.color || "#4472C4",
                      }}
                    >
                      {areaData.area?.name || "Sin Área"}
                    </td>
                  </tr>

                  {/* Productos de esta área */}
                  {ordersInArea.length > 0 && (
                    <>
                      {/* Encabezado de productos en esta área */}
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="py-2 px-3 font-semibold text-gray-700">Productos</td>
                        {Object.entries(ordersByCompany).map(([companyId]) => (
                          <td key={companyId} className="py-2 px-3 text-center border-r border-gray-300" />
                        ))}
                      </tr>

                      {/* Filas de productos */}
                      {Array.from(
                        new Set(
                          ordersInArea
                            .flatMap((o) => o.orderItems || [])
                            .map((item) => item.product?.name || "N/A")
                        )
                      ).map((productName, productIndex) => (
                        <tr key={productIndex} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-700 border-r border-gray-300">{productName}</td>
                          {Object.entries(ordersByCompany).map(([companyId]) => {
                            const companyOrders = ordersByCompany[Number(companyId)]
                            const companyOrdersInArea = companyOrders.filter((o) => o.areaId === areaData.area?.id)
                            const productQty = companyOrdersInArea
                              .flatMap((o) => o.orderItems || [])
                              .filter((item) => item.product?.name === productName)
                              .reduce(
                                (sum, item) => sum + (item.quantity || 0),
                                0
                              )

                            const unitName = companyOrdersInArea
                              .flatMap((o) => o.orderItems || [])
                              .find((item) => item.product?.name === productName)
                              ?.unitMeasurement?.name || ""

                            return (
                              <td
                                key={companyId}
                                className="py-2 px-3 text-center border-r border-gray-300 font-semibold"
                              >
                                {productQty > 0 ? `${productQty}${unitName}` : "-"}
                              </td>
                            )
                          })}
                        </tr>
                      ))}

                      {/* Fila de subtotales por área */}
                      <tr className="border-t-2 border-gray-400 font-bold bg-gray-100">
                        <td className="py-2 px-3 text-gray-800">SUBTOTAL ÁREA</td>
                        {Object.entries(ordersByCompany).map(([companyId]) => {
                          const companyOrders = ordersByCompany[Number(companyId)]
                          const companyOrdersInArea = companyOrders.filter((o) => o.areaId === areaData.area?.id)
                          const totalQty = companyOrdersInArea.flatMap((o) => o.orderItems || []).length
                          const totalAmount = companyOrdersInArea.reduce((sum, o) => sum + o.totalAmount, 0)

                          return (
                            <td
                              key={companyId}
                              className="py-2 px-3 text-center border-r border-gray-300"
                              style={{ backgroundColor: hexToRgba(areaData.color || "#4472C4", 0.1) }}
                            >
                              <div className="text-xs">Cant: {totalQty}</div>
                              <div className="text-xs">S/. {totalAmount.toFixed(2)}</div>
                            </td>
                          )
                        })}
                      </tr>
                    </>
                  )}
                </React.Fragment>
              )
            })}

            {/* Fila de totales generales */}
            <tr className="border-t-4 border-gray-900 bg-slate-900 font-bold text-white">
              <td className="py-3 px-3">TOTAL GENERAL</td>
              {Object.entries(ordersByCompany).map(([companyId]) => {
                const companyOrders = ordersByCompany[Number(companyId)]
                const totalQty = companyOrders.flatMap((o) => o.orderItems || []).length
                const totalAmount = companyOrders.reduce((sum, o) => sum + o.totalAmount, 0)

                return (
                  <td key={companyId} className="py-3 px-3 text-center border-r border-gray-600">
                    <div className="text-sm">Cant: {totalQty}</div>
                    <div className="text-sm">S/. {totalAmount.toFixed(2)}</div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
