package com.glydecurtains.service;

import com.glydecurtains.dto.response.WishlistResponse;
import com.glydecurtains.entity.Cart;
import com.glydecurtains.entity.CartItem;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.WishlistItem;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CartItemRepository;
import com.glydecurtains.repository.CartRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.WishlistItemRepository;
import com.glydecurtains.service.impl.WishlistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistItemRepository wishlistItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private WishlistServiceImpl wishlistService;

    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 10L;
    private static final Long WISHLIST_ITEM_ID = 100L;

    private Product activeProduct;
    private WishlistItem wishlistItem;

    @BeforeEach
    void setUp() {
        activeProduct = new Product();
        activeProduct.setId(PRODUCT_ID);
        activeProduct.setName("Premium Curtain");
        activeProduct.setStatus(ProductStatus.ACTIVE);
        activeProduct.setBasePrice(new BigDecimal("99.99"));
        activeProduct.setOfferPrice(new BigDecimal("79.99"));
        activeProduct.setStockQuantity(10);
        activeProduct.setImages(new ArrayList<>());

        wishlistItem = new WishlistItem();
        wishlistItem.setId(WISHLIST_ITEM_ID);
        wishlistItem.setUserId(USER_ID);
        wishlistItem.setProductId(PRODUCT_ID);
    }

    @Nested
    @DisplayName("addToWishlist")
    class AddToWishlist {

        @Test
        @DisplayName("should add product to wishlist successfully")
        void shouldAddProductToWishlist() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(wishlistItemRepository.existsByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(false);
            when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(wishlistItem);
            when(wishlistItemRepository.findByUserIdOrderByAddedAtDesc(USER_ID)).thenReturn(List.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));

            WishlistResponse response = wishlistService.addToWishlist(USER_ID, PRODUCT_ID);

            assertThat(response).isNotNull();
            assertThat(response.getTotalItems()).isEqualTo(1);
            verify(wishlistItemRepository).save(any(WishlistItem.class));
        }

        @Test
        @DisplayName("should throw exception when adding duplicate product (not idempotent in current impl)")
        void shouldThrowWhenDuplicateAdd() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(wishlistItemRepository.existsByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(true);

            assertThatThrownBy(() -> wishlistService.addToWishlist(USER_ID, PRODUCT_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already in wishlist");
        }

        @Test
        @DisplayName("should throw exception when product not found")
        void shouldThrowWhenProductNotFound() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wishlistService.addToWishlist(USER_ID, PRODUCT_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Product not found");
        }

        @Test
        @DisplayName("should throw exception when product is not active")
        void shouldThrowWhenProductNotActive() {
            activeProduct.setStatus(ProductStatus.ARCHIVED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));

            assertThatThrownBy(() -> wishlistService.addToWishlist(USER_ID, PRODUCT_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not available");
        }
    }

    @Nested
    @DisplayName("removeFromWishlist")
    class RemoveFromWishlist {

        @Test
        @DisplayName("should remove product from wishlist successfully")
        void shouldRemoveFromWishlist() {
            when(wishlistItemRepository.existsByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(true);

            wishlistService.removeFromWishlist(USER_ID, PRODUCT_ID);

            verify(wishlistItemRepository).deleteByUserIdAndProductId(USER_ID, PRODUCT_ID);
        }

        @Test
        @DisplayName("should throw exception when item not in wishlist")
        void shouldThrowWhenItemNotInWishlist() {
            when(wishlistItemRepository.existsByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(false);

            assertThatThrownBy(() -> wishlistService.removeFromWishlist(USER_ID, PRODUCT_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not found in wishlist");
        }
    }

    @Nested
    @DisplayName("moveToCart")
    class MoveToCart {

        @Test
        @DisplayName("should move wishlist item to cart and remove from wishlist")
        void shouldMoveToCartSuccessfully() {
            Cart cart = new Cart();
            cart.setId(1L);
            cart.setUserId(USER_ID);
            cart.setItems(new ArrayList<>());

            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(new CartItem());

            wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID);

            verify(cartItemRepository).save(any(CartItem.class));
            verify(wishlistItemRepository).delete(wishlistItem);
        }

        @Test
        @DisplayName("should create new cart if user has no cart")
        void shouldCreateNewCartIfNoneExists() {
            Cart newCart = new Cart();
            newCart.setId(2L);
            newCart.setUserId(USER_ID);
            newCart.setItems(new ArrayList<>());

            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class))).thenReturn(newCart);
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(new CartItem());

            wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID);

            verify(cartRepository).save(any(Cart.class));
            verify(cartItemRepository).save(any(CartItem.class));
            verify(wishlistItemRepository).delete(wishlistItem);
        }

        @Test
        @DisplayName("should not add duplicate to cart but still remove from wishlist")
        void shouldNotAddDuplicateToCart() {
            CartItem existingCartItem = new CartItem();
            existingCartItem.setProductId(PRODUCT_ID);

            Cart cart = new Cart();
            cart.setId(1L);
            cart.setUserId(USER_ID);
            cart.setItems(List.of(existingCartItem));

            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));

            wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID);

            verify(cartItemRepository, never()).save(any(CartItem.class));
            verify(wishlistItemRepository).delete(wishlistItem);
        }

        @Test
        @DisplayName("should throw exception when wishlist item not found")
        void shouldThrowWhenWishlistItemNotFound() {
            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Wishlist item not found");
        }

        @Test
        @DisplayName("should throw exception when wishlist item belongs to different user")
        void shouldThrowWhenItemBelongsToDifferentUser() {
            wishlistItem.setUserId(999L);
            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));

            assertThatThrownBy(() -> wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("does not belong to user");
        }

        @Test
        @DisplayName("should throw exception when product is out of stock")
        void shouldThrowWhenProductOutOfStock() {
            activeProduct.setStockQuantity(0);

            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));

            assertThatThrownBy(() -> wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("out of stock");
        }

        @Test
        @DisplayName("should throw exception when product is not active")
        void shouldThrowWhenProductNotActive() {
            activeProduct.setStatus(ProductStatus.DEACTIVATED);

            when(wishlistItemRepository.findById(WISHLIST_ITEM_ID)).thenReturn(Optional.of(wishlistItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));

            assertThatThrownBy(() -> wishlistService.moveToCart(USER_ID, WISHLIST_ITEM_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not available");
        }
    }

    @Nested
    @DisplayName("getWishlist")
    class GetWishlist {

        @Test
        @DisplayName("should return wishlist with items")
        void shouldReturnWishlistWithItems() {
            WishlistItem item1 = new WishlistItem();
            item1.setId(1L);
            item1.setUserId(USER_ID);
            item1.setProductId(PRODUCT_ID);

            WishlistItem item2 = new WishlistItem();
            item2.setId(2L);
            item2.setUserId(USER_ID);
            item2.setProductId(20L);

            Product product2 = new Product();
            product2.setId(20L);
            product2.setName("Blind Set");
            product2.setStatus(ProductStatus.ACTIVE);
            product2.setBasePrice(new BigDecimal("49.99"));
            product2.setStockQuantity(5);
            product2.setImages(new ArrayList<>());

            when(wishlistItemRepository.findByUserIdOrderByAddedAtDesc(USER_ID))
                    .thenReturn(List.of(item1, item2));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct));
            when(productRepository.findById(20L)).thenReturn(Optional.of(product2));

            WishlistResponse response = wishlistService.getWishlist(USER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getTotalItems()).isEqualTo(2);
            assertThat(response.getItems()).hasSize(2);
        }

        @Test
        @DisplayName("should return empty wishlist when no items exist")
        void shouldReturnEmptyWishlist() {
            when(wishlistItemRepository.findByUserIdOrderByAddedAtDesc(USER_ID))
                    .thenReturn(Collections.emptyList());

            WishlistResponse response = wishlistService.getWishlist(USER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getTotalItems()).isEqualTo(0);
            assertThat(response.getItems()).isEmpty();
        }

        @Test
        @DisplayName("should handle unavailable product gracefully")
        void shouldHandleUnavailableProduct() {
            WishlistItem item = new WishlistItem();
            item.setId(1L);
            item.setUserId(USER_ID);
            item.setProductId(PRODUCT_ID);

            when(wishlistItemRepository.findByUserIdOrderByAddedAtDesc(USER_ID))
                    .thenReturn(List.of(item));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.empty());

            WishlistResponse response = wishlistService.getWishlist(USER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getTotalItems()).isEqualTo(1);
            assertThat(response.getItems().get(0).getProductName()).isEqualTo("Product unavailable");
            assertThat(response.getItems().get(0).isInStock()).isFalse();
        }
    }

    @Nested
    @DisplayName("getWishlistCount")
    class GetWishlistCount {

        @Test
        @DisplayName("should return correct wishlist count")
        void shouldReturnCorrectCount() {
            when(wishlistItemRepository.countByUserId(USER_ID)).thenReturn(5);

            int count = wishlistService.getWishlistCount(USER_ID);

            assertThat(count).isEqualTo(5);
        }

        @Test
        @DisplayName("should return zero when wishlist is empty")
        void shouldReturnZeroForEmptyWishlist() {
            when(wishlistItemRepository.countByUserId(USER_ID)).thenReturn(0);

            int count = wishlistService.getWishlistCount(USER_ID);

            assertThat(count).isEqualTo(0);
        }
    }
}
