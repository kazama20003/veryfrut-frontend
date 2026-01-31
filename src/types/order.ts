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
  quantity: number; // Supports decimal values (e.g., 0.25, 0.5, 0.75, 1)
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
 * Enum para status de orden
 */
export enum OrderStatus {
  CREATED = 'created',
  PROCESS = 'process',
  DELIVERED = 'delivered',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export type OrderStatusType = 'created' | 'process' | 'delivered' | 'pending' | 'cancelled';

/**
 * Item de orden para creación
 * Estructura exacta que espera el backend con class-validator
 */
export interface CreateOrderItemDto {
  productId: number; // @IsNumber() @IsPositive()
  quantity: number; // @IsNumber() @IsPositive() - Supports decimal values (e.g., 0.25, 0.5, 0.75, 1)
  price: number; // @IsNumber()
  unitMeasurementId: number; // @IsNumber() @IsPositive()
}

/**
 * DTO para crear orden
 * Estructura exacta que espera el backend con class-validator y class-transformer
 */
export interface CreateOrderDto {
  userId: number; // @IsNumber() @IsPositive()
  areaId: number; // @IsNumber() @IsPositive()
  totalAmount: number; // @IsNumber()
  status: OrderStatus; // @IsEnum(OrderStatus)
  observation?: string; // @IsOptional() @IsString()
  orderItems: CreateOrderItemDto[]; // @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
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
    quantity: number; // Supports decimal values (e.g., 0.25, 0.5, 0.75, 1)
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
 * Respuesta de verificación de orden
 */
export interface CheckOrderResponse {
  exists: boolean;
  order?: Order;
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
