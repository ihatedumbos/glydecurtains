package com.glydecurtains.service;

import com.glydecurtains.dto.request.CartItemRequest;
import com.glydecurtains.dto.response.CartResponse;

public interface CartService {

    CartResponse getCart();

    CartResponse addItem(CartItemRequest request);

    CartResponse updateItemQuantity(Long cartItemId, int quantity);

    CartResponse removeItem(Long cartItemId);

    void clearCart();
}
