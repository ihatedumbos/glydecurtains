package com.glydecurtains.dto.response;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    void success_withData_returnsStatus200() {
        ApiResponse<String> response = ApiResponse.success("test data");

        assertEquals(200, response.getStatus());
        assertEquals("Success", response.getMessage());
        assertEquals("test data", response.getData());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void success_withMessageAndData_returnsCustomMessage() {
        ApiResponse<Integer> response = ApiResponse.success("Item retrieved", 42);

        assertEquals(200, response.getStatus());
        assertEquals("Item retrieved", response.getMessage());
        assertEquals(42, response.getData());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void created_withData_returnsStatus201() {
        ApiResponse<String> response = ApiResponse.created("new item");

        assertEquals(201, response.getStatus());
        assertEquals("Created successfully", response.getMessage());
        assertEquals("new item", response.getData());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void created_withMessageAndData_returnsCustomMessage() {
        ApiResponse<String> response = ApiResponse.created("Product created", "product-1");

        assertEquals(201, response.getStatus());
        assertEquals("Product created", response.getMessage());
        assertEquals("product-1", response.getData());
    }

    @Test
    void noContent_returnsStatus204() {
        ApiResponse<Void> response = ApiResponse.noContent();

        assertEquals(204, response.getStatus());
        assertEquals("No content", response.getMessage());
        assertNull(response.getData());
        assertNotNull(response.getTimestamp());
    }
}
