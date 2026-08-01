package com.glydecurtains.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettingsUpdateRequest {

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
}
