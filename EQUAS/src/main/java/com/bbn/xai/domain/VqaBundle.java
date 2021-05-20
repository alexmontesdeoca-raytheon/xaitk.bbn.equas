package com.bbn.xai.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

//@org.springframework.data.mongodb.core.mapping.Document(collection = "VqaBundle")
public class VqaBundle implements Serializable {
    @Id
    private String id = "";
    private String question = "";
    private String answer = "";
    private String img = "";
    private String imgUri = "";
    private String groundTruth = "";
    private String forceAnswer = "";
    private String userId = "";
    private LocalDateTime timeAsked;
    private LocalDateTime timeAnswered;
    private VqaReply reply;
	private NlgDescription naturalLanguage = new NlgDescription();
	private String explanation = "";
    private String explanationHtml = "";
    private List<ComponentExplanation>  componentExplanation = new ArrayList<>();
    private String componentExplanationHtml = "";
    private Collection<AnswerScore> topN = new ArrayList<>();


    public VqaBundle() {
        // Empty explicit default constructor
    }

    public VqaBundle(String question, String id, String imgUri) {
        this.question = question;
        this.id = id;
        this.imgUri = imgUri;
    }

    public VqaReply getReply() {
        return reply;
    }

    public void setReply(VqaReply reply) {
        this.reply = reply;
    }

    public LocalDateTime getTimeAsked() {
        return timeAsked;
    }

    public void setTimeAsked(LocalDateTime timeAsked) {
        this.timeAsked = timeAsked;
    }

    public LocalDateTime getTimeAnswered() {
        return timeAnswered;
    }

    public void setTimeAnswered(LocalDateTime timeAnswered) {
        this.timeAnswered = timeAnswered;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getGroundTruth() {
        return groundTruth;
    }

    public void setGroundTruth(String groundTruth) {
        this.groundTruth = groundTruth;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getImgUri() {
        return imgUri;
    }

    public void setImgUri(String imgUri) {
        this.imgUri = imgUri;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getForceAnswer() {
        return forceAnswer;
    }

    public void setForceAnswer(String forceAnswer) {
        this.forceAnswer = forceAnswer;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }

	public void setNaturalLanguage(NlgDescription naturalLanguage) {
		this.naturalLanguage = naturalLanguage;
	}

	public NlgDescription getNaturalLanguage() {
		return naturalLanguage;
	}

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getExplanationHtml() {
        return explanationHtml;
    }

    public void setExplanationHtml(String explanationHtml) {
        this.explanationHtml = explanationHtml;
    }

    public String getComponentExplanationHtml() {
        return componentExplanationHtml;
    }

    public void setComponentExplanationHtml(String componentExplanationHtml) {
        this.componentExplanationHtml = componentExplanationHtml;
    }

    public List<ComponentExplanation> getComponentExplanation() {
        return componentExplanation;
    }

    public void setComponentExplanation(List<ComponentExplanation> componentExplanation) {
        this.componentExplanation = componentExplanation;
    }

    public Collection<AnswerScore> getTopN() {
        return topN;
    }

    public void setTopN(Collection<AnswerScore> topN) {
        this.topN = topN;
    }


}


