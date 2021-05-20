package com.bbn.xai.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@Configuration
public class StaticResourceConfiguration extends WebMvcConfigurerAdapter {
    @Autowired
    private ApplicationProperties applicationProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/" + applicationProperties.getEvaluation().getDatasetRootFolderName() + "/**").addResourceLocations(applicationProperties.getEvaluation().getDatasetCanonicalRootFile().toURI().toString());
    }
}
