package com.glydecurtains.controller;

import com.glydecurtains.dto.request.RoleChangeRequest;
import com.glydecurtains.dto.request.UserFilterRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.UserResponse;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @RequiresPermission(entity = "users", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        UserFilterRequest filter = new UserFilterRequest(name, email, status, role, fromDate, toDate);
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<UserResponse> users = userService.getUsers(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @RequiresPermission(entity = "users", operation = "READ")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}/approve")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> approveUser(@PathVariable Long id) {
        UserResponse user = userService.approveUser(id);
        return ResponseEntity.ok(ApiResponse.success("User approved successfully", user));
    }

    @PutMapping("/{id}/reject")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> rejectUser(@PathVariable Long id) {
        UserResponse user = userService.rejectUser(id);
        return ResponseEntity.ok(ApiResponse.success("User rejected successfully", user));
    }

    @PutMapping("/{id}/suspend")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> suspendUser(@PathVariable Long id) {
        UserResponse user = userService.suspendUser(id);
        return ResponseEntity.ok(ApiResponse.success("User suspended successfully", user));
    }

    @PutMapping("/{id}/activate")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(@PathVariable Long id) {
        UserResponse user = userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }

    @PutMapping("/{id}/deactivate")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateUser(@PathVariable Long id) {
        UserResponse user = userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", user));
    }

    @PutMapping("/{id}/role")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleChangeRequest request) {
        UserResponse user = userService.changeRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("User role changed successfully", user));
    }

    @PostMapping("/{id}/reset-password")
    @RequiresPermission(entity = "users", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(@PathVariable Long id) {
        userService.resetUserPassword(id);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }
}
