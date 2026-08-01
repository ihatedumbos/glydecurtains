package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettingsResponse {

    private Long id;
    private String logoHeaderBase64;
    private String logoFooterBase64;
    private String logoMobileBase64;
    private String logoAdminBase64;
    private String faviconBase64;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String socialLinks;
    private String announcementBar;
    private Long activeThemeId;
    private LocalDateTime updatedAt;
}
