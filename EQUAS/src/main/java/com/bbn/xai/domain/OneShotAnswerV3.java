package com.bbn.xai.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "oneshot_answer_v3")
public class OneShotAnswerV3 {

    @Id
    public String id;
    //User info
    public String workerId = "";
    public String ip;

    //Task info
    public String assignmentId = "";
    public String hitId = "";

    public boolean hitReward = false;
    public String modality = "";
    public int sandbox = 0;
    public String feedback = "";
    public String requestedOn;
    public String dtEnd;

    public String category;
    public int trial;

    public String likert = "";

    public int excludedId = 0;
    public String excludedLabel = "";
    public int distractorId = 0;
    public String distractorLabel = "";
    public boolean correctAnswer = false;

    public int getExcludedId() {
        return excludedId;
    }

    public void setExcludedId(int excludedId) {
        this.excludedId = excludedId;
    }

    public String getExcludedLabel() {
        return excludedLabel;
    }

    public void setExcludedLabel(String excludedLabel) {
        this.excludedLabel = excludedLabel;
    }

    public int getDistractorId() {
        return distractorId;
    }

    public void setDistractorId(int distractorId) {
        this.distractorId = distractorId;
    }

    public String getDistractorLabel() {
        return distractorLabel;
    }

    public void setDistractorLabel(String distractorLabel) {
        this.distractorLabel = distractorLabel;
    }

    public boolean isCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(boolean correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
//    public String initalSort = "";
//    private String userSort = "";  // Hack for StatefulBeanToCsvBuilder
//    private String targetSort = ""; // Hack for StatefulBeanToCsvBuilder

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getDtEnd() {
        return dtEnd;
    }

    public void setDtEnd(String dtEnd) {
        this.dtEnd = dtEnd;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getHitId() {
        return hitId;
    }

    public void setHitId(String hitId) {
        this.hitId = hitId;
    }

    public boolean isHitReward() {
        return hitReward;
    }

    public void setHitReward(boolean hitReward) {
        this.hitReward = hitReward;
    }

    public String getModality() {
        return modality;
    }

    public void setModality(String modality) {
        this.modality = modality;
    }

    public int getSandbox() {
        return sandbox;
    }

    public void setSandbox(int sandbox) {
        this.sandbox = sandbox;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getRequestedOn() {
        return requestedOn;
    }

    public void setRequestedOn(String requestedOn) {
        this.requestedOn = requestedOn;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getTrial() {
        return trial;
    }

    public void setTrial(int trial) {
        this.trial = trial;
    }

    public String getLikert() {
        return likert;
    }

    public void setLikert(String likert) {
        this.likert = likert;
    }

}
