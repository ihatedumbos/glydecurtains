package com.glydecurtains.exception;

import com.glydecurtains.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        ApiErrorResponse response = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Validation failed",
                fieldErrors
        );

        log.warn("Validation error: {}", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException ex) {
        ApiErrorResponse response = ApiErrorResponse.of(
                ex.getHttpStatus().value(),
                ex.getErrorCode(),
                ex.getMessage()
        );

        log.warn("Business exception: [{}] {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ApiErrorResponse response = ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "ACCESS_DENIED",
                "You do not have permission to access this resource"
        );

        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        ApiErrorResponse response = ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "AUTHENTICATION_FAILED",
                "Authentication failed"
        );

        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFoundException(NoResourceFoundException ex) {
        ApiErrorResponse response = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "RESOURCE_NOT_FOUND",
                "The requested resource was not found"
        );

        log.debug("No static resource found: {}", ex.getResourcePath());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Client disconnects during media/range streaming (e.g. video/mp4 downloads cut short)
     * surface as broken-pipe IOExceptions after the response is already committed. Writing a
     * JSON error body onto a committed non-JSON response throws HttpMessageNotWritableException,
     * so these are logged at debug level and otherwise ignored instead of producing a 500 response.
     */
    @ExceptionHandler({ClientAbortException.class, IOException.class})
    public ResponseEntity<ApiErrorResponse> handleIOException(IOException ex, HttpServletResponse response) {
        log.debug("Client disconnected during response streaming: {}", ex.getMessage());
        if (response.isCommitted()) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "IO_ERROR", "A streaming error occurred"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex, HttpServletResponse response) {
        if (response.isCommitted()) {
            log.warn("Exception occurred after response was committed, cannot write error body: {}", ex.toString());
            return null;
        }
        ApiErrorResponse errorResponse = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "An unexpected error occurred"
        );

        log.error("Unexpected error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
