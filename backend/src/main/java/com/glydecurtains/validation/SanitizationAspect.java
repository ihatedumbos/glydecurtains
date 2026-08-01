package com.glydecurtains.validation;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;

/**
 * AOP aspect that intercepts methods annotated with @Sanitize and strips
 * HTML/script tags from String fields of the method parameters.
 */
@Aspect
@Component
public class SanitizationAspect {

    /**
     * Policy that strips ALL HTML tags - used for plain text fields.
     */
    private static final PolicyFactory STRIP_ALL_POLICY = new HtmlPolicyBuilder()
            .toFactory();

    /**
     * Policy that allows basic formatting tags for rich text fields.
     */
    private static final PolicyFactory BASIC_FORMATTING_POLICY = new HtmlPolicyBuilder()
            .allowElements("b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li",
                    "h1", "h2", "h3", "h4", "h5", "h6", "a", "span", "blockquote")
            .allowUrlProtocols("https", "http")
            .allowAttributes("href").onElements("a")
            .allowAttributes("class").globally()
            .requireRelNofollowOnLinks()
            .toFactory();

    @Around("@annotation(sanitize)")
    public Object sanitizeMethodParams(ProceedingJoinPoint joinPoint, Sanitize sanitize) throws Throwable {
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < args.length; i++) {
            if (args[i] == null) {
                continue;
            }
            if (args[i] instanceof String stringArg) {
                args[i] = sanitizeString(stringArg, sanitize.allowBasicFormatting());
            } else if (!isPrimitiveOrWrapper(args[i].getClass())) {
                sanitizeObject(args[i]);
            }
        }

        return joinPoint.proceed(args);
    }

    /**
     * Sanitizes all String fields of an object. Fields annotated with @Sanitize(allowBasicFormatting=true)
     * will allow basic formatting tags; all other String fields are stripped completely.
     */
    private void sanitizeObject(Object obj) {
        if (obj == null) {
            return;
        }

        Class<?> clazz = obj.getClass();
        for (Field field : clazz.getDeclaredFields()) {
            if (field.getType() != String.class) {
                continue;
            }

            field.setAccessible(true);
            try {
                String value = (String) field.get(obj);
                if (value == null || value.isEmpty()) {
                    continue;
                }

                boolean allowFormatting = false;
                Sanitize fieldAnnotation = field.getAnnotation(Sanitize.class);
                if (fieldAnnotation != null) {
                    allowFormatting = fieldAnnotation.allowBasicFormatting();
                }

                field.set(obj, sanitizeString(value, allowFormatting));
            } catch (IllegalAccessException e) {
                // Skip fields that cannot be accessed
            }
        }
    }

    /**
     * Sanitizes a string by applying the appropriate OWASP HTML policy.
     */
    public static String sanitizeString(String input, boolean allowBasicFormatting) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        if (allowBasicFormatting) {
            return BASIC_FORMATTING_POLICY.sanitize(input);
        }
        return STRIP_ALL_POLICY.sanitize(input);
    }

    /**
     * Convenience method for stripping all HTML from a string.
     */
    public static String stripAllHtml(String input) {
        return sanitizeString(input, false);
    }

    /**
     * Convenience method for sanitizing rich text (allowing basic formatting).
     */
    public static String sanitizeRichText(String input) {
        return sanitizeString(input, true);
    }

    private boolean isPrimitiveOrWrapper(Class<?> clazz) {
        return clazz.isPrimitive()
                || clazz == String.class
                || clazz == Boolean.class
                || clazz == Integer.class
                || clazz == Long.class
                || clazz == Double.class
                || clazz == Float.class
                || clazz == Short.class
                || clazz == Byte.class
                || clazz == Character.class;
    }
}
