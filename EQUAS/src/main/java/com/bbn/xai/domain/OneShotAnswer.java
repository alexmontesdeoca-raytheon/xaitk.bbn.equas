package com.bbn.xai.domain;

import com.bbn.xai.domain.coco.CocoFormat;
import com.opencsv.bean.CsvBindByName;
import com.opencsv.bean.CsvIgnore;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.Size;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;


@Document(collection = "oneshot_answer")
public class OneShotAnswer {

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
    @CsvIgnore
    public String likert = "";

    public Date requestedOn;
    @CreatedDate
    public Date dtEnd;

    public String category;
    public int trial;
    public String correctQuestionId = "";
    public String selectedQuestionId = "";
    public int levenshtein = 0;
    public double kendallsTau = 1;

    public String initalSort = "";
    private String userSort = "";  // Hack for StatefulBeanToCsvBuilder
    private String targetSort = ""; // Hack for StatefulBeanToCsvBuilder

    public String getUserSort() {
        List<String> list = new ArrayList<>();
        if (this.annotations.size() > 0) {
            for (PreProcessedFaithfulExplanation.ComponentExplanation feature : this.annotations.get(0).userSortedFeatures) {
                list.add(feature.classString);
            }
        }
        return String.join(",", list);
    }

    public String getTargetSort() {
        List<String> list = new ArrayList<>();
        if (this.annotations.size() > 0) {
            for (PreProcessedFaithfulExplanation.ComponentExplanation feature : this.annotations.get(0).componentExplanation) {
                list.add(feature.classString);
            }
        }
        return String.join(",", list);
    }

    @CsvIgnore
    public List<CocoFormat.Annotation> annotations = new ArrayList<>();

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

    public Date getDtEnd() {
        return dtEnd;
    }

    public void setDtEnd(Date dtEnd) {
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

    public Date getRequestedOn() {
        return requestedOn;
    }

    public void setRequestedOn(Date requestedOn) {
        this.requestedOn = requestedOn;
    }

    public String getLikert() {
        return likert;
    }

    public void setLikert(String likert) {
        this.likert = likert;
    }

    public String getSelectedQuestionId() {
        return selectedQuestionId;
    }

    public void setSelectedQuestionId(String selectedQuestionId) {
        this.selectedQuestionId = selectedQuestionId;
    }

    public List<CocoFormat.Annotation> getAnnotations() {
        return annotations;
    }

    public void setAnnotations(List<CocoFormat.Annotation> annotations) {
        this.annotations = annotations;
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

    public int getLevenshtein() {
        return levenshtein;
    }

    public void setLevenshtein(int levenshtein) {
        this.levenshtein = levenshtein;
    }

    public double getKendallsTau() {
        return kendallsTau;
    }

    public void setKendallsTau(double kendallsTau) {
        this.kendallsTau = kendallsTau;
    }


}
