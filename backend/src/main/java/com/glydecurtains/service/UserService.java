package com.glydecurtains.service;

import com.glydecurtains.dto.request.RoleChangeRequest;
import com.glydecurtains.dto.request.UserFilterRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.UserResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {

    PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable);

    UserResponse getUserById(Long userId);

    UserResponse approveUser(Long userId);

    UserResponse rejectUser(Long userId);

    UserResponse suspendUser(Long userId);

    UserResponse activateUser(Long userId);

    UserResponse deactivateUser(Long userId);

    UserResponse changeRole(Long userId, RoleChangeRequest request);

    void resetUserPassword(Long userId);
}
