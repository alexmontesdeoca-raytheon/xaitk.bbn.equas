package com.bbn.xai.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class VqaBundleMinComponents extends VqaBundleMin implements Serializable {
    private List<ComponentExplanation> componentExplanation = new ArrayList<>();

    public List<ComponentExplanation> getComponentExplanation() {
        return componentExplanation;
    }

    public void setComponentExplanation(List<ComponentExplanation> componentExplanation) {
        this.componentExplanation = componentExplanation;
    }

    public VqaBundleMinComponents() {
        // Empty explicit default constructor
    }


}
