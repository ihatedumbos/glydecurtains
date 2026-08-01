package com.glydecurtains.controller;

import com.glydecurtains.dto.request.EmployeeCreateRequest;
import com.glydecurtains.dto.request.EmployeeFilterRequest;
import com.glydecurtains.dto.request.EmployeeUpdateRequest;
import com.glydecurtains.dto.request.TaskAssignRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.EmployeeResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.TaskResponse;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    @RequiresPermission(entity = "employees", operation = "CREATE")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody EmployeeCreateRequest request) {
        EmployeeResponse employee = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Employee created successfully", employee));
    }

    @GetMapping
    @RequiresPermission(entity = "employees", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getEmployees(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        EmployeeFilterRequest filter = new EmployeeFilterRequest(name, email, status, role, departmentId);
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<EmployeeResponse> employees = employeeService.getEmployees(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/{id}")
    @RequiresPermission(entity = "employees", operation = "READ")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(@PathVariable Long id) {
        EmployeeResponse employee = employeeService.getEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PutMapping("/{id}")
    @RequiresPermission(entity = "employees", operation = "UPDATE")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request) {
        EmployeeResponse employee = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", employee));
    }

    @PutMapping("/{id}/suspend")
    @RequiresPermission(entity = "employees", operation = "UPDATE")
    public ResponseEntity<ApiResponse<EmployeeResponse>> suspendEmployee(@PathVariable Long id) {
        EmployeeResponse employee = employeeService.suspendEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee suspended successfully", employee));
    }

    @PutMapping("/{id}/activate")
    @RequiresPermission(entity = "employees", operation = "UPDATE")
    public ResponseEntity<ApiResponse<EmployeeResponse>> activateEmployee(@PathVariable Long id) {
        EmployeeResponse employee = employeeService.activateEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee activated successfully", employee));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(entity = "employees", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deactivated successfully", null));
    }

    @PutMapping("/{id}/department/{departmentId}")
    @RequiresPermission(entity = "employees", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> assignDepartment(
            @PathVariable Long id,
            @PathVariable Long departmentId) {
        employeeService.assignDepartment(id, departmentId);
        return ResponseEntity.ok(ApiResponse.success("Department assigned successfully", null));
    }

    @PostMapping("/{id}/tasks")
    @RequiresPermission(entity = "employees", operation = "UPDATE")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskAssignRequest request) {
        TaskResponse task = employeeService.assignTask(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Task assigned successfully", task));
    }

    @GetMapping("/{id}/tasks")
    @RequiresPermission(entity = "employees", operation = "READ")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getEmployeeTasks(@PathVariable Long id) {
        List<TaskResponse> tasks = employeeService.getEmployeeTasks(id);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
}
