package com.bbn.xai.domain;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;


@Document(collection = "blur_answer")
public class BlurAnswerSummary implements Serializable {

    //@CsvBindByPosition(position = 0)
    @Id
    public String id;
    //User info
    public String workerId = "";
    //Task info
    public String assignmentId = "";
    public String qId;

    public String answer;
    public String groundTruth;

    public boolean isFinalAnswer;
    public boolean hitReward = false;
    public String modality = "";  // text, heatmap, component




    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getqId() {
        return qId;
    }

    public void setqId(String qId) {
        this.qId = qId;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getGroundTruth() {
        return groundTruth;
    }

    public void setGroundTruth(String groundTruth) {
        this.groundTruth = groundTruth;
    }

    public boolean getIsCorrect() {
//        return isCorrect;
        return this.groundTruth.equals(this.answer);
    }

    public boolean getIsFinalAnswer() {
        return isFinalAnswer;
    }

    public void setIsFinalAnswer(boolean finalAnswer) {
        isFinalAnswer = finalAnswer;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public boolean getHitReward() {
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
}
