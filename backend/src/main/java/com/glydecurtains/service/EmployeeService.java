package com.glydecurtains.service;

import com.glydecurtains.dto.request.EmployeeCreateRequest;
import com.glydecurtains.dto.request.EmployeeFilterRequest;
import com.glydecurtains.dto.request.EmployeeUpdateRequest;
import com.glydecurtains.dto.request.TaskAssignRequest;
import com.glydecurtains.dto.response.EmployeeResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.TaskResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EmployeeService {

    EmployeeResponse createEmployee(EmployeeCreateRequest request);

    EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request);

    EmployeeResponse suspendEmployee(Long id);

    EmployeeResponse activateEmployee(Long id);

    void deleteEmployee(Long id);

    EmployeeResponse getEmployee(Long id);

    PageResponse<EmployeeResponse> getEmployees(EmployeeFilterRequest filter, Pageable pageable);

    void assignDepartment(Long employeeId, Long departmentId);

    TaskResponse assignTask(Long employeeId, TaskAssignRequest request);

    List<TaskResponse> getEmployeeTasks(Long employeeId);
}
