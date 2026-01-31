/**
 * Service para endpoints de Order
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  CheckOrderDto,
  CheckOrderResponse,
  GetOrdersParams,
  GetOrdersByDateRangeParams,
  PaginatedOrdersResponse,
} from '@/types/order';

// Re-exportar tipos
export type {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  CheckOrderDto,
  CheckOrderResponse,
  GetOrdersParams,
  GetOrdersByDateRangeParams,
  PaginatedOrdersResponse,
};

class OrderService {
  /**
   * Crear nueva orden
   */
  async create(data: CreateOrderDto) {
    try {
      console.log('[OrderService] Creando orden con datos:', JSON.stringify(data, null, 2));
      console.log('[OrderService] Estructura esperada por backend (class-validator/class-transformer)');
      console.log('[OrderService] - userId (number, @IsPositive):', data.userId);
      console.log('[OrderService] - areaId (number, @IsPositive):', data.areaId);
      console.log('[OrderService] - totalAmount (number):', data.totalAmount);
      console.log('[OrderService] - status (OrderStatus enum):', data.status);
      console.log('[OrderService] - observation (string, @IsOptional):', data.observation);
      console.log('[OrderService] - orderItems (CreateOrderItemDto[]):', data.orderItems.length, 'items');
      
      // Validar que orderItems tenga la estructura correcta
      data.orderItems.forEach((item, index) => {
        console.log(`[OrderService] - Item ${index}:`, {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitMeasurementId: item.unitMeasurementId
        });
      });

      console.log('[OrderService] Enviando request a:', `${axiosInstance.defaults.baseURL}/orders`);
      console.log('[OrderService] Headers:', axiosInstance.defaults.headers);
      console.log('[OrderService] Request data (raw):', data);
      console.log('[OrderService] Request data (JSON):', JSON.stringify(data, null, 2));
      
      const response = await axiosInstance.post<Order | ApiResponse<Order>>('/orders', data);
      console.log('[OrderService] Response status:', response.status);
      console.log('[OrderService] Response data:', response.data);
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Create response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? responseData
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en create:', error);
      if (error instanceof Error) {
        console.error('[OrderService] Error message:', error.message);
      }
      
      // Enhanced error logging for axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('[OrderService] Response status:', axiosError.response?.status);
        console.error('[OrderService] Response data:', axiosError.response?.data);
        console.error('[OrderService] Response headers:', axiosError.response?.headers);
        
        // Try to extract more detailed error message from backend response
        if (axiosError.response?.data?.message) {
          console.error('[OrderService] Backend error message:', axiosError.response.data.message);
        }
        if (axiosError.response?.data?.error) {
          console.error('[OrderService] Backend error details:', axiosError.response.data.error);
        }
      }
      
      throw error;
    }
  }

  /**
   * Obtener todas las órdenes con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetOrdersParams) {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse> | Order[]
      >('/orders', { params });
      
      console.log('[OrderService] GetAll response:', response.data);
      
      // Extraer la data de la respuesta
      let data: PaginatedOrdersResponse | undefined;
      
      // Caso 0: Respuesta es directamente un array de Order
      if (Array.isArray(response.data)) {
        console.log('[OrderService] Caso 0: Array directo de Orders');
        const orders = response.data as Order[];
        return {
          items: orders,
          total: orders.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          hasMore: false,
          totalPages: Math.ceil(orders.length / (params?.limit ?? 10)),
        };
      }
      // Caso 1: ApiResponse con estructura { data: Array, total, page, limit, totalPages }
      else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        console.log('[OrderService] Caso 1: ApiResponse con data array');
        const orders = response.data.data as Order[];
        const responseData = response.data as any;
        return {
          items: orders,
          total: responseData.total ?? orders.length,
          page: responseData.page ?? (params?.page ?? 1),
          limit: responseData.limit ?? (params?.limit ?? 10),
          hasMore: (responseData.page ?? 1) < (responseData.totalPages ?? 1),
          totalPages: responseData.totalPages ?? Math.ceil(orders.length / (responseData.limit ?? 10)),
        };
      }
      // Caso 2: PaginatedOrdersResponse directo (con items)
      else if (response.data && 'items' in response.data) {
        console.log('[OrderService] Caso 2: PaginatedOrdersResponse directo con items');
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      // Caso 3: ApiResponse<PaginatedOrdersResponse> (envuelto)
      else if (response.data && 'data' in response.data && response.data.data && 'items' in response.data.data) {
        console.log('[OrderService] Caso 3: ApiResponse envuelto con items');
        data = (response.data as unknown as ApiResponse<PaginatedOrdersResponse>).data;
      }
      // Caso 4: Respuesta envuelta en { data: {...} } sin items
      else if (response.data && typeof response.data === 'object' && response.data !== null) {
        console.log('[OrderService] Caso 4: Objeto sin items, usando response.data directamente');
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      
      console.log('[OrderService] Data extraída:', data);
      
      if (!data || !data.items) {
        console.log('[OrderService] No hay items en la data, retornando array vacío');
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      console.log('[OrderService] Items encontrados:', data.items.length);
      return data;
    } catch (error) {
      console.error('[OrderService] Error en getAll:', error);
      throw error;
    }
  }

  /**
   * Verificar existencia de orden
   */
  async check(data: CheckOrderDto): Promise<CheckOrderResponse> {
    try {
      const response = await axiosInstance.get<any>('/orders/check', {
        params: data,
      });
      const responseData = response.data;
      console.log('[OrderService] Check response:', responseData);
      
      // Handle different response structures
      if (responseData && typeof responseData === 'object') {
        // Case 1: Backend returns {exists: true, order?: Order}
        if ('exists' in responseData) {
          return responseData;
        }
        // Case 2: Backend returns the Order directly
        if ('id' in responseData) {
          return { exists: true, order: responseData };
        }
        // Case 3: Backend returns wrapped in ApiResponse
        if ('data' in responseData && responseData.data) {
          return { exists: true, order: responseData.data };
        }
      }
      
      // If no order found, return exists: false
      return { exists: false };
    } catch (error) {
      console.error('[OrderService] Error en check:', error);
      // If it's a 404, return exists: false
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
          return { exists: false };
        }
      }
      throw error;
    }
  }

  /**
   * Obtener historial de órdenes por cliente
   */
  async getByCustomerId(customerId: number, params?: Omit<GetOrdersParams, 'userId'>) {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse>
      >(`/orders/customer/${customerId}`, { params });
      
      console.log('[OrderService] GetByCustomerId response:', response.data);
      
      let data: PaginatedOrdersResponse | undefined;

      if (Array.isArray(response.data)) {
        const items = response.data as Order[];
        return {
          items,
          total: items.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? items.length,
          hasMore: false,
          totalPages: 1,
        };
      }
      
      if (response.data && 'data' in response.data && !('items' in response.data)) {
        const wrapped = (response.data as unknown as ApiResponse<PaginatedOrdersResponse>).data;
        if (Array.isArray(wrapped)) {
          return {
            items: wrapped as Order[],
            total: wrapped.length,
            page: params?.page ?? 1,
            limit: params?.limit ?? wrapped.length,
            hasMore: false,
            totalPages: 1,
          };
        }
        data = wrapped as PaginatedOrdersResponse;
      } else if (response.data && 'items' in response.data) {
        data = response.data as unknown as PaginatedOrdersResponse;
      } else if (response.data && typeof response.data === 'object' && response.data !== null) {
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      
      if (!data || !data.items) {
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      return data;
    } catch (error) {
      console.error('[OrderService] Error en getByCustomerId:', error);
      throw error;
    }
  }

  /**
   * Filtrar órdenes por rango de fechas
   */
  async filterByDateRange(params: GetOrdersByDateRangeParams) {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse>
      >('/orders/filter', { params });
      
      console.log('[OrderService] FilterByDateRange response:', response.data);
      
      let data: PaginatedOrdersResponse | undefined;
      
      if (response.data && 'data' in response.data && !('items' in response.data)) {
        data = (response.data as unknown as ApiResponse<PaginatedOrdersResponse>).data;
      } else if (response.data && 'items' in response.data) {
        data = response.data as unknown as PaginatedOrdersResponse;
      } else if (response.data && typeof response.data === 'object' && response.data !== null) {
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      
      if (!data || !data.items) {
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      return data;
    } catch (error) {
      console.error('[OrderService] Error en filterByDateRange:', error);
      throw error;
    }
  }

  /**
   * Obtener orden por ID
   */
  async getById(id: string | number) {
    try {
      const response = await axiosInstance.get<Order | ApiResponse<Order>>(`/orders/${id}`);
      const data = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] GetById response:', data);
      return data && typeof data === 'object' && 'id' in data ? data : undefined;
    } catch (error) {
      console.error('[OrderService] Error en getById:', error);
      throw error;
    }
  }

  /**
   * Actualizar orden
   */
  async update(id: number, data: UpdateOrderDto) {
    try {
      const response = await axiosInstance.patch<Order | ApiResponse<Order>>(`/orders/${id}`, data);
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Update response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? responseData
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en update:', error);
      throw error;
    }
  }

  /**
   * Eliminar orden
   */
  async delete(id: string | number) {
    try {
      const response = await axiosInstance.delete<
        { success: boolean } | ApiResponse<{ success: boolean }>
      >(`/orders/${id}`);
      const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
      console.log('[OrderService] Delete response:', data);
      return data || { success: false };
    } catch (error) {
      console.error('[OrderService] Error en delete:', error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;
