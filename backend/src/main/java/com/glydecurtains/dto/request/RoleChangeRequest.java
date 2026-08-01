package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeRequest {

    @NotNull(message = "Role is required")
    private UserRole role;
}
