package com.bbn.xai.domain;

import java.io.Serializable;
public class VqaBundleMin implements Serializable {
    private String id = "";
    private String img = "";
    private String question = "";
    private String answer = "";

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
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

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    private String explanation = "";


    public VqaBundleMin() {
        // Empty explicit default constructor
    }


}
