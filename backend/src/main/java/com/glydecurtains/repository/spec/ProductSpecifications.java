package com.glydecurtains.repository.spec;

import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.TranslatedContent;
import com.glydecurtains.entity.enums.MediaType;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Builds a JPA {@link Specification} for {@link Product} from a {@link ProductFilterRequest}.
 * Centralizes filter and sort logic used by the admin listing, the public listing and the
 * search endpoint, so every product list on the site filters and orders products the same way
 * and all of it runs in the database (including pagination).
 */
public final class ProductSpecifications {

    public static final String SORT_RELEVANCE = "relevance";
    public static final String SORT_POPULARITY = "popularity";
    public static final String SORT_NEWEST = "newest";
    public static final String SORT_PRICE_ASC = "price_asc";
    public static final String SORT_PRICE_DESC = "price_desc";
    public static final String SORT_FEATURED = "featured";

    private ProductSpecifications() {
    }

    public static Specification<Product> fromFilter(ProductFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter == null) {
                return cb.conjunction();
            }

            String text = normalizedQuery(filter.getQuery());
            if (text != null) {
                String like = "%" + text + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(root.get("brand")), like),
                        cb.like(cb.lower(root.get("tags")), like),
                        cb.like(cb.lower(root.get("material")), like),
                        cb.like(cb.lower(root.get("shortDescription")), like),
                        cb.exists(translationMatch(root, query, cb, like))
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

            List<String> materials = new ArrayList<>(csv(filter.getMaterials()));
            materials.addAll(csv(filter.getMaterial()));
            if (!materials.isEmpty()) {
                predicates.add(cb.lower(root.get("material")).in(materials));
            }

            addJsonListContainsAny(predicates, cb, root.get("colors"), filter.getColors());
            addJsonListContainsAny(predicates, cb, root.get("sizes"), filter.getSizes());

