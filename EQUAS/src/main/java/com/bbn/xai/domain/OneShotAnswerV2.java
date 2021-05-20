package com.bbn.xai.domain;

import com.bbn.xai.domain.coco.CocoFormat;
import com.opencsv.bean.CsvIgnore;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;


@Document(collection = "oneshot_answer_v2")
public class OneShotAnswerV2 {

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

    public double accuracy_before;
    public double accuracy_after;
    public double f1_before;
    public double f1_after;
    public String likert = "";

    public int totalMoveCount = 0;
    public int excludedCount = 0;

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

    public double getAccuracy_before() {
        return accuracy_before;
    }

    public void setAccuracy_before(double accuracy_before) {
        this.accuracy_before = accuracy_before;
    }

    public double getAccuracy_after() {
        return accuracy_after;
    }

    public void setAccuracy_after(double accuracy_after) {
        this.accuracy_after = accuracy_after;
    }

    public double getF1_before() {
        return f1_before;
    }

    public void setF1_before(double f1_before) {
        this.f1_before = f1_before;
    }

    public double getF1_after() {
        return f1_after;
    }

    public void setF1_after(double f1_after) {
        this.f1_after = f1_after;
    }

    public String getLikert() {
        return likert;
    }

    public void setLikert(String likert) {
        this.likert = likert;
    }

    public int getTotalMoveCount() {
        return totalMoveCount;
    }

    public void setTotalMoveCount(int totalMoveCount) {
        this.totalMoveCount = totalMoveCount;
    }

    public int getExcludedCount() {
        return excludedCount;
    }

    public void setExcludedCount(int excludedCount) {
        this.excludedCount = excludedCount;
    }
}
