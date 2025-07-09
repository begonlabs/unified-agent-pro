import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sistema robusto de limpieza de autenticación
export const cleanupAuthState = () => {
  console.log('Cleaning up auth state...');
  
  try {
    // Limpiar localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
        console.log('Removed from localStorage:', key);
      }
    });

    // Limpiar sessionStorage si existe
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
          console.log('Removed from sessionStorage:', key);
        }
      });
    }
    
    console.log('Auth state cleanup completed');
  } catch (error) {
    console.error('Error during auth cleanup:', error);
  }
};

// Logout robusto con limpieza completa
export const robustSignOut = async () => {
  console.log('Starting robust sign out...');
  
  try {
    // Paso 1: Limpiar estado
    cleanupAuthState();
    
    // Paso 2: Intentar logout global
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Global sign out successful');
    } catch (err) {
      console.warn('Global sign out failed, continuing:', err);
    }
    
    // Paso 3: Forzar recarga completa para estado limpio
    console.log('Redirecting to auth page...');
    window.location.href = '/auth';
    
  } catch (error) {
    console.error('Error during robust sign out:', error);
    // Forzar redirección incluso si hay errores
    window.location.href = '/auth';
  }
};

// Función para verificar y limpiar antes de login
export const prepareForSignIn = async () => {
  console.log('Preparing for sign in...');
  
  // Limpiar estado existente
  cleanupAuthState();
  
  // Intentar logout por si hay sesión residual
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    console.warn('Pre-signin logout failed, continuing:', err);
  }
};