            if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
                Expression<BigDecimal> price = effectivePrice(root, cb);
                if (filter.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(price, filter.getMinPrice()));
                }
                if (filter.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(price, filter.getMaxPrice()));
                }
            }

            if (Boolean.TRUE.equals(filter.getInStock())) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
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
     * Orders results by a named sort. Every ordering ends with createdAt/id tie-breakers so
     * pagination is stable: without them, sorting on a column with many equal values (e.g. a
     * boolean flag) lets the database return rows in any order, and products repeat or go
     * missing between pages.
     *
     * <p>Unknown or blank values fall back to relevance when there is a text query, otherwise
     * popularity. Must be used with an unsorted {@code Pageable}.
     */
    public static Specification<Product> orderedBy(String sortBy, String textQuery) {
        return (root, query, cb) -> {
            // Spring Data reuses the specification for the count query; ordering does not apply there.
            if (Long.class.equals(query.getResultType()) || long.class.equals(query.getResultType())) {
                return cb.conjunction();
            }

            String text = normalizedQuery(textQuery);
            String sort = sortBy == null || sortBy.isBlank()
                    ? (text != null ? SORT_RELEVANCE : SORT_POPULARITY)
                    : sortBy.trim().toLowerCase(Locale.ROOT);

            List<Order> orders = new ArrayList<>();
            // Products with a real photo always come before ones still showing the placeholder.
            orders.add(cb.desc(hasRealPhoto(root, query, cb)));
            switch (sort) {
                case SORT_NEWEST -> { }
                case SORT_PRICE_ASC -> orders.add(cb.asc(effectivePrice(root, cb)));
                case SORT_PRICE_DESC -> orders.add(cb.desc(effectivePrice(root, cb)));
                case SORT_FEATURED -> {
                    orders.add(cb.desc(flag(root, cb, "isFeatured", 1)));
                    orders.add(cb.desc(popularityScore(root, cb)));
                }
                case SORT_RELEVANCE -> {
                    if (text != null) {
                        orders.add(cb.desc(relevanceScore(root, query, cb, text)));
                    }
                    orders.add(cb.desc(popularityScore(root, cb)));
                }
                default -> orders.add(cb.desc(popularityScore(root, cb)));
            }
            orders.add(cb.desc(root.get("createdAt")));
            orders.add(cb.desc(root.get("id")));
            query.orderBy(orders);
            return cb.conjunction();
        };
    }

    /** File name the placeholder upgrader gives images that stand in for a missing product photo. */
    public static final String PLACEHOLDER_IMAGE_FILENAME = "photo-coming-soon.jpg";

    private static Expression<Integer> hasRealPhoto(Root<Product> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        Subquery<Long> photo = query.subquery(Long.class);
        Root<ProductImage> image = photo.from(ProductImage.class);
        photo.select(image.get("id")).where(
                cb.equal(image.get("product"), root),
                cb.equal(image.get("mediaType"), MediaType.IMAGE),
                cb.or(cb.isNull(image.get("originalFilename")),
                        cb.notEqual(image.get("originalFilename"), PLACEHOLDER_IMAGE_FILENAME)));
        return cb.<Integer>selectCase().when(cb.exists(photo), 1).otherwise(0);
    }

    /** offerPrice when set, otherwise basePrice - the price customers actually see and pay. */
    private static Expression<BigDecimal> effectivePrice(Root<Product> root, CriteriaBuilder cb) {
        return cb.coalesce(root.<BigDecimal>get("offerPrice"), root.<BigDecimal>get("basePrice"));
    }

    private static Expression<Integer> popularityScore(Root<Product> root, CriteriaBuilder cb) {
        return cb.sum(
                cb.sum(flag(root, cb, "isBestSeller", 4), flag(root, cb, "isTrending", 3)),
                cb.sum(flag(root, cb, "isFeatured", 2), flag(root, cb, "isNewArrival", 1)));
    }

    private static Expression<Integer> flag(Root<Product> root, CriteriaBuilder cb, String attribute, int weight) {
        return cb.<Integer>selectCase()
                .when(cb.isTrue(root.get(attribute)), weight)
                .otherwise(0);
    }

    private static Expression<Integer> relevanceScore(Root<Product> root, CriteriaQuery<?> query,
                                                      CriteriaBuilder cb, String text) {
        String contains = "%" + text + "%";
        Expression<String> name = cb.lower(root.get("name"));
        Expression<Integer> nameScore = cb.<Integer>selectCase()
                .when(cb.equal(name, text), 100)
                .when(cb.like(name, text + "%"), 80)
                .when(cb.like(name, contains), 60)
                .otherwise(0);

        Expression<Integer> score = nameScore;
        score = cb.sum(score, likeScore(cb, root.get("sku"), contains, 40));
        score = cb.sum(score, likeScore(cb, root.get("brand"), contains, 30));
        score = cb.sum(score, likeScore(cb, root.get("tags"), contains, 20));
        score = cb.sum(score, likeScore(cb, root.get("material"), contains, 15));
        score = cb.sum(score, likeScore(cb, root.get("shortDescription"), contains, 10));
        score = cb.sum(score, cb.<Integer>selectCase()
                .when(cb.exists(translationMatch(root, query, cb, contains)), 50)
                .otherwise(0));
        return score;
    }

    private static Expression<Integer> likeScore(CriteriaBuilder cb, Path<String> column, String pattern, int weight) {
        return cb.<Integer>selectCase()
                .when(cb.like(cb.lower(column), pattern), weight)
                .otherwise(0);
    }

    /** Matches products whose translated content (any language) contains the search text. */
    private static Subquery<Long> translationMatch(Root<Product> root, CriteriaQuery<?> query,
                                                   CriteriaBuilder cb, String likePattern) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<TranslatedContent> tc = sub.from(TranslatedContent.class);
        sub.select(tc.get("entityId")).where(
                // Translations are saved with entity type "PRODUCT"; compare case-insensitively.
                cb.equal(cb.lower(tc.get("entityType")), "product"),
                cb.equal(tc.get("entityId"), root.get("id")),
                cb.like(cb.lower(tc.get("content")), likePattern));
        return sub;
    }

    private static String normalizedQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return query.trim().toLowerCase(Locale.ROOT);
    }

    private static List<String> csv(String csvValues) {
        if (csvValues == null || csvValues.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csvValues.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .toList();
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
        List<String> values = csv(csvValues);
        if (values.isEmpty()) {
            return;
        }
        List<Predicate> anyMatch = new ArrayList<>();
        for (String value : values) {
            anyMatch.add(cb.like(cb.lower(column), "%\"" + value + "\"%"));
        }
        predicates.add(cb.or(anyMatch.toArray(new Predicate[0])));
    }
}
