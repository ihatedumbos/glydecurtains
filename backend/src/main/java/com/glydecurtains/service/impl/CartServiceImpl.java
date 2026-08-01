package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.CartItemRequest;
import com.glydecurtains.dto.response.CartItemResponse;
import com.glydecurtains.dto.response.CartResponse;
import com.glydecurtains.entity.Cart;
import com.glydecurtains.entity.CartItem;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductVariant;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CartItemRepository;
import com.glydecurtains.repository.CartRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.ProductVariantRepository;
import com.glydecurtains.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    public static final int MAX_QUANTITY_PER_ITEM = 10;
    private static final int CART_ITEM_EXPIRY_DAYS = 90;

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    @Transactional
    public CartResponse getCart() {
        Long userId = getCurrentUserId();
        Cart cart = getOrCreateCart(userId);

        // Auto-remove items older than 90 days
        removeExpiredItems(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(CartItemRequest request) {
        Long userId = getCurrentUserId();
        Cart cart = getOrCreateCart(userId);

        // Validate quantity limit
        if (request.getQuantity() > MAX_QUANTITY_PER_ITEM) {
            throw new BusinessException(
                    "Maximum quantity per item is " + MAX_QUANTITY_PER_ITEM,
                    "CART_QUANTITY_LIMIT_EXCEEDED");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BusinessException("Product not found", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new BusinessException("Product is not available for purchase", "PRODUCT_UNAVAILABLE");
        }

        // Determine price and validate stock
        BigDecimal unitPrice;
        int availableStock;

        if (request.getVariantId() != null) {
            ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new BusinessException("Product variant not found", "VARIANT_NOT_FOUND", HttpStatus.NOT_FOUND));

            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new BusinessException("Variant does not belong to the specified product", "VARIANT_MISMATCH");
            }

            unitPrice = variant.getPrice();
            availableStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
        } else {
            unitPrice = product.getOfferPrice() != null ? product.getOfferPrice() : product.getBasePrice();
            availableStock = product.getStockQuantity();
        }

        if (request.getQuantity() > availableStock) {
            throw new BusinessException("Insufficient stock. Available: " + availableStock, "INSUFFICIENT_STOCK");
        }

        // Check if item already exists in cart (same product + variant combination)
        Optional<CartItem> existingItem;
        if (request.getVariantId() != null) {
            existingItem = cartItemRepository.findByCartIdAndProductIdAndVariantId(
                    cart.getId(), request.getProductId(), request.getVariantId());
        } else {
            existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), request.getProductId());
            // Filter out items that have a variantId set
            if (existingItem.isPresent() && existingItem.get().getVariantId() != null) {
                existingItem = Optional.empty();
            }
        }

        if (existingItem.isPresent()) {
            // Update quantity of existing item
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            if (newQuantity > MAX_QUANTITY_PER_ITEM) {
                throw new BusinessException(
                        "Cannot add more. Maximum quantity per item is " + MAX_QUANTITY_PER_ITEM
                                + ". Current quantity in cart: " + item.getQuantity(),
                        "CART_QUANTITY_LIMIT_EXCEEDED");
            }
            if (newQuantity > availableStock) {
                throw new BusinessException("Insufficient stock. Available: " + availableStock, "INSUFFICIENT_STOCK");
            }
            item.setQuantity(newQuantity);
            item.setUnitPrice(unitPrice); // Update price snapshot
            cartItemRepository.save(item);
        } else {
            // Create new cart item
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(request.getProductId());
            newItem.setVariantId(request.getVariantId());
            newItem.setQuantity(request.getQuantity());
            newItem.setUnitPrice(unitPrice);
            cart.getItems().add(newItem);
            cartRepository.save(cart);
        }

        // Refresh cart
        Cart updatedCart = cartRepository.findByUserId(userId).orElse(cart);
        return buildCartResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(Long cartItemId, int quantity) {
        Long userId = getCurrentUserId();
        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException("Cart item not found", "CART_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BusinessException("Cart item does not belong to your cart", "CART_ITEM_MISMATCH", HttpStatus.FORBIDDEN);
        }

        if (quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
            throw new BusinessException(
                    "Quantity must be between 1 and " + MAX_QUANTITY_PER_ITEM,
                    "CART_QUANTITY_LIMIT_EXCEEDED");
        }

        // Validate stock
        int availableStock = getAvailableStock(cartItem.getProductId(), cartItem.getVariantId());
        if (quantity > availableStock) {
            throw new BusinessException("Insufficient stock. Available: " + availableStock, "INSUFFICIENT_STOCK");
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        Cart updatedCart = cartRepository.findByUserId(userId).orElse(cart);
        return buildCartResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long cartItemId) {
        Long userId = getCurrentUserId();
        Cart cart = getOrCreateCart(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException("Cart item not found", "CART_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BusinessException("Cart item does not belong to your cart", "CART_ITEM_MISMATCH", HttpStatus.FORBIDDEN);
        }

        cart.getItems().remove(cartItem);
        cartRepository.save(cart);

        Cart updatedCart = cartRepository.findByUserId(userId).orElse(cart);
        return buildCartResponse(updatedCart);
    }

    @Override
    @Transactional
    public void clearCart() {
        Long userId = getCurrentUserId();
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    // --- Private helpers ---

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            return cartRepository.save(newCart);
        });
    }

    private void removeExpiredItems(Cart cart) {
        LocalDateTime expiryThreshold = LocalDateTime.now().minusDays(CART_ITEM_EXPIRY_DAYS);
        List<CartItem> expiredItems = cart.getItems().stream()
                .filter(item -> item.getAddedAt() != null && item.getAddedAt().isBefore(expiryThreshold))
                .toList();

        if (!expiredItems.isEmpty()) {
            cart.getItems().removeAll(expiredItems);
            cartRepository.save(cart);
        }
    }

    private int getAvailableStock(Long productId, Long variantId) {
        if (variantId != null) {
            return productVariantRepository.findById(variantId)
                    .map(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                    .orElse(0);
        }
        return productRepository.findById(productId)
                .map(Product::getStockQuantity)
                .orElse(0);
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            CartItemResponse itemResponse = buildCartItemResponse(item);
            itemResponses.add(itemResponse);
            if (itemResponse.isAvailable()) {
                subtotal = subtotal.add(itemResponse.getSubtotal());
            }
            totalItems += item.getQuantity();
        }

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    private CartItemResponse buildCartItemResponse(CartItem item) {
        CartItemResponse.CartItemResponseBuilder builder = CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .addedAt(item.getAddedAt());

        // Fetch product info and check availability
        Optional<Product> productOpt = productRepository.findById(item.getProductId());
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            builder.productName(product.getName());
            builder.productSku(product.getSku());

            if (product.getStatus() != ProductStatus.ACTIVE) {
                builder.available(false);
                builder.unavailableReason("Product has been deactivated");
            } else if (product.getStockQuantity() <= 0 && item.getVariantId() == null) {
                builder.available(false);
                builder.unavailableReason("Product is out of stock");
            } else {
                builder.available(true);
            }

            // Check variant availability
            if (item.getVariantId() != null) {
                Optional<ProductVariant> variantOpt = productVariantRepository.findById(item.getVariantId());
                if (variantOpt.isPresent()) {
                    ProductVariant variant = variantOpt.get();
                    String desc = buildVariantDescription(variant);
                    builder.variantDescription(desc);
                    if (variant.getStockQuantity() != null && variant.getStockQuantity() <= 0) {
                        builder.available(false);
                        builder.unavailableReason("Selected variant is out of stock");
                    }
                } else {
                    builder.available(false);
                    builder.unavailableReason("Selected variant no longer exists");
                }
            }
        } else {
            builder.available(false);
            builder.unavailableReason("Product no longer exists");
        }

        return builder.build();
    }

    private String buildVariantDescription(ProductVariant variant) {
        List<String> parts = new ArrayList<>();
        if (variant.getMaterial() != null && !variant.getMaterial().isBlank()) {
            parts.add(variant.getMaterial());
        }
        if (variant.getSize() != null && !variant.getSize().isBlank()) {
            parts.add(variant.getSize());
        }
        if (variant.getColor() != null && !variant.getColor().isBlank()) {
            parts.add(variant.getColor());
        }
        return parts.isEmpty() ? null : String.join(" / ", parts);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new BusinessException("User not authenticated", "UNAUTHENTICATED", HttpStatus.UNAUTHORIZED);
    }
}
