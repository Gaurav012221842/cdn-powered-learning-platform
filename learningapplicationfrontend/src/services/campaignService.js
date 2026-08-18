import { apiFetch } from './api';

export const campaignService = {
  getActiveCampaigns: () => apiFetch('/campaigns'),
  getAllCampaigns: () => apiFetch('/campaigns/all'),
  createCampaign: (data) => apiFetch('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  toggleCampaign: (id) => apiFetch(`/campaigns/${id}/toggle`, { method: 'PATCH' }),
  deleteCampaign: (id) => apiFetch(`/campaigns/${id}`, { method: 'DELETE' }),
};
