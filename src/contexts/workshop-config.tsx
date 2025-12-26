'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkshopConfig } from '@/types/database';

interface WorkshopConfigContextType {
  config: WorkshopConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultConfig: Partial<WorkshopConfig> = {
  name: 'Taller Pro',
  order_prefix: 'ORD',
  currency: 'USD',
};

const WorkshopConfigContext = createContext<WorkshopConfigContextType>({
  config: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

export function WorkshopConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WorkshopConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('workshop_config')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching workshop config:', fetchError);
        setError(fetchError.message);
        // Use default config on error
        setConfig(defaultConfig as WorkshopConfig);
      } else if (data) {
        console.log('Workshop config loaded:', data.name);
        setConfig(data);
      } else {
        // No config exists yet, use defaults
        console.log('No workshop config found, using defaults');
        setConfig(defaultConfig as WorkshopConfig);
      }
    } catch (err) {
      console.error('Error in fetchConfig:', err);
      setError('Error al cargar configuración');
      setConfig(defaultConfig as WorkshopConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <WorkshopConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refetch: fetchConfig,
      }}
    >
      {children}
    </WorkshopConfigContext.Provider>
  );
}

export function useWorkshopConfig() {
  const context = useContext(WorkshopConfigContext);
  if (!context) {
    throw new Error('useWorkshopConfig must be used within a WorkshopConfigProvider');
  }
  return context;
}

// Helper hook to get just the workshop name with fallback
export function useWorkshopName() {
  const { config, isLoading } = useWorkshopConfig();
  return {
    name: config?.name || 'Taller Pro',
    isLoading,
  };
}
