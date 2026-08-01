package com.glydecurtains.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "logo_header_base64", columnDefinition = "TEXT")
    private String logoHeaderBase64;

    @Lob
    @Column(name = "logo_footer_base64", columnDefinition = "TEXT")
    private String logoFooterBase64;

    @Lob
    @Column(name = "logo_mobile_base64", columnDefinition = "TEXT")
    private String logoMobileBase64;

    @Lob
    @Column(name = "logo_admin_base64", columnDefinition = "TEXT")
    private String logoAdminBase64;

    @Lob
    @Column(name = "favicon_base64", columnDefinition = "TEXT")
    private String faviconBase64;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "address")
    private String address;

    @Lob
    @Column(name = "social_links", columnDefinition = "TEXT")
    private String socialLinks;

    @Column(name = "announcement_bar")
    private String announcementBar;

    @Column(name = "active_theme_id")
    private Long activeThemeId;
}
