package com.glydecurtains.service.impl;

import com.glydecurtains.entity.ProductVariant;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Picks the variant a product is listed with by default: the smallest size, and among those the
 * first colour entered. Sizes are compared by their leading number ("4 ft" before "10 ft").
 */
final class VariantDefaults {

    private static final Pattern LEADING_NUMBER = Pattern.compile("(\\d+(?:\\.\\d+)?)");

    private VariantDefaults() {
    }

    static Optional<ProductVariant> defaultVariant(List<ProductVariant> variants) {
        return variants.stream()
                .filter(v -> v.getPrice() != null && v.getPrice().compareTo(BigDecimal.ZERO) > 0)
                .min(Comparator.comparing((ProductVariant v) -> sizeNumber(v.getSize())));
    }

    static double sizeNumber(String size) {
        if (size == null) {
            return Double.MAX_VALUE;
        }
        Matcher matcher = LEADING_NUMBER.matcher(size);
        return matcher.find() ? Double.parseDouble(matcher.group(1)) : Double.MAX_VALUE - 1;
    }
}
