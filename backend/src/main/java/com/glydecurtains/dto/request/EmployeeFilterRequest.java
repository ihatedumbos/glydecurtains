package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeFilterRequest {

    private String name;
    private String email;
    private UserStatus status;
    private UserRole role;
    private Long departmentId;
}
