package com.postman.alt.web;

import com.postman.alt.dto.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Wraps every controller's return value in the platform-wide ApiResponse
 * envelope, so individual controllers just return plain DTOs/lists and
 * never construct the envelope themselves. GlobalExceptionHandler builds
 * ApiResponse directly (it needs success=false), so that's passed through
 * unchanged; a null body (204 No Content from delete endpoints) is left
 * alone too, so those stay true empty responses.
 */
@RestControllerAdvice
public class ApiResponseWrappingAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response
    ) {
        if (body == null || body instanceof ApiResponse<?>) {
            return body;
        }

        int status = response instanceof ServletServerHttpResponse servletResponse
                ? servletResponse.getServletResponse().getStatus()
                : 200;
        return ApiResponse.ok(status, body);
    }
}
