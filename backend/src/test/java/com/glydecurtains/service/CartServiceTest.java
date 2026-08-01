package com.glydecurtains.service;

import com.glydecurtains.dto.request.CartItemRequest;
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
import com.glydecurtains.service.impl.CartServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private static final Long USER_ID = 1L;
    private static final Long CART_ID = 10L;
    private static final Long PRODUCT_ID = 100L;
    private static final Long VARIANT_ID = 200L;
    private static final Long CART_ITEM_ID = 300L;

    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        setupSecurityContext();

        cart = new Cart();
        cart.setId(CART_ID);
        cart.setUserId(USER_ID);
        cart.setItems(new ArrayList<>());

        product = new Product();
        product.setId(PRODUCT_ID);
        product.setName("Test Curtain");
        product.setSku("CUR-001");
        product.setStatus(ProductStatus.ACTIVE);
        product.setBasePrice(new BigDecimal("49.99"));
        product.setStockQuantity(50);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // --- addItem tests ---

    @Nested
    @DisplayName("addItem")
    class AddItemTests {

        @Test
        @DisplayName("Successfully adds a new item to the cart")
        void addItem_success_createsNewCartItem() {
            CartItemRequest request = new CartItemRequest(PRODUCT_ID, null, 2);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(cartItemRepository.findByCartIdAndProductId(CART_ID, PRODUCT_ID))
                    .thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartResponse response = cartService.addItem(request);

            assertNotNull(response);
            verify(cartRepository).save(any(Cart.class));
        }

        @Test
        @DisplayName("Adds to existing item quantity when duplicate product is added")
        void addItem_duplicateProduct_incrementsQuantity() {
            CartItem existingItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 3, new BigDecimal("49.99"));

            CartItemRequest request = new CartItemRequest(PRODUCT_ID, null, 2);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(cartItemRepository.findByCartIdAndProductId(CART_ID, PRODUCT_ID))
                    .thenReturn(Optional.of(existingItem));
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(existingItem);
            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));

            CartResponse response = cartService.addItem(request);

            assertNotNull(response);
            assertEquals(5, existingItem.getQuantity());
            verify(cartItemRepository).save(existingItem);
        }

        @Test
        @DisplayName("Throws BusinessException when quantity exceeds max limit of 10")
        void addItem_exceedsMaxQuantity_throwsBusinessException() {
            CartItemRequest request = new CartItemRequest(PRODUCT_ID, null, 11);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> cartService.addItem(request));

            assertEquals("CART_QUANTITY_LIMIT_EXCEEDED", ex.getErrorCode());
        }

        @Test
        @DisplayName("Throws BusinessException when combined quantity exceeds max limit of 10")
        void addItem_combinedQuantityExceedsMax_throwsBusinessException() {
            CartItem existingItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 7, new BigDecimal("49.99"));

            CartItemRequest request = new CartItemRequest(PRODUCT_ID, null, 5);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(cartItemRepository.findByCartIdAndProductId(CART_ID, PRODUCT_ID))
                    .thenReturn(Optional.of(existingItem));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> cartService.addItem(request));

            assertEquals("CART_QUANTITY_LIMIT_EXCEEDED", ex.getErrorCode());
            assertTrue(ex.getMessage().contains("Current quantity in cart: 7"));
        }
    }

    // --- updateItemQuantity tests ---

    @Nested
    @DisplayName("updateItemQuantity")
    class UpdateItemQuantityTests {

        @Test
        @DisplayName("Successfully updates cart item quantity")
        void updateItemQuantity_validQuantity_updatesSuccessfully() {
            CartItem cartItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 2, new BigDecimal("49.99"));
            cart.getItems().add(cartItem);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartItemRepository.findById(CART_ITEM_ID)).thenReturn(Optional.of(cartItem));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(cartItem);

            CartResponse response = cartService.updateItemQuantity(CART_ITEM_ID, 5);

            assertNotNull(response);
            assertEquals(5, cartItem.getQuantity());
            verify(cartItemRepository).save(cartItem);
        }

        @Test
        @DisplayName("Throws BusinessException when updating quantity exceeds max limit of 10")
        void updateItemQuantity_exceedsMax_throwsBusinessException() {
            CartItem cartItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 2, new BigDecimal("49.99"));
            cart.getItems().add(cartItem);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartItemRepository.findById(CART_ITEM_ID)).thenReturn(Optional.of(cartItem));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> cartService.updateItemQuantity(CART_ITEM_ID, 11));

            assertEquals("CART_QUANTITY_LIMIT_EXCEEDED", ex.getErrorCode());
        }

        @Test
        @DisplayName("Throws BusinessException when updating quantity to zero")
        void updateItemQuantity_zeroQuantity_throwsBusinessException() {
            CartItem cartItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 2, new BigDecimal("49.99"));
            cart.getItems().add(cartItem);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartItemRepository.findById(CART_ITEM_ID)).thenReturn(Optional.of(cartItem));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> cartService.updateItemQuantity(CART_ITEM_ID, 0));

            assertEquals("CART_QUANTITY_LIMIT_EXCEEDED", ex.getErrorCode());
        }
    }

    // --- removeItem tests ---

    @Nested
    @DisplayName("removeItem")
    class RemoveItemTests {

        @Test
        @DisplayName("Successfully removes an item from the cart")
        void removeItem_existingItem_removesSuccessfully() {
            CartItem cartItem = createCartItem(CART_ITEM_ID, PRODUCT_ID, null, 2, new BigDecimal("49.99"));
            cart.getItems().add(cartItem);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartItemRepository.findById(CART_ITEM_ID)).thenReturn(Optional.of(cartItem));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            CartResponse response = cartService.removeItem(CART_ITEM_ID);

            assertNotNull(response);
            verify(cartRepository).save(cart);
        }
    }

    // --- clearCart tests ---

    @Nested
    @DisplayName("clearCart")
    class ClearCartTests {

        @Test
        @DisplayName("Successfully clears all items from the cart")
        void clearCart_withItems_clearsAll() {
            CartItem item1 = createCartItem(1L, PRODUCT_ID, null, 2, new BigDecimal("49.99"));
            CartItem item2 = createCartItem(2L, 101L, null, 1, new BigDecimal("29.99"));
            cart.getItems().add(item1);
            cart.getItems().add(item2);

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            cartService.clearCart();

            assertTrue(cart.getItems().isEmpty());
            verify(cartRepository).save(cart);
        }
    }

    // --- Helper methods ---

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(USER_ID);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private CartItem createCartItem(Long id, Long productId, Long variantId, int quantity, BigDecimal unitPrice) {
        CartItem item = new CartItem();
        item.setId(id);
        item.setCart(cart);
        item.setProductId(productId);
        item.setVariantId(variantId);
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);
        return item;
    }
}
