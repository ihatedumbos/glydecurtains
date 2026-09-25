package com.glydecurtains.repository.spec;

import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.entity.Product;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Builds a JPA {@link Specification} for {@link Product} from a {@link ProductFilterRequest}.
 * Centralizes filter logic used by both the admin and public product listing endpoints so
 * that all filter fields (category, sub-category, collection, color, size, material,
 * price range, status and merchandising flags) are actually applied - previously several of
 * these fields were silently ignored.
 */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> fromFilter(ProductFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter == null) {
                return cb.conjunction();
            }

            if (filter.getQuery() != null && !filter.getQuery().isBlank()) {
                String like = "%" + filter.getQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(root.get("brand")), like),
                        cb.like(cb.lower(root.get("tags")), like)
                ));
            }

            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("categoryId"), filter.getCategoryId()));
            }

            if (filter.getSubCategoryId() != null) {
                predicates.add(cb.equal(root.get("subCategoryId"), filter.getSubCategoryId()));
            }

            if (filter.getCollectionId() != null) {
                predicates.add(cb.equal(root.get("collectionId"), filter.getCollectionId()));
            }

            if (filter.getMaterial() != null && !filter.getMaterial().isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("material")), filter.getMaterial().toLowerCase()));
            }

            addJsonListContainsAny(predicates, cb, root.get("colors"), filter.getColors());
            addJsonListContainsAny(predicates, cb, root.get("sizes"), filter.getSizes());

            if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
                var effectivePrice = cb.coalesce(root.get("offerPrice"), root.get("basePrice"));
                if (filter.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(effectivePrice.as(BigDecimal.class), filter.getMinPrice()));
                }
                if (filter.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(effectivePrice.as(BigDecimal.class), filter.getMaxPrice()));
                }
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getIsFeatured() != null) {
                predicates.add(cb.equal(root.get("isFeatured"), filter.getIsFeatured()));
            }
            if (filter.getIsTrending() != null) {
                predicates.add(cb.equal(root.get("isTrending"), filter.getIsTrending()));
            }
            if (filter.getIsNewArrival() != null) {
                predicates.add(cb.equal(root.get("isNewArrival"), filter.getIsNewArrival()));
            }
            if (filter.getIsBestSeller() != null) {
                predicates.add(cb.equal(root.get("isBestSeller"), filter.getIsBestSeller()));
            }
            if (filter.getIsPremium() != null) {
                predicates.add(cb.equal(root.get("isPremium"), filter.getIsPremium()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * colors/sizes are stored as JSON string arrays (e.g. {@code ["Red","Blue"]}).
     * Matches if the column contains any of the comma-separated requested values,
     * case-insensitively, using a quoted substring match.
     */
    private static void addJsonListContainsAny(List<Predicate> predicates,
                                                CriteriaBuilder cb,
                                                Path<String> column,
                                                String csvValues) {
        if (csvValues == null || csvValues.isBlank()) {
            return;
        }
        List<String> values = Arrays.stream(csvValues.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        if (values.isEmpty()) {
            return;
        }
        List<Predicate> anyMatch = new ArrayList<>();
        for (String value : values) {
            anyMatch.add(cb.like(cb.lower(column), "%\"" + value.toLowerCase() + "\"%"));
        }
        predicates.add(cb.or(anyMatch.toArray(new Predicate[0])));
    }
}
