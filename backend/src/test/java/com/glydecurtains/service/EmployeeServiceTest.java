package com.glydecurtains.service;

import com.glydecurtains.dto.request.EmployeeCreateRequest;
import com.glydecurtains.dto.request.EmployeeFilterRequest;
import com.glydecurtains.dto.request.EmployeeUpdateRequest;
import com.glydecurtains.dto.request.TaskAssignRequest;
import com.glydecurtains.dto.response.EmployeeResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.TaskResponse;
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
import com.glydecurtains.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private User sampleEmployee;
    private Department sampleDepartment;

    @BeforeEach
    void setUp() {
        sampleEmployee = new User();
        sampleEmployee.setId(1L);
        sampleEmployee.setName("John Doe");
        sampleEmployee.setEmail("john.doe@glyde.com");
        sampleEmployee.setPassword("encoded-password");
        sampleEmployee.setRole(UserRole.EMPLOYEE);
        sampleEmployee.setStatus(UserStatus.APPROVED);
        sampleEmployee.setDepartmentId(10L);
        sampleEmployee.setHireDate(LocalDate.of(2024, 1, 15));

        sampleDepartment = new Department();
        sampleDepartment.setId(10L);
        sampleDepartment.setName("Sales");
        sampleDepartment.setDescription("Sales department");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockSecurityContext(Long userId) {
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(userId);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Create Employee")
    class CreateEmployeeTests {

        @Test
        @DisplayName("should create employee successfully with APPROVED status")
        void createEmployee_withValidRequest_shouldReturnEmployeeResponse() {
            mockSecurityContext(99L);

            EmployeeCreateRequest request = new EmployeeCreateRequest(
                    "Jane Smith", "jane@glyde.com", "password123",
                    UserRole.EMPLOYEE, 10L, LocalDate.of(2024, 3, 1));

            when(userRepository.existsByEmailIgnoreCase("jane@glyde.com")).thenReturn(false);
            when(departmentRepository.existsById(10L)).thenReturn(true);
            when(passwordEncoder.encode("password123")).thenReturn("encoded-pw");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(2L);
                return u;
            });
            when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));
            when(activityLogRepository.save(any())).thenReturn(null);

            EmployeeResponse response = employeeService.createEmployee(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Jane Smith");
            assertThat(response.getEmail()).isEqualTo("jane@glyde.com");
            assertThat(response.getRole()).isEqualTo(UserRole.EMPLOYEE);
            assertThat(response.getStatus()).isEqualTo(UserStatus.APPROVED);
            assertThat(response.getDepartmentId()).isEqualTo(10L);
            assertThat(response.getDepartmentName()).isEqualTo("Sales");

            verify(userRepository).save(any(User.class));
            verify(activityLogRepository).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when email already exists")
        void createEmployee_withDuplicateEmail_shouldThrowException() {
            EmployeeCreateRequest request = new EmployeeCreateRequest(
                    "Jane Smith", "existing@glyde.com", "password123",
                    UserRole.EMPLOYEE, null, null);

            when(userRepository.existsByEmailIgnoreCase("existing@glyde.com")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when role is CUSTOMER")
        void createEmployee_withInvalidRole_shouldThrowException() {
            EmployeeCreateRequest request = new EmployeeCreateRequest(
                    "Jane Smith", "jane@glyde.com", "password123",
                    UserRole.CUSTOMER, null, null);

            when(userRepository.existsByEmailIgnoreCase("jane@glyde.com")).thenReturn(false);

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("ADMIN or EMPLOYEE");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when department not found")
        void createEmployee_withNonExistentDepartment_shouldThrowException() {
            EmployeeCreateRequest request = new EmployeeCreateRequest(
                    "Jane Smith", "jane@glyde.com", "password123",
                    UserRole.EMPLOYEE, 999L, null);

            when(userRepository.existsByEmailIgnoreCase("jane@glyde.com")).thenReturn(false);
            when(departmentRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> employeeService.createEmployee(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Department not found");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Update Employee")
    class UpdateEmployeeTests {

        @Test
        @DisplayName("should update employee name and department successfully")
        void updateEmployee_withValidData_shouldReturnUpdatedResponse() {
            mockSecurityContext(99L);

            EmployeeUpdateRequest request = new EmployeeUpdateRequest("John Updated", 10L, null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(departmentRepository.existsById(10L)).thenReturn(true);
            when(userRepository.save(any(User.class))).thenReturn(sampleEmployee);
            when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));
            when(activityLogRepository.save(any())).thenReturn(null);

            EmployeeResponse response = employeeService.updateEmployee(1L, request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("John Updated");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw BusinessException when employee not found")
        void updateEmployee_withNonExistentId_shouldThrowException() {
            EmployeeUpdateRequest request = new EmployeeUpdateRequest("Updated", null, null);

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.updateEmployee(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Employee not found");
        }

        @Test
        @DisplayName("should throw BusinessException when updated department not found")
        void updateEmployee_withNonExistentDepartment_shouldThrowException() {
            mockSecurityContext(99L);

            EmployeeUpdateRequest request = new EmployeeUpdateRequest(null, 999L, null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(departmentRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> employeeService.updateEmployee(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Department not found");
        }
    }

    @Nested
    @DisplayName("Delete Employee")
    class DeleteEmployeeTests {

        @Test
        @DisplayName("should soft-delete employee by deactivating status")
        void deleteEmployee_shouldDeactivateAndInvalidateSessions() {
            mockSecurityContext(99L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(userRepository.save(any(User.class))).thenReturn(sampleEmployee);
            when(activityLogRepository.save(any())).thenReturn(null);

            employeeService.deleteEmployee(1L);

            assertThat(sampleEmployee.getStatus()).isEqualTo(UserStatus.DEACTIVATED);
            verify(userRepository).save(sampleEmployee);
            verify(refreshTokenRepository).deleteByUser_Id(1L);
            verify(activityLogRepository).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when employee not found")
        void deleteEmployee_withNonExistentId_shouldThrowException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.deleteEmployee(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Employee not found");
        }

        @Test
        @DisplayName("should throw BusinessException when user is a CUSTOMER")
        void deleteEmployee_whenUserIsCustomer_shouldThrowException() {
            User customer = new User();
            customer.setId(5L);
            customer.setRole(UserRole.CUSTOMER);

            when(userRepository.findById(5L)).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> employeeService.deleteEmployee(5L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not an employee");
        }
    }

    @Nested
    @DisplayName("Get Employees Paginated")
    class GetEmployeesPaginatedTests {

        @Test
        @DisplayName("should return paginated employees with filter")
        @SuppressWarnings("unchecked")
        void getEmployees_withFilter_shouldReturnPageResponse() {
            EmployeeFilterRequest filter = new EmployeeFilterRequest("John", null, null, null, null);
            Pageable pageable = PageRequest.of(0, 10);

            Page<User> userPage = new PageImpl<>(List.of(sampleEmployee), pageable, 1);

            when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);
            when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));

            PageResponse<EmployeeResponse> result = employeeService.getEmployees(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("John Doe");
            assertThat(result.getContent().get(0).getDepartmentName()).isEqualTo("Sales");
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(10);
        }

        @Test
        @DisplayName("should return empty page when no employees match")
        @SuppressWarnings("unchecked")
        void getEmployees_noMatch_shouldReturnEmptyPage() {
            EmployeeFilterRequest filter = new EmployeeFilterRequest("NonExistent", null, null, null, null);
            Pageable pageable = PageRequest.of(0, 10);

            Page<User> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

            when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

            PageResponse<EmployeeResponse> result = employeeService.getEmployees(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Assign Task")
    class AssignTaskTests {

        @Test
        @DisplayName("should assign task to active employee successfully")
        void assignTask_toActiveEmployee_shouldReturnTaskResponse() {
            mockSecurityContext(99L);

            TaskAssignRequest request = new TaskAssignRequest("Review inventory", "Check stock levels");

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
                Task t = invocation.getArgument(0);
                t.setId(100L);
                return t;
            });
            when(userRepository.findById(99L)).thenReturn(Optional.of(buildAdminUser()));
            when(activityLogRepository.save(any())).thenReturn(null);

            TaskResponse response = employeeService.assignTask(1L, request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Review inventory");
            assertThat(response.getDescription()).isEqualTo("Check stock levels");
            assertThat(response.getAssignedToId()).isEqualTo(1L);
            assertThat(response.getAssignedById()).isEqualTo(99L);
            assertThat(response.getStatus()).isEqualTo(TaskStatus.ASSIGNED);

            verify(taskRepository).save(any(Task.class));
        }

        @Test
        @DisplayName("should throw BusinessException when assigning task to inactive employee")
        void assignTask_toInactiveEmployee_shouldThrowException() {
            sampleEmployee.setStatus(UserStatus.SUSPENDED);

            TaskAssignRequest request = new TaskAssignRequest("Task title", "Description");

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

            assertThatThrownBy(() -> employeeService.assignTask(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Cannot assign tasks to inactive employees");

            verify(taskRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when employee not found for task assignment")
        void assignTask_toNonExistentEmployee_shouldThrowException() {
            TaskAssignRequest request = new TaskAssignRequest("Task title", "Description");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.assignTask(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Employee not found");
        }
    }

    @Nested
    @DisplayName("Get Employee Tasks")
    class GetEmployeeTasksTests {

        @Test
        @DisplayName("should return all tasks assigned to employee")
        void getEmployeeTasks_shouldReturnTaskList() {
            Task task1 = new Task();
            task1.setId(10L);
            task1.setTitle("Task One");
            task1.setDescription("First task");
            task1.setAssignedToId(1L);
            task1.setAssignedById(99L);
            task1.setStatus(TaskStatus.ASSIGNED);

            Task task2 = new Task();
            task2.setId(11L);
            task2.setTitle("Task Two");
            task2.setDescription("Second task");
            task2.setAssignedToId(1L);
            task2.setAssignedById(99L);
            task2.setStatus(TaskStatus.IN_PROGRESS);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(taskRepository.findByAssignedToId(1L)).thenReturn(List.of(task1, task2));
            when(userRepository.findById(99L)).thenReturn(Optional.of(buildAdminUser()));

            List<TaskResponse> tasks = employeeService.getEmployeeTasks(1L);

            assertThat(tasks).hasSize(2);
            assertThat(tasks.get(0).getTitle()).isEqualTo("Task One");
            assertThat(tasks.get(0).getStatus()).isEqualTo(TaskStatus.ASSIGNED);
            assertThat(tasks.get(1).getTitle()).isEqualTo("Task Two");
            assertThat(tasks.get(1).getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should return empty list when employee has no tasks")
        void getEmployeeTasks_noTasks_shouldReturnEmptyList() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(taskRepository.findByAssignedToId(1L)).thenReturn(Collections.emptyList());

            List<TaskResponse> tasks = employeeService.getEmployeeTasks(1L);

            assertThat(tasks).isEmpty();
        }
    }

    @Nested
    @DisplayName("Suspend and Activate Employee")
    class SuspendActivateTests {

        @Test
        @DisplayName("should suspend an active employee")
        void suspendEmployee_activeEmployee_shouldSetSuspendedStatus() {
            mockSecurityContext(99L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(userRepository.save(any(User.class))).thenReturn(sampleEmployee);
            when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));
            when(activityLogRepository.save(any())).thenReturn(null);

            EmployeeResponse response = employeeService.suspendEmployee(1L);

            assertThat(response).isNotNull();
            assertThat(sampleEmployee.getStatus()).isEqualTo(UserStatus.SUSPENDED);
            verify(refreshTokenRepository).deleteByUser_Id(1L);
        }

        @Test
        @DisplayName("should throw BusinessException when suspending non-active employee")
        void suspendEmployee_suspendedEmployee_shouldThrowException() {
            sampleEmployee.setStatus(UserStatus.SUSPENDED);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

            assertThatThrownBy(() -> employeeService.suspendEmployee(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Only active (APPROVED) employees can be suspended");
        }

        @Test
        @DisplayName("should activate a suspended employee")
        void activateEmployee_suspendedEmployee_shouldSetApprovedStatus() {
            mockSecurityContext(99L);
            sampleEmployee.setStatus(UserStatus.SUSPENDED);

            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(userRepository.save(any(User.class))).thenReturn(sampleEmployee);
            when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));
            when(activityLogRepository.save(any())).thenReturn(null);

            EmployeeResponse response = employeeService.activateEmployee(1L);

            assertThat(response).isNotNull();
            assertThat(sampleEmployee.getStatus()).isEqualTo(UserStatus.APPROVED);
        }

        @Test
        @DisplayName("should throw BusinessException when activating already active employee")
        void activateEmployee_activeEmployee_shouldThrowException() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

            assertThatThrownBy(() -> employeeService.activateEmployee(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Only suspended or deactivated employees can be activated");
        }
    }

    private User buildAdminUser() {
        User admin = new User();
        admin.setId(99L);
        admin.setName("Admin User");
        admin.setEmail("admin@glyde.com");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.APPROVED);
        return admin;
    }
}
