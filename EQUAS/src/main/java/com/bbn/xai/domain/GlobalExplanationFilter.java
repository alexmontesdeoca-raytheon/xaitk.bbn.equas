package com.bbn.xai.domain;

import java.io.Serializable;


public class GlobalExplanationFilter implements Serializable {



    private double minTurkerConsensus = 0;
    private Boolean vqaRight = true;
    private Boolean vqaWrong = true;
    private Boolean allowDuplicateImages = true;
    private Boolean allowDuplicateQuestions = true;
    private Boolean allowDuplicateAnswers = true;
    private Boolean allowYesNo = true;
    private Boolean allowNumeric = true;
    private Boolean allowPluralForms = true;
    private Boolean allowBinary = true;
    private Boolean allowOcr = true;
    private int shuffleSeed = 0;
    private int maxQuestions = 999999;

    public double getMinTurkerConsensus() {
        return minTurkerConsensus;
    }

    public void setMinTurkerConsensus(double minTurkerConsensus) {
        this.minTurkerConsensus = minTurkerConsensus;
    }

    public Boolean getAllowDuplicateImages() {
        return allowDuplicateImages;
    }

    public void setAllowDuplicateImages(Boolean allowDuplicateImages) {
        this.allowDuplicateImages = allowDuplicateImages;
    }

    public Boolean getAllowDuplicateQuestions() {
        return allowDuplicateQuestions;
    }

    public void setAllowDuplicateQuestions(Boolean allowDuplicateQuestions) {
        this.allowDuplicateQuestions = allowDuplicateQuestions;
    }

    public Boolean getAllowDuplicateAnswers() {
        return allowDuplicateAnswers;
    }

    public void setAllowDuplicateAnswers(Boolean allowDuplicateAnswers) {
        this.allowDuplicateAnswers = allowDuplicateAnswers;
    }

    public int getMaxQuestions() {
        return maxQuestions;
    }

    public void setMaxQuestions(int maxQuestions) {
        this.maxQuestions = maxQuestions;
    }

    public Boolean getVqaRight() {
        return vqaRight;
    }

    public void setVqaRight(Boolean vqaRight) {
        this.vqaRight = vqaRight;
    }

    public Boolean getVqaWrong() {
        return vqaWrong;
    }

    public void setVqaWrong(Boolean vqaWrong) {
        this.vqaWrong = vqaWrong;
    }

    public Boolean getAllowYesNo() {
        return allowYesNo;
    }

    public void setAllowYesNo(Boolean allowYesNo) {
        this.allowYesNo = allowYesNo;
    }

    public Boolean getAllowNumeric() {
        return allowNumeric;
    }

    public void setAllowNumeric(Boolean allowNumeric) {
        this.allowNumeric = allowNumeric;
    }

    public Boolean getAllowPluralForms() {
        return allowPluralForms;
    }

    public void setAllowPluralForms(Boolean allowPluralForms) {
        this.allowPluralForms = allowPluralForms;
    }

    public Boolean getAllowBinary() {
        return allowBinary;
    }

    public void setAllowBinary(Boolean allowBinary) {
        this.allowBinary = allowBinary;
    }

    public Boolean getAllowOcr() {
        return allowOcr;
    }

    public void setAllowOcr(Boolean allowOcr) {
        this.allowOcr = allowOcr;
    }

    public int getShuffleSeed() {
        return shuffleSeed;
    }

    public void setShuffleSeed(int shuffleSeed) {
        this.shuffleSeed = shuffleSeed;
    }

    @Override
    public String toString() {
        return "GlobalExplanationFilter{" +
            "minTurkerConsensus=" + minTurkerConsensus +
            ", vqaRight=" + vqaRight +
            ", vqaWrong=" + vqaWrong +
            ", allowDuplicateImages=" + allowDuplicateImages +
            ", allowDuplicateQuestions=" + allowDuplicateQuestions +
            ", allowDuplicateAnswers=" + allowDuplicateAnswers +
            ", allowYesNo=" + allowYesNo +
            ", allowNumeric=" + allowNumeric +
            ", allowPluralForms=" + allowPluralForms +
            ", allowBinary=" + allowBinary +
            ", allowOcr=" + allowOcr +
            ", shuffleSeed=" + shuffleSeed +
            ", maxQuestions=" + maxQuestions +
            '}';
    }

    public static GlobalExplanationFilter blurGameDefaults () {
        GlobalExplanationFilter result = new GlobalExplanationFilter();
        result.setShuffleSeed(1);
        result.setMaxQuestions(300);
        result.setMinTurkerConsensus(0.8);
        result.setAllowDuplicateImages(false);
        result.setAllowBinary(false);
        return result;
    }
}
