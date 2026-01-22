/**
 * Service para endpoints de Users
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import { decodeJwtPayload, readAuthToken } from '../auth';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
  GetUsersParams,
  PaginatedUsersResponse,
} from '@/types/users';

// Re-exportar tipos
export type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
  GetUsersParams,
  PaginatedUsersResponse,
};

class UsersService {
  /**
   * Obtener todos los usuarios con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetUsersParams) {
    const response = await axiosInstance.get<User[] | ApiResponse<User[]>>('/users', { params });
    const data = (response.data as ApiResponse<User[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Obtener usuario por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<User | ApiResponse<User>>(`/users/${id}`);
    const data = (response.data as ApiResponse<User>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Obtener usuario por email
   */
  async getByEmail(email: string) {
    const response = await axiosInstance.get<User | ApiResponse<User>>('/users/email', {
      params: { email },
    });
    const data = (response.data as ApiResponse<User>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Obtener usuario actual
   */
  async getMe() {
    const token = readAuthToken();
    const payload = token ? decodeJwtPayload(token) : null;
    const userId = payload?.id || payload?.sub;
    if (!userId) {
      return undefined;
    }
    return this.getById(userId);
  }

  /**
   * Crear nuevo usuario
   */
  async create(data: CreateUserDto) {
    const response = await axiosInstance.post<User | ApiResponse<User>>('/users', data);
    const responseData = (response.data as ApiResponse<User>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar usuario
   */
  async update(id: number, data: UpdateUserDto) {
    const response = await axiosInstance.patch<User | ApiResponse<User>>(`/users/${id}`, data);
    const responseData = (response.data as ApiResponse<User>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar usuario
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/users/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }

  /**
   * Actualizar contraseña de un usuario
   * Requiere autenticación JWT
   */
  async updatePassword(id: number, data: UpdatePasswordDto) {
    const response = await axiosInstance.patch<{ success: boolean } | ApiResponse<{ success: boolean }>>(
      `/users/${id}/password`,
      data
    );
    const responseData = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return responseData || { success: false };
  }
}

const usersService = new UsersService();
export default usersService;
