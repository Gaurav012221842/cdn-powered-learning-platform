import { useState, useEffect } from 'react';
import { campaignService } from '../services/campaignService';

export const useCampaign = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    campaignService.getActiveCampaigns()
      .then(res => setCampaigns(res.data))
      .catch(() => setCampaigns([]));
  }, []);

  return { campaigns };
};
