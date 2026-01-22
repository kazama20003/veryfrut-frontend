/**
 * Tipos para órdenes - Sincronizados con backend DTOs
 */

/**
 * Item de una orden
 */
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  unitMeasurementId: number;
  product?: {
    id: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  };
  unitMeasurement?: {
    id: number;
    name: string;
    description?: string;
  };
}

/**
 * Entidad Order - Respuesta del servidor
 */
export interface Order {
  id: number;
  areaId: number;
  userId?: number;
  totalAmount: number;
  status: string; // "created", "delivered", etc.
  observation?: string;
  createdAt?: string;
  updatedAt?: string;
  area?: {
    id: number;
    name: string;
    color: string;
    companyId: number;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    role: string;
  };
  orderItems?: OrderItem[];
}

/**
 * DTO para crear orden
 */
export interface CreateOrderDto {
  areaId: number;
  userId?: number;
  totalAmount: number;
  status?: string;
  observation?: string;
  orderItems: Array<{
    productId: number;
    quantity: number;
    price: number;
    unitMeasurementId: number;
  }>;
}

/**
 * DTO para actualizar orden
 */
export interface UpdateOrderDto {
  areaId?: number;
  userId?: number;
  totalAmount?: number;
  status?: string;
  observation?: string;
  orderItems?: Array<{
    productId: number;
    quantity: number;
    price: number;
    unitMeasurementId: number;
  }>;
}

/**
 * DTO para verificar orden
 */
export interface CheckOrderDto {
  areaId?: string;
  date?: string;
}

/**
 * Parámetros para listar órdenes
 */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'areaId' | 'userId' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
  status?: string; // Filtrar por estado
  areaId?: number; // Filtrar por área
  userId?: number; // Filtrar por usuario
}

/**
 * Parámetros para filtrar órdenes por fecha
 */
export interface GetOrdersByDateRangeParams {
  startDate: string; // ISO 8601 date format
  endDate: string; // ISO 8601 date format
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de órdenes
 */
export interface PaginatedOrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
