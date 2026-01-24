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
      const response = await axiosInstance.post<Order | ApiResponse<Order>>('/orders', data);
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Create response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? responseData
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en create:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las órdenes con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetOrdersParams) {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse>
      >('/orders', { params });
      
      console.log('[OrderService] GetAll response:', response.data);
      
      // Extraer la data de la respuesta
      let data: PaginatedOrdersResponse | undefined;
      
      // Caso 1: ApiResponse<PaginatedOrdersResponse> (envuelto)
      if (response.data && 'data' in response.data && !('items' in response.data)) {
        console.log('[OrderService] Caso 1: ApiResponse envuelto');
        data = (response.data as unknown as ApiResponse<PaginatedOrdersResponse>).data;
      }
      // Caso 2: PaginatedOrdersResponse directo (sin envolver)
      else if (response.data && 'items' in response.data) {
        console.log('[OrderService] Caso 2: PaginatedOrdersResponse directo');
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      // Caso 3: Respuesta envuelta en { data: {...} }
      else if (response.data && typeof response.data === 'object' && response.data !== null) {
        console.log('[OrderService] Caso 3: Objeto sin items ni data, usando response.data');
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
  async check(data: CheckOrderDto) {
    try {
      const response = await axiosInstance.get<Order | ApiResponse<Order>>('/orders/check', {
        params: data,
      });
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Check response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? responseData
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en check:', error);
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
