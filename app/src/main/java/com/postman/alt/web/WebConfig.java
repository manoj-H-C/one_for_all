package com.postman.alt.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring Framework 7 / Boot 4's native API versioning (spring-webmvc's
 * ApiVersionConfigurer). Clients send X-API-Version: 1; every controller
 * mapping below declares version = "1" so a future v2 can be added
 * alongside it without breaking v1 callers. Header-based rather than
 * path-based (/api/v1/...) so resource URLs stay stable across versions.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer
                .useRequestHeader("X-API-Version")
                .addSupportedVersions("1")
                .setDefaultVersion("1")
                .setVersionRequired(false);
    }
}
