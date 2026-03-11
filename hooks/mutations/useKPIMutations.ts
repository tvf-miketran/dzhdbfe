import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosInstance from '../../helpers/axios';

interface CalculateKPIResponse {
  data: {
    standardKPI: number;
    currentKPI: number;
    lastCalculated: string;
    breakdown?: {
      tickets: number;
      logwork: number;
      quality: number;
    };
  };
  message: string;
  success: boolean;
}

interface CalculateKPIRequest {
  viewType: 'personal' | 'odc'; // personal or odc-overall
  userId?: string; // Required for personal view
}

/**
 * Hook to calculate KPI
 * Call API to recalculate user KPI score
 */
export const useCalculateKPI = () => {
  return useMutation({
    mutationFn: async (params: CalculateKPIRequest) => {
      const endpoint = params.viewType === 'personal' 
        ? `/kpi/calculate/${params.userId}`
        : '/kpi/calculate/odc';
      
      const response = await axiosInstance.post<CalculateKPIResponse>(endpoint);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'KPI calculated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to calculate KPI';
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to fetch KPI data
 */
export const useGetKPI = (viewType: 'personal' | 'odc', userId?: string) => {
  const endpoint = viewType === 'personal' 
    ? `/kpi/${userId}`
    : '/kpi/odc';

  return {
    queryKey: viewType === 'personal' ? ['kpi', 'personal', userId] : ['kpi', 'odc'],
    queryFn: async () => {
      const response = await axiosInstance.get<CalculateKPIResponse>(endpoint);
      return response.data;
    },
  };
};
