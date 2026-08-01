package com.glydecurtains.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce entity-level CRUD permission checks on controller/service methods.
 * The PermissionAspect intercepts methods annotated with this and evaluates
 * permissions using the three-tier resolution:
 * 1. Super Admin bypass (always granted)
 * 2. User-level permission override (if exists, use its granted value)
 * 3. Role-level permission default (if exists, use its granted value)
 * 4. Implicit deny (if none of the above match)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {

    /**
     * The entity being accessed (e.g., "products", "categories", "orders", "users",
     * "employees", "cms", "reports", "dashboard", "enquiries", "settings",
     * "store_locations", "feedback", "achievements", "invoices").
     */
    String entity();

    /**
     * The operation being performed (e.g., "CREATE", "READ", "UPDATE", "DELETE").
     */
    String operation();
}
