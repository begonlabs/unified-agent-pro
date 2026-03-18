import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type QuotaStatus = 'ok' | 'warning' | 'critical';

export const useClientQuotaCheck = (userEmail?: string) => {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus>('ok');
  const [clientCount, setClientCount] = useState(0);
  const [clientLimit, setClientLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkQuota = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const userId = session.user.id;

        // Fetch user profile limits
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('clients_limit, is_trial, plan_type')
          .eq('user_id', userId)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching profile limits:", profileError);
          if (isMounted) setIsLoading(false);
          return;
        }

        // If trial or special plan without limit in new logic, it might be 999999
        const typedProfile = profile as any;
        if (typedProfile.is_trial || typedProfile.clients_limit >= 999900) {
          if (isMounted) setIsLoading(false);
          return; // Unlimited or trial skips proactive warning
        }

        const limit = typedProfile.clients_limit || 0;
        if (isMounted) setClientLimit(limit);

        // Fetch exact CRM clients count
        const { count, error: countError } = await supabase
          .from('crm_clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (countError) {
          console.error("Error fetching CRM client count:", countError);
          if (isMounted) setIsLoading(false);
          return;
        }

        const currentCount = count || 0;
        if (isMounted) setClientCount(currentCount);

        if (limit > 0) {
          const usagePercentage = (currentCount / limit) * 100;
          
          if (usagePercentage >= 100) {
            if (isMounted) setQuotaStatus('critical');
          } else if (usagePercentage >= 80) {
            // Check if user already dismissed warning today
            const lastDismissedStr = localStorage.getItem('dismissed_quota_warning_date');
            
            if (lastDismissedStr) {
              const lastDismissedDate = new Date(lastDismissedStr);
              const today = new Date();
              // If dismissed today, don't show warning again
              if (lastDismissedDate.toDateString() === today.toDateString()) {
                if (isMounted) setQuotaStatus('ok');
              } else {
                if (isMounted) setQuotaStatus('warning');
              }
            } else {
              if (isMounted) setQuotaStatus('warning');
            }
          } else {
            if (isMounted) setQuotaStatus('ok');
          }
        }
      } catch (error) {
        console.error("Exception checking quota:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkQuota();

    return () => {
      isMounted = false;
    };
  }, [userEmail]); // Re-run if user identity theoretically changes

  const dismissWarning = () => {
    localStorage.setItem('dismissed_quota_warning_date', new Date().toISOString());
    setQuotaStatus('ok'); // Clear from UI proactively
  };

  return { quotaStatus, clientCount, clientLimit, isLoading, dismissWarning };
};
