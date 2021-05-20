package com.bbn.xai.domain;

import com.opencsv.bean.CsvBindAndJoinByPosition;
import com.opencsv.bean.CsvBindAndSplitByPosition;
import com.opencsv.bean.CsvBindByPosition;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.Date;
import java.util.Objects;


@Document(collection = "blur_answer")
public class BlurAnswer implements Serializable {

    //@CsvBindByPosition(position = 0)
    @Id
    public String id;
    //User info
    public String workerId = "";
    public String ip;
    public String sessionId; // unique Id given by Equas
    @CreatedBy
    public String user;

    //Task info
    public String assignmentId = "";
    public String hitId = "";
    public String qId;
    public String imgId;
    public String answer;
    public String groundTruth;
//    public boolean isCorrect;
    public int attempt;
    public int userConfidence;
    public boolean isFinalAnswer;
    public int blurAmount; // 0-100
//    public int sessionTime;

    //Misc info
    public int newW;
    public int newH;
    public int orgW;
    public int orgH;
//    public double scale;
    public double blurRadius; // pixels
    public int screenW;
    public int screenH;
    public int zoom; // browser zoom
    public Date dtStart;
    @CreatedDate
    public Date dtEnd;
    public String blurStrategy;
    @Size(min = 0, max = 200)
    public String feedback = "";
    public Date requestedOn;
    public boolean hitReward = false;
    public String modality = "";  // text, heatmap, component
    public String likert = "";
    public int oToggles = 0;

    public String modelAnswer = "";
    public int sandbox = 0;
    public double bonus = 0;
    public boolean userOverride = false;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

//    public int getSessionTime() {
//        return sessionTime;
//    }
//
//    public void setSessionTime(int sessionTime) {
//        this.sessionTime = sessionTime;
//    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getqId() {
        return qId;
    }

    public void setqId(String qId) {
        this.qId = qId;
    }

    public String getImgId() {
        return imgId;
    }

    public void setImgId(String imgId) {
        this.imgId = imgId;
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
        if (this.modality.contains("-mm")) {  // Mental Modeling
//            return this.modelAnswer.equals(this.answer);
            if (this.answer.equals("Correctly")) {
                if (this.modelAnswer.equals(this.groundTruth)) {
                    return true;
                } else {
                    return false;
                }
            } else if (this.answer.equals("Incorrectly")) {
                if (this.modelAnswer.equals(this.groundTruth)) {
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        } else {
            return this.groundTruth.equals(this.answer);
        }

    }

//    public void setIsCorrect(boolean correct) {
//        isCorrect = correct;
//    }

    public int getAttempt() {
        return attempt;
    }

    public void setAttempt(int attempt) {
        this.attempt = attempt;
    }

    public int getUserConfidence() {
        return userConfidence;
    }

    public void setUserConfidence(int userConfidence) {
        this.userConfidence = userConfidence;
    }

    public boolean getIsFinalAnswer() {
        return isFinalAnswer;
    }

    public void setIsFinalAnswer(boolean finalAnswer) {
        isFinalAnswer = finalAnswer;
    }

    public int getBlurAmount() {
        return blurAmount;
    }

    public void setBlurAmount(int blurAmount) {
        this.blurAmount = blurAmount;
    }

    public int getNewW() {
        return newW;
    }

    public void setNewW(int newW) {
        this.newW = newW;
    }

    public int getNewH() {
        return newH;
    }

    public void setNewH(int newH) {
        this.newH = newH;
    }

    public int getOrgW() {
        return orgW;
    }

    public void setOrgW(int orgW) {
        this.orgW = orgW;
    }

    public int getOrgH() {
        return orgH;
    }

    public void setOrgH(int orgH) {
        this.orgH = orgH;
    }

    public double getBlurRadius() {
        return blurRadius;
    }

    public void setBlurRadius(double blurRadius) {
        this.blurRadius = blurRadius;
    }

    public int getScreenW() {
        return screenW;
    }

    public void setScreenW(int screenW) {
        this.screenW = screenW;
    }

    public int getScreenH() {
        return screenH;
    }

    public void setScreenH(int screenH) {
        this.screenH = screenH;
    }

    public int getZoom() {
        return zoom;
    }

    public void setZoom(int zoom) {
        this.zoom = zoom;
    }

    public Date getDtStart() {
        return dtStart;
    }

    public void setDtStart(Date dtStart) {
        this.dtStart = dtStart;
    }

    public Date getDtEnd() {
        return dtEnd;
    }

    public void setDtEnd(Date dtEnd) {
        this.dtEnd = dtEnd;
    }

    public String getBlurStrategy() {
        return blurStrategy;
    }

    public void setBlurStrategy(String blurStrategy) {
        this.blurStrategy = blurStrategy;
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

    public String getHitId() {
        return hitId;
    }

    public void setHitId(String hitId) {
        this.hitId = hitId;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Date getRequestedOn() {
        return requestedOn;
    }

    public void setRequestedOn(Date requestedOn) {
        this.requestedOn = requestedOn;
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

    public String getLikert() {
        return likert;
    }

    public void setLikert(String likert) {
        this.likert = likert;
    }

    public int getoToggles() {
        return oToggles;
    }

    public void setoToggles(int oToggles) {
        this.oToggles = oToggles;
    }

    public String getModelAnswer() {
        return modelAnswer;
    }

    public void setModelAnswer(String modelAnswer) {
        this.modelAnswer = modelAnswer;
    }

    public int getSandbox() {
        return sandbox;
    }

    public void setSandbox(int sandbox) {
        this.sandbox = sandbox;
    }

    public double getBonus() {
        return bonus;
    }

    public void setBonus(double bonus) {
        this.bonus = bonus;
    }

    public boolean getUserOverride() {
        return userOverride;
    }

    public void setUserOverride(boolean userOverride) {
        this.userOverride = userOverride;
    }
}
