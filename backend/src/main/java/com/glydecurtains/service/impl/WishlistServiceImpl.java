package com.glydecurtains.service.impl;

import com.glydecurtains.dto.response.WishlistItemResponse;
import com.glydecurtains.dto.response.WishlistResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Override
    @Transactional
    public WishlistResponse addToWishlist(Long userId, Long productId) {
        // Validate product exists and is active
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("Product not found", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new BusinessException("Product is not available", "PRODUCT_NOT_AVAILABLE");
        }

        // Check if already in wishlist
        if (wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new BusinessException("Product already in wishlist", "ALREADY_IN_WISHLIST");
        }

        WishlistItem item = new WishlistItem();
        item.setUserId(userId);
        item.setProductId(productId);
        wishlistItemRepository.save(item);

        return getWishlist(userId);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        if (!wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new BusinessException("Item not found in wishlist", "WISHLIST_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND);
        }
        wishlistItemRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public WishlistResponse getWishlist(Long userId) {
        List<WishlistItem> items = wishlistItemRepository.findByUserIdOrderByAddedAtDesc(userId);

        List<WishlistItemResponse> itemResponses = items.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return WishlistResponse.builder()
                .items(itemResponses)
                .totalItems(itemResponses.size())
                .build();
    }

    @Override
    @Transactional
    public void moveToCart(Long userId, Long wishlistItemId) {
        WishlistItem wishlistItem = wishlistItemRepository.findById(wishlistItemId)
                .orElseThrow(() -> new BusinessException("Wishlist item not found", "WISHLIST_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (!wishlistItem.getUserId().equals(userId)) {
            throw new BusinessException("Wishlist item does not belong to user", "UNAUTHORIZED", HttpStatus.FORBIDDEN);
        }

        Product product = productRepository.findById(wishlistItem.getProductId())
                .orElseThrow(() -> new BusinessException("Product not found", "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new BusinessException("Product is not available", "PRODUCT_NOT_AVAILABLE");
        }

        if (product.getStockQuantity() <= 0) {
            throw new BusinessException("Product is out of stock", "OUT_OF_STOCK");
        }

        // Get or create cart for user
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserId(userId);
                    return cartRepository.save(newCart);
                });

        // Check if product already in cart
        boolean alreadyInCart = cart.getItems().stream()
                .anyMatch(ci -> ci.getProductId().equals(product.getId()));

        if (!alreadyInCart) {
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProductId(product.getId());
            cartItem.setQuantity(1);
            cartItem.setUnitPrice(product.getOfferPrice() != null ? product.getOfferPrice() : product.getBasePrice());
            cartItemRepository.save(cartItem);
        }

        // Remove from wishlist
        wishlistItemRepository.delete(wishlistItem);
    }

    @Override
    @Transactional(readOnly = true)
    public int getWishlistCount(Long userId) {
        return wishlistItemRepository.countByUserId(userId);
    }

    private WishlistItemResponse mapToResponse(WishlistItem item) {
        Product product = productRepository.findById(item.getProductId()).orElse(null);

        if (product == null) {
            return WishlistItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProductId())
                    .productName("Product unavailable")
                    .inStock(false)
                    .addedAt(item.getAddedAt())
                    .build();
        }

        // Get thumbnail image
        String thumbnailBase64 = product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsThumbnail()))
                .findFirst()
                .or(() -> product.getImages().stream().findFirst())
                .map(img -> "data:" + img.getMimeType() + ";base64," + img.getBase64Data())
                .orElse(null);

        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productImage(thumbnailBase64)
                .basePrice(product.getBasePrice())
                .offerPrice(product.getOfferPrice())
                .inStock(product.getStockQuantity() > 0 && product.getStatus() == ProductStatus.ACTIVE)
                .addedAt(item.getAddedAt())
                .build();
    }
}
