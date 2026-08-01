package com.glydecurtains.controller;

import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.WishlistResponse;
import com.glydecurtains.security.JwtTokenProvider;
import com.glydecurtains.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        WishlistResponse response = wishlistService.getWishlist(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<WishlistResponse>> addToWishlist(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long productId) {
        Long userId = extractUserId(authHeader);
        WishlistResponse response = wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.status(201).body(ApiResponse.created("Added to wishlist", response));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long productId) {
        Long userId = extractUserId(authHeader);
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist", null));
    }

    @PostMapping("/{itemId}/move-to-cart")
    public ResponseEntity<ApiResponse<Void>> moveToCart(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long itemId) {
        Long userId = extractUserId(authHeader);
        wishlistService.moveToCart(userId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Moved to cart", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Integer>> getWishlistCount(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        int count = wishlistService.getWishlistCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("Invalid Authorization header");
    }
}
