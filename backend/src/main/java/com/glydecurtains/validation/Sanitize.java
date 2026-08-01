package com.glydecurtains.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks controller method parameters or DTO fields for XSS sanitization.
 * When applied to a method, the AOP aspect will sanitize all String fields
 * of the method's parameters by stripping HTML/script tags.
 * When applied to a field, it indicates that field should be sanitized.
 */
@Target({ElementType.METHOD, ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Sanitize {

    /**
     * If true, allows basic formatting tags (b, i, u, em, strong, p, br, ul, ol, li).
     * If false (default), strips all HTML tags completely.
     */
    boolean allowBasicFormatting() default false;
}
