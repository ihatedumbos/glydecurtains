package com.glydecurtains.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "permissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"entity", "operation"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity", nullable = false)
    private String entity;

    @Column(name = "operation", nullable = false)
    private String operation;

    public Permission(String entity, String operation) {
        this.entity = entity;
        this.operation = operation;
    }
}
