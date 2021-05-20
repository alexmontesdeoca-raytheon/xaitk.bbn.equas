package com.bbn.xai.domain;


import com.bbn.xai.domain.coco.CocoFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class PreProcessedFaithfulExplanation {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VqaBundle {
        @JsonIgnore
        public CocoFormat.Question cocoQuestion;

        public Integer id; // This is the Coco image_id
        private String question;
        private String top_turker_answer;  // Top answer by Turkers as determined by get_top_answers in EQUAS\ext\HieCoAttenVQA\prepro\prepro_vqa.py
        public String answer = "";  // FE model answer
        public String explanationHtml = "";  // FE model answer
        public List<AnswerScore> top_n = new ArrayList<>();
        public List<ComponentExplanation> componentExplanation = new ArrayList<>();

        public double getDelta1_2() {
            return this.top_n.get(0).score - this.top_n.get(1).score;
        }
        public double getDelta2_3() {
            return this.top_n.get(1).score - this.top_n.get(2).score;
        }
        public double getDelta3_4() {
            return this.top_n.get(2).score - this.top_n.get(3).score;
        }
        public double getDelta4_5() {
            return this.top_n.get(3).score - this.top_n.get(4).score;
        }

        public double getSlope1_2() {
            return this.getDelta2_3() - this.getDelta1_2();
        }

        public double getSlope2_3() {
            return this.getDelta3_4() - this.getDelta2_3();
        }

        @JsonIgnore
        public boolean inTop2 () {
            if (this.top_n.get(0).answer.equals(this.top_turker_answer)) {
                return true;
            }else if (this.top_n.get(1).answer.equals(this.top_turker_answer)) {
                return true;
            }
            return false;
        }

        @JsonIgnore
        public boolean inTop5 () {
            for (AnswerScore answerScore : this.top_n ) {
                if (answerScore.answer.equals(this.top_turker_answer)) {
                    return true;
                }
            }
            return false;
        }

        @JsonIgnore
        public boolean topModelAnswerWrongButSecondIsRight () {
            if (this.top_n.get(1).answer.equals(this.top_turker_answer)) {
                return true;
            }
            return false;
        }

        @JsonIgnore
        public boolean isPlural() { // Is the rejected alternative just the plural/singular form of the right answer
            if (this.top_n.get(0).answer.equals(this.top_n.get(1).answer + "s")) {
                return true;
            }else if (this.top_n.get(1).answer.equals(this.top_n.get(0).answer + "s")) {
                return true;
            }
            return false;
        }

        @JsonIgnore
        public boolean isSimilarAnswer() { // tennis racket/racket,  baseball bat/bat etc.
            if (this.top_n.get(0).answer.contains(this.top_n.get(1).answer)) {
                return true;
            }else if (this.top_n.get(1).answer.contains(this.top_n.get(0).answer)) {
                return true;
            }
            return false;
        }

        @JsonIgnore
        public double compositeScore() {
            return this.top_n.get(0).score + this.top_n.get(1).score;
        }

        @JsonIgnore
        public boolean isVqaCorrect() {
            return this.answer.equals(this.getTop_turker_answer());
        }

        @JsonIgnore
        public boolean isVqaWrong() {
            return !isVqaCorrect();
        }

        @JsonIgnore
        public boolean isYesNoAnswer() {
            if (top_turker_answer.equals("yes") || top_turker_answer.equals("no"))            {
                return true;
            } else {
                return false;
            }
        }
        @JsonIgnore
        public boolean isNumericAnswer() {
            if (isInt(top_turker_answer))            {
                return true;
            } else {
                return false;
            }
        }

        @JsonIgnore
        public boolean isInteresting() {
//            if (!explanationHtml.contains("(255,165,0)") ||  // < - Make sure the explanation has a segmentation mask
            if (top_turker_answer.length() <= 2 ||
                isYesNoAnswer() ||
                isNumericAnswer() ||
                top_turker_answer.contains(":")
            )
            {
                return false;
            } else {
                return true;
            }
        }

        @JsonIgnore
        public int segmentationMaskCount () {
            return explanationHtml.split("<span", -1).length - 2;
        }

        @JsonIgnore
        public boolean hasInterestingSegmentationMask () {
            if (explanationHtml.contains("(255")) {  // Orange seg mask
                return true;
            } else if (explanationHtml.contains("(142")) { // Blue seg mask
                return true;
            } else if (segmentationMaskCount() >= 3) {
                return true;
            }
            return false;

        }

        @JsonIgnore
        public String qaKey() {
            return this.getQuestion() + " - " + this.getTop_turker_answer();
        }



        public String img;
        public String explanation;



        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question.replace(",", "").replace("?", "").trim().toLowerCase();
        }

        public String getTop_turker_answer() {
            return top_turker_answer;
        }

        public void setTop_turker_answer(String top_turker_answer) {
            this.top_turker_answer = top_turker_answer.replace(",", "").trim().toLowerCase();
        }

        private boolean isInt(String str)
        {
            if (str == null) {
                return false;
            }
            int length = str.length();
            if (length == 0) {
                return false;
            }
            int i = 0;
            if (str.charAt(0) == '-') {
                if (length == 1) {
                    return false;
                }
                i = 1;
            }
            for (; i < length; i++) {
                char c = str.charAt(i);
                if (c <= '/' || c >= ':') {
                    return false;
                }
            }
            return true;
        }



    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ComponentExplanation {
        public List<Integer> rgb = new ArrayList<>();
        public String instanceCount = "";
        @JsonProperty("class")
        public String classString = "";
        public String scoreSum = "";
    }
}
