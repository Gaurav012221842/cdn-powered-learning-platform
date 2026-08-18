package com.LearningPlatformApplication.campaign;

import com.LearningPlatformApplication.campaign.dto.CreateCampaignRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;

    public List<Campaign> getAllCampaigns() {
        return campaignRepository.findAll();
    }

    public List<Campaign> getActiveCampaigns() {
        return campaignRepository.findByIsActiveTrue();
    }

    public Campaign createCampaign(CreateCampaignRequest request) {
        Campaign campaign = Campaign.builder()
                .name(request.getName())
                .discountPercentage(request.getDiscountPercentage())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(true)
                .build();
        return campaignRepository.save(campaign);
    }

    public void deleteCampaign(UUID id) {
        campaignRepository.deleteById(id);
    }

    public Campaign toggleCampaign(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with ID: " + id));
        campaign.setIsActive(!Boolean.TRUE.equals(campaign.getIsActive()));
        return campaignRepository.save(campaign);
    }
}
