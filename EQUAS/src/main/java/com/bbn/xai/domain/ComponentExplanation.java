package com.bbn.xai.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class ComponentExplanation {
    List<Integer> rgb = new ArrayList<>();
    private float instanceCount;
    private String _class;
    private float scoreSum;

    // Getter Methods

    public List<Integer> getRgb() {
        return rgb;
    }

    public void setRgb(List<Integer> rgb) {
        this.rgb = rgb;
    }

    public float getInstanceCount() {
        return instanceCount;
    }

    @JsonProperty("class")
    public String getClassName() {
        return _class;
    }

    public float getScoreSum() {
        return scoreSum;
    }

    // Setter Methods

    public void setInstanceCount(float instanceCount) {
        this.instanceCount = instanceCount;
    }

    public void setClass(String _class) {
        this._class = _class;
    }

    public void setScoreSum(float scoreSum) {
        this.scoreSum = scoreSum;
    }
}
