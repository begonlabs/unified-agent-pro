import { useState } from 'react';
import { ClientManagementService } from '../services/clientManagementService';
import { EditFormData, UseClientFormReturn } from '../types';

export const useClientForm = (): UseClientFormReturn => {
  const [formData, setFormData] = useState<EditFormData>(ClientManagementService.getDefaultFormData());

  const resetForm = () => {
    setFormData(ClientManagementService.getDefaultFormData());
  };

  const validateForm = (data: EditFormData) => {
    return ClientManagementService.validateFormData(data);
  };

  return {
    formData,
    setFormData,
    resetForm,
    validateForm
  };
};
