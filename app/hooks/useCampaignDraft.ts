import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { NewCampaignInfo } from '@/app/types';
import { apiFetch } from '@/app/utils/api-client';

// Extended campaign form data type to include logoPreview
interface CampaignFormData extends Omit<Partial<NewCampaignInfo>, 'social_links' | 'deadline' | 'logo'> {
  logoPreview?: string | null;
  discord?: string;
  telegram?: string;
  website?: string;
  linkedIn?: string;
  deadline?: string | number;
  logo?: File | null;
  updatedAt?: Date;
}

export function useCampaignDraft(initialData: any) {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  
  // Check for existing draft on component mount
  useEffect(() => {
    const checkForDraft = async () => {
      try {
        const response = await apiFetch('/api/campaignDraft');
        if (response.ok) {
          const data = await response.json();
          if (data?.formData) {
            setHasDraft(true);
            setShowRestoreModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking for draft:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForDraft();
  }, []);
  
  // Save draft when form data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveDraft = debounce(async (data: CampaignFormData) => {
    try {
      await apiFetch('/api/campaignDraft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data })
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, 1000); // 1 second debounce
  
  // Handle form changes and save draft
  const updateFormData = (newData: Partial<CampaignFormData>) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    saveDraft(updatedData);
  };
  
  // Load draft data
  const loadDraft = async (): Promise<CampaignFormData | null> => {
    try {
      const response = await apiFetch('/api/campaignDraft');
      if (response.ok) {
        const data = await response.json();
        if (data?.formData) {
          setFormData(data.formData);
          return data.formData;
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  };
  
  // Delete draft after successful submission
  const deleteDraft = async () => {
    try {
      await apiFetch('/api/campaignDraft', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };
  
  return {
    formData,
    updateFormData,
    isLoading,
    hasDraft,
    showRestoreModal,
    setShowRestoreModal,
    loadDraft,
    deleteDraft
  };
}
