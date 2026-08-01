package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.EmployeeCreateRequest;
import com.glydecurtains.dto.request.EmployeeFilterRequest;
import com.glydecurtains.dto.request.EmployeeUpdateRequest;
import com.glydecurtains.dto.request.TaskAssignRequest;
import com.glydecurtains.dto.response.EmployeeResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.TaskResponse;
import com.glydecurtains.entity.ActivityLog;
import com.glydecurtains.entity.Department;
import com.glydecurtains.entity.Task;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.TaskStatus;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ActivityLogRepository;
import com.glydecurtains.repository.DepartmentRepository;
import com.glydecurtains.repository.RefreshTokenRepository;
import com.glydecurtains.repository.TaskRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.EmployeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeServiceImpl.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogRepository activityLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public EmployeeServiceImpl(UserRepository userRepository,
                               DepartmentRepository departmentRepository,
                               TaskRepository taskRepository,
                               PasswordEncoder passwordEncoder,
                               ActivityLogRepository activityLogRepository,
                               RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogRepository = activityLogRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) {
        // Validate email uniqueness
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BusinessException(
                    "An account with this email already exists",
                    "DUPLICATE_EMAIL",
                    HttpStatus.CONFLICT);
        }

        // Validate role - employees can only be ADMIN or EMPLOYEE
        if (request.getRole() != UserRole.ADMIN && request.getRole() != UserRole.EMPLOYEE) {
            throw new BusinessException(
                    "Employee role must be ADMIN or EMPLOYEE",
                    "INVALID_ROLE",
                    HttpStatus.BAD_REQUEST);
        }

        // Validate department if provided
        if (request.getDepartmentId() != null) {
            if (!departmentRepository.existsById(request.getDepartmentId())) {
                throw new BusinessException(
                        "Department not found with id: " + request.getDepartmentId(),
                        "DEPARTMENT_NOT_FOUND",
                        HttpStatus.NOT_FOUND);
            }
        }

        // Create employee user - bypasses approval workflow, directly APPROVED
        User employee = new User();
        employee.setName(request.getName());
        employee.setEmail(request.getEmail().toLowerCase());
        employee.setPassword(passwordEncoder.encode(request.getPassword()));
        employee.setRole(request.getRole());
        employee.setStatus(UserStatus.APPROVED);
        employee.setDepartmentId(request.getDepartmentId());
        employee.setHireDate(request.getHireDate());

        User saved = userRepository.save(employee);

        // No permissions assigned on creation - Admin must explicitly grant
        persistAuditLog("EMPLOYEE_CREATED", "EMPLOYEE", saved.getId(),
                String.format("{\"role\":\"%s\",\"departmentId\":%s,\"status\":\"APPROVED\"}", 
                        request.getRole(), request.getDepartmentId()));

        logger.info("Employee created: id={}, email={}, role={}", saved.getId(), saved.getEmail(), saved.getRole());

        return toEmployeeResponse(saved);
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request) {
        User employee = findEmployeeOrThrow(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            employee.setName(request.getName());
        }

        if (request.getDepartmentId() != null) {
            if (!departmentRepository.existsById(request.getDepartmentId())) {
                throw new BusinessException(
                        "Department not found with id: " + request.getDepartmentId(),
                        "DEPARTMENT_NOT_FOUND",
                        HttpStatus.NOT_FOUND);
            }
            employee.setDepartmentId(request.getDepartmentId());
        }

        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }

        User saved = userRepository.save(employee);

        persistAuditLog("EMPLOYEE_UPDATED", "EMPLOYEE", id,
                String.format("{\"updatedFields\":\"%s\"}", request.toString()));

        return toEmployeeResponse(saved);
    }

    @Override
    public EmployeeResponse suspendEmployee(Long id) {
        User employee = findEmployeeOrThrow(id);

        if (employee.getStatus() != UserStatus.APPROVED) {
            throw new BusinessException(
                    "Only active (APPROVED) employees can be suspended",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        employee.setStatus(UserStatus.SUSPENDED);
        User saved = userRepository.save(employee);

        // Invalidate sessions
        refreshTokenRepository.deleteByUser_Id(id);

        persistAuditLog("EMPLOYEE_SUSPENDED", "EMPLOYEE", id,
                "{\"fromStatus\":\"APPROVED\",\"toStatus\":\"SUSPENDED\",\"sessionsInvalidated\":true}");

        return toEmployeeResponse(saved);
    }

    @Override
    public EmployeeResponse activateEmployee(Long id) {
        User employee = findEmployeeOrThrow(id);

        if (employee.getStatus() != UserStatus.SUSPENDED && employee.getStatus() != UserStatus.DEACTIVATED) {
            throw new BusinessException(
                    "Only suspended or deactivated employees can be activated",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = employee.getStatus();
        employee.setStatus(UserStatus.APPROVED);
        User saved = userRepository.save(employee);

        persistAuditLog("EMPLOYEE_ACTIVATED", "EMPLOYEE", id,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"APPROVED\"}", previousStatus));

        return toEmployeeResponse(saved);
    }

    @Override
    public void deleteEmployee(Long id) {
        User employee = findEmployeeOrThrow(id);

        // Soft delete - deactivate the employee
        employee.setStatus(UserStatus.DEACTIVATED);
        userRepository.save(employee);

        // Invalidate sessions
        refreshTokenRepository.deleteByUser_Id(id);

        persistAuditLog("EMPLOYEE_DELETED", "EMPLOYEE", id,
                "{\"action\":\"soft_deactivation\",\"sessionsInvalidated\":true}");

        logger.info("Employee soft-deleted (deactivated): id={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        User employee = findEmployeeOrThrow(id);
        return toEmployeeResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> getEmployees(EmployeeFilterRequest filter, Pageable pageable) {
        Specification<User> spec = buildEmployeeSpecification(filter);
        Page<User> page = userRepository.findAll(spec, pageable);
        Page<EmployeeResponse> responsePage = page.map(this::toEmployeeResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    public void assignDepartment(Long employeeId, Long departmentId) {
        User employee = findEmployeeOrThrow(employeeId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BusinessException(
                        "Department not found with id: " + departmentId,
                        "DEPARTMENT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        employee.setDepartmentId(departmentId);
        userRepository.save(employee);

        persistAuditLog("DEPARTMENT_ASSIGNED", "EMPLOYEE", employeeId,
                String.format("{\"departmentId\":%d,\"departmentName\":\"%s\"}", departmentId, department.getName()));
    }

    @Override
    public TaskResponse assignTask(Long employeeId, TaskAssignRequest request) {
        User employee = findEmployeeOrThrow(employeeId);

        if (employee.getStatus() != UserStatus.APPROVED) {
            throw new BusinessException(
                    "Cannot assign tasks to inactive employees",
                    "EMPLOYEE_INACTIVE",
                    HttpStatus.BAD_REQUEST);
        }

        Long assignedById = getCurrentUserId();

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setAssignedToId(employeeId);
        task.setAssignedById(assignedById != null ? assignedById : employeeId);
        task.setStatus(TaskStatus.ASSIGNED);

        Task saved = taskRepository.save(task);

        persistAuditLog("TASK_ASSIGNED", "TASK", saved.getId(),
                String.format("{\"employeeId\":%d,\"taskTitle\":\"%s\"}", employeeId, request.getTitle()));

        return toTaskResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getEmployeeTasks(Long employeeId) {
        findEmployeeOrThrow(employeeId);
        List<Task> tasks = taskRepository.findByAssignedToId(employeeId);
        return tasks.stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    // --- Helper methods ---

    private User findEmployeeOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Employee not found with id: " + id,
                        "EMPLOYEE_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Verify the user is an employee or admin (not a customer or super admin)
        if (user.getRole() == UserRole.CUSTOMER || user.getRole() == UserRole.SUPER_ADMIN) {
            throw new BusinessException(
                    "User is not an employee",
                    "NOT_AN_EMPLOYEE",
                    HttpStatus.BAD_REQUEST);
        }

        return user;
    }

    private Specification<User> buildEmployeeSpecification(EmployeeFilterRequest filter) {
        // Base spec: only ADMIN and EMPLOYEE roles
        Specification<User> spec = (root, query, cb) ->
                root.get("role").in(UserRole.ADMIN, UserRole.EMPLOYEE);

        if (filter == null) {
            return spec;
        }

        if (filter.getName() != null && !filter.getName().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + filter.getName().toLowerCase() + "%"));
        }

        if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().toLowerCase() + "%"));
        }

        if (filter.getStatus() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), filter.getStatus()));
        }

        if (filter.getRole() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("role"), filter.getRole()));
        }

        if (filter.getDepartmentId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("departmentId"), filter.getDepartmentId()));
        }

        return spec;
    }

    private EmployeeResponse toEmployeeResponse(User user) {
        String departmentName = null;
        if (user.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(user.getDepartmentId())
                    .map(Department::getName)
                    .orElse(null);
        }

        return EmployeeResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .departmentId(user.getDepartmentId())
                .departmentName(departmentName)
                .hireDate(user.getHireDate())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private TaskResponse toTaskResponse(Task task) {
        String assignedToName = null;
        String assignedByName = null;

        if (task.getAssignedToId() != null) {
            assignedToName = userRepository.findById(task.getAssignedToId())
                    .map(User::getName)
                    .orElse(null);
        }
        if (task.getAssignedById() != null) {
            assignedByName = userRepository.findById(task.getAssignedById())
                    .map(User::getName)
                    .orElse(null);
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assignedToId(task.getAssignedToId())
                .assignedToName(assignedToName)
                .assignedById(task.getAssignedById())
                .assignedByName(assignedByName)
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .build();
    }

    private void persistAuditLog(String actionType, String entityType, Long entityId, String details) {
        Long actorId = getCurrentUserId();

        ActivityLog log = ActivityLog.builder()
                .userId(actorId)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        activityLogRepository.save(log);

        logger.info("AUDIT: Action {} on {} id={} by user {}. Details: {}",
                actionType, entityType, entityId, actorId, details);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }
}
