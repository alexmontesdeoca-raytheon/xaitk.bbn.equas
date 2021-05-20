package com.bbn.xai.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.Date;


@Document(collection = "blur_level")
public class BlurLevel implements Serializable {
    @Id
    private String qId;
    private int blurLevel;
    @LastModifiedDate
    public Date modified;

    public String getqId() {
        return qId;
    }

    public void setqId(String qId) {
        this.qId = qId;
    }

    public int getBlurLevel() {
        return blurLevel;
    }

    public void setBlurLevel(int blurLevel) {
        this.blurLevel = blurLevel;
    }

    public Date getModified() {
        return modified;
    }

    public void setModified(Date modified) {
        this.modified = modified;
    }
}
