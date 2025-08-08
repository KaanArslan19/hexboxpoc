import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { NewCampaignInfo } from '@/app/types';
import { apiFetch } from '@/app/utils/api-client';
import { toast } from 'react-toastify';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await apiFetch('/api/campaignDraft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.details && Array.isArray(errorData.details)) {
          // Handle validation errors
          const errorMessages = errorData.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join(', ');
          
          const errorMsg = `Draft save failed: ${errorMessages}`;
          setSaveError(errorMsg);
          toast.error(errorMsg, {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          // Handle general errors
          const errorMsg = errorData.error || 'Failed to save draft';
          setSaveError(errorMsg);
          toast.error(`Draft save failed: ${errorMsg}`, {
            position: "top-right",
            autoClose: 5000,
          });
        }
      } else {
        // Success - clear any previous errors
        setSaveError(null);
        toast.success('Draft saved successfully', {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMsg = 'Network error while saving draft';
      setSaveError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
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
    deleteDraft,
    saveError,
    isSaving
  };
}
