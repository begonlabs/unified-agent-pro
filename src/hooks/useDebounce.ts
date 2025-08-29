import { useCallback, useRef } from 'react';

/**
 * Hook para debouncing de funciones
 * Previene ejecuciones múltiples en un período corto de tiempo
 */
export const useDebounce = <T extends (...args: unknown[]) => Promise<unknown>>(
  callback: T,
  delay: number = 300
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);

  const debouncedCallback = useCallback(
    async (...args: Parameters<T>) => {
      // Si ya se está ejecutando, ignorar
      if (isExecutingRef.current) {
        console.log('🚫 Debounce: Función ya ejecutándose, ignorando...');
        return;
      }

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Crear nuevo timeout
      return new Promise<ReturnType<T>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            isExecutingRef.current = true;
            console.log('⚡ Debounce: Ejecutando función...');
            const result = await callback(...args);
            resolve(result as ReturnType<T>);
          } catch (error) {
            reject(error);
          } finally {
            isExecutingRef.current = false;
            timeoutRef.current = null;
          }
        }, delay);
      });
    },
    [callback, delay]
  );

  return debouncedCallback as T;
};

/**
 * Hook para prevenir doble envío de mensajes
 * Específicamente diseñado para el chat
 */
export const useMessageSender = () => {
  const lastMessageRef = useRef<{
    content: string;
    timestamp: number;
    conversationId: string;
  } | null>(null);

  const isDuplicateMessage = useCallback((
    content: string, 
    conversationId: string,
    timeWindow: number = 2000 // 2 segundos
  ): boolean => {
    const now = Date.now();
    const lastMessage = lastMessageRef.current;

    if (
      lastMessage &&
      lastMessage.content === content &&
      lastMessage.conversationId === conversationId &&
      (now - lastMessage.timestamp) < timeWindow
    ) {
      console.log('🚫 Mensaje duplicado detectado y bloqueado:', {
        content,
        timeDiff: now - lastMessage.timestamp
      });
      return true;
    }

    // Actualizar último mensaje
    lastMessageRef.current = {
      content,
      timestamp: now,
      conversationId
    };

    return false;
  }, []);

  return { isDuplicateMessage };
};
