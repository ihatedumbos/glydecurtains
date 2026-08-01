package com.glydecurtains.dto.response;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PageResponseTest {

    @Test
    void from_springPage_mapsAllFieldsCorrectly() {
        List<String> content = List.of("item1", "item2", "item3");
        Page<String> page = new PageImpl<>(content, PageRequest.of(0, 10), 25);

        PageResponse<String> response = PageResponse.from(page);

        assertEquals(content, response.getContent());
        assertEquals(0, response.getPage());
        assertEquals(10, response.getSize());
        assertEquals(25, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
        assertFalse(response.isLast());
    }

    @Test
    void from_lastPage_setsLastTrue() {
        List<String> content = List.of("item1");
        Page<String> page = new PageImpl<>(content, PageRequest.of(2, 10), 21);

        PageResponse<String> response = PageResponse.from(page);

        assertEquals(2, response.getPage());
        assertTrue(response.isLast());
    }

    @Test
    void of_manualConstruction_setsAllFields() {
        List<Integer> content = List.of(1, 2, 3);

        PageResponse<Integer> response = PageResponse.of(content, 1, 3, 9, 3, false);

        assertEquals(content, response.getContent());
        assertEquals(1, response.getPage());
        assertEquals(3, response.getSize());
        assertEquals(9, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
        assertFalse(response.isLast());
    }

    @Test
    void from_emptyPage_returnsEmptyContent() {
        Page<String> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

        PageResponse<String> response = PageResponse.from(page);

        assertTrue(response.getContent().isEmpty());
        assertEquals(0, response.getTotalElements());
        assertEquals(0, response.getTotalPages());
        assertTrue(response.isLast());
    }
}
