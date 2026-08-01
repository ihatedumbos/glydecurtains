package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFilterRequest {

    private String name;
    private String email;
    private UserStatus status;
    private UserRole role;
    private LocalDate fromDate;
    private LocalDate toDate;
}
