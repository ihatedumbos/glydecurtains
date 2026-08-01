package com.glydecurtains.service;

import com.glydecurtains.dto.response.WishlistResponse;

public interface WishlistService {

    WishlistResponse addToWishlist(Long userId, Long productId);

    void removeFromWishlist(Long userId, Long productId);

    WishlistResponse getWishlist(Long userId);

    void moveToCart(Long userId, Long wishlistItemId);

    int getWishlistCount(Long userId);
}
