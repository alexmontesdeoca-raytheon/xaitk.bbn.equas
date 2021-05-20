package com.bbn.xai.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

//@org.springframework.data.mongodb.core.mapping.Document(collection = "VqaBundle")
public class VqaHistory implements Serializable {
    private String hostAddress;
    private String imgUri;
    private List<VqaBundle> history = new ArrayList<>();
    private List<VqaBundle> annotations = new ArrayList<>();

    public VqaHistory(String hostAddress, String imgUri, List<VqaBundle> history, List<VqaBundle> annotations) {
        this.hostAddress = hostAddress;
        this.imgUri = imgUri;
        this.history = history;
        this.annotations = annotations;
    }

    public String getHostAddress() {
        return hostAddress;
    }

    public void setHostAddress(String hostAddress) {
        this.hostAddress = hostAddress;
    }

    public List<VqaBundle> getAnnotations() {
        return annotations;
    }

    public void setAnnotations(List<VqaBundle> annotations) {
        this.annotations = annotations;
    }

    public String getImgUri() {
        return imgUri;
    }

    public void setImgUri(String imgUri) {
        this.imgUri = imgUri;
    }

    public List<VqaBundle> getHistory() {
        return history;
    }

    public void setHistory(List<VqaBundle> history) {
        this.history = history;
    }
}
