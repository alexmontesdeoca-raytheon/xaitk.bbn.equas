package com.bbn.xai.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class VqaReply implements Serializable {
    private String id = "";
    private String answer = "";
    private Collection<VqaBestAnswer> bestAnswers = new ArrayList<>();
    private Collection<VqaNeuron> neurons = new ArrayList<>();

    public Collection<VqaBestAnswer> getBestAnswers() {
        return bestAnswers;
    }

    public void setBestAnswers(Collection<VqaBestAnswer> bestAnswers) {
        this.bestAnswers = bestAnswers;
    }

    public Collection<VqaNeuron> getNeurons() {
        return neurons;
    }

    public void setNeurons(Collection<VqaNeuron> neurons) {
        this.neurons = neurons;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public static class FaithfulResponse {
        public String answer;
        public String explanation;
        public String explanationHtml;
        public String componentExplanationHtml;
        public List<ComponentExplanation> componentExplanation = new ArrayList<>();
        public Collection<AnswerScore> topN = new ArrayList<>();
    }

    static class VqaBestAnswer {
        private int id;
        private String answer = "";
        private double activation;

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public String getAnswer() {
            return answer;
        }

        public void setAnswer(String answer) {
            this.answer = answer;
        }

        public double getActivation() {
            return activation;
        }

        public void setActivation(double activation) {
            this.activation = activation;
        }
    }

    static class VqaNeuron {
        private int neuronId;
        private String label;
        private String category;
        private double accuracy;
        private String imageryFilename;
        private double activation;

        public int getNeuronId() {
            return neuronId;
        }

        public void setNeuronId(int neuronId) {
            this.neuronId = neuronId;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public double getAccuracy() {
            return accuracy;
        }

        public void setAccuracy(double accuracy) {
            this.accuracy = accuracy;
        }

        public String getImageryFilename() {
            return imageryFilename;
        }

        public void setImageryFilename(String imageryFilename) {
            this.imageryFilename = imageryFilename;
        }

        public double getActivation() {
            return activation;
        }

        public void setActivation(double activation) {
            this.activation = activation;
        }
    }

}
