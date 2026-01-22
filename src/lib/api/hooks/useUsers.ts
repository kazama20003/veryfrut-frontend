/**
 * Custom hooks para User queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usersService, {
  CreateUserDto,
  GetUsersParams,
  UpdatePasswordDto,
  UpdateUserDto,
} from '../services/users-service';
import queryKeys from '../queryKeys';

/**
 * Query: Obtener todos los usuarios con paginación, ordenamiento y búsqueda
 */
export function useUsersQuery(params?: GetUsersParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: () => usersService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener usuario por ID
 */
export function useUserQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(id as number),
    queryFn: () => usersService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Query: Obtener usuario por email
 */
export function useUserByEmailQuery(email: string | null) {
  return useQuery({
    queryKey: queryKeys.users.byEmail(email || ''),
    queryFn: () => usersService.getByEmail(email as string),
    enabled: !!email,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Mutation: Crear usuario
 */
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.create(data),
    onSuccess: (newUser) => {
      if (newUser) {
        // Invalidar lista de usuarios
        queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

        // Actualizar cache con el nuevo usuario
        queryClient.setQueryData(queryKeys.users.detail(newUser.id), newUser);
      }
    },
  });
}

/**
 * Mutation: Actualizar usuario
 */
export function useUpdateUserMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersService.update(id, data),
    onSuccess: (updatedUser) => {
      // Actualizar datos específicos del usuario
      queryClient.setQueryData(queryKeys.users.detail(id), updatedUser);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Mutation: Eliminar usuario
 */
export function useDeleteUserMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Mutation: Actualizar contraseña de usuario
 */
export function useUpdatePasswordMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePasswordDto) => usersService.updatePassword(id, data),
    onSuccess: () => {
      // Invalidar datos del usuario por seguridad
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}
