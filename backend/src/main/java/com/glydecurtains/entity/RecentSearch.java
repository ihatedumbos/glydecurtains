package com.glydecurtains.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "recent_searches", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "query"})
})
@Getter
@Setter
@NoArgsConstructor
public class RecentSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank
    @Column(name = "query", nullable = false, length = 255)
    private String query;

    @Column(name = "searched_at", nullable = false)
    private LocalDateTime searchedAt = LocalDateTime.now();

    public RecentSearch(Long userId, String query) {
        this.userId = userId;
        this.query = query;
        this.searchedAt = LocalDateTime.now();
    }
}
