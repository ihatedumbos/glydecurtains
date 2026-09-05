package com.glydecurtains.config;

import com.glydecurtains.entity.ThemePreset;
import com.glydecurtains.repository.ThemePresetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
public class ThemeDataInitializer implements ApplicationRunner {

    private final ThemePresetRepository themePresetRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (themePresetRepository.count() > 0) {
            return;
        }
        seedThemePresets();
    }

    private void seedThemePresets() {
        // 1. Dark Premium (default and active)
        ThemePreset darkPremium = new ThemePreset();
        darkPremium.setName("Dark Premium");
        darkPremium.setConfig("""
                {"primaryColor":"#1a1a2e","secondaryColor":"#16213e","accentColor":"#e94560","backgroundColor":"#0f0f1a","textColor":"#eaeaea","borderRadius":"8px","shadowIntensity":"high","glassmorphismOpacity":0.15,"animationSpeed":"normal"}""");
        darkPremium.setIsDefault(true);
        darkPremium.setIsActive(true);
        themePresetRepository.save(darkPremium);

        // 2. Light Elegant
        ThemePreset lightElegant = new ThemePreset();
        lightElegant.setName("Light Elegant");
        lightElegant.setConfig("""
                {"primaryColor":"#ffffff","secondaryColor":"#f8f9fa","accentColor":"#6c63ff","backgroundColor":"#ffffff","textColor":"#2d2d2d","borderRadius":"12px","shadowIntensity":"low","glassmorphismOpacity":0.08,"animationSpeed":"normal"}""");
        lightElegant.setIsDefault(false);
        lightElegant.setIsActive(false);
        themePresetRepository.save(lightElegant);

        // 3. Midnight Blue
        ThemePreset midnightBlue = new ThemePreset();
        midnightBlue.setName("Midnight Blue");
        midnightBlue.setConfig("""
                {"primaryColor":"#0d1b2a","secondaryColor":"#1b263b","accentColor":"#00b4d8","backgroundColor":"#0d1b2a","textColor":"#e0e1dd","borderRadius":"6px","shadowIntensity":"medium","glassmorphismOpacity":0.12,"animationSpeed":"fast"}""");
        midnightBlue.setIsDefault(false);
        midnightBlue.setIsActive(false);
        themePresetRepository.save(midnightBlue);

        // 4. Warm Gold
        ThemePreset warmGold = new ThemePreset();
        warmGold.setName("Warm Gold");
        warmGold.setConfig("""
                {"primaryColor":"#2c1810","secondaryColor":"#3d2317","accentColor":"#d4a574","backgroundColor":"#1a0f0a","textColor":"#f5e6d3","borderRadius":"10px","shadowIntensity":"medium","glassmorphismOpacity":0.10,"animationSpeed":"normal"}""");
        warmGold.setIsDefault(false);
        warmGold.setIsActive(false);
        themePresetRepository.save(warmGold);

        // 5. Forest Green
        ThemePreset forestGreen = new ThemePreset();
        forestGreen.setName("Forest Green");
        forestGreen.setConfig("""
                {"primaryColor":"#1b2d1b","secondaryColor":"#2d4a2d","accentColor":"#6bcb77","backgroundColor":"#0f1f0f","textColor":"#e8f5e9","borderRadius":"8px","shadowIntensity":"medium","glassmorphismOpacity":0.12,"animationSpeed":"normal"}""");
        forestGreen.setIsDefault(false);
        forestGreen.setIsActive(false);
        themePresetRepository.save(forestGreen);
    }
}
