package com.bbn.xai.domain.coco;

import com.bbn.xai.domain.AnswerScore;
import com.bbn.xai.domain.PreProcessedFaithfulExplanation;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;

public class CocoFormat {

    public static String getImageName(Integer image_id) {
        return image_id + ".jpg";
    }

    public static class QuestionFile {
        public Info info;
        public String task_type;
        public String data_type;
        public License license;
        public String data_subtype;
        public ArrayList<Question> questions = new ArrayList<>();
    }

    public static class AnnotationFile {
        public Info info;
        public String task_type;
        public String data_type;
        public License license;
        public String data_subtype;
        public ArrayList<Annotation> annotations = new ArrayList<>();
    }

    public static class Annotation {
        public Integer question_id;
        @JsonIgnore
        public String question_type;
        @JsonIgnore
        public String answer_type;
        @JsonIgnore
        public String multiple_choice_answer;
        @JsonIgnore
        public Question _question;
        public String getQuestion() {
            if (_question != null) {
                return _question.question;
            }
            return "";
        }

        public String modelAnswer;
        public String topAnswer; //Top Turker answer

        public String explanationHtml;
        public List<AnswerScore> topN = new ArrayList<>();
        public List<PreProcessedFaithfulExplanation.ComponentExplanation> componentExplanation = new ArrayList<>();
        public List<PreProcessedFaithfulExplanation.ComponentExplanation> userSortedFeatures = new ArrayList<>();

        public Integer image_id;
        public ArrayList<Answer> answers = new ArrayList<>();
        public String getImageName() {
            return CocoFormat.getImageName(image_id);
        }

        public double consensus;
        public double calcTurkerConsensusAndGroundTruth() {
            LinkedHashMap<String, Integer> answerCount = new LinkedHashMap<String, Integer>();
            int topMost = 1;
            for (Answer answer : answers) {
                Integer count = answerCount.get(answer.answer);
                if (count == null) {
                    if (topAnswer == null){
                        topAnswer = answer.answer;
                    }

                    answerCount.put(answer.answer, 1);
                } else {
                    answerCount.put(answer.answer, ++count);
                    if (count > topMost) {
                        topMost = count;
                        topAnswer = answer.answer;
                    } else if (count == topMost) {  // If there is a tie between Turker answers.  Let model answer be the tie breaker
                        if (this.modelAnswer.equals(answer.answer)) {
                            topAnswer = answer.answer;
                        }
                    }
                }
            }
            this.consensus =  (double)topMost / answers.size();
            return this.consensus;
        }
    }

    public static class Answer {
        @JsonIgnore
        public Integer answer_id;
        @JsonIgnore
        public String answer_confidence;

        private String answer;



        public String getAnswer() {
            return answer;
        }
        public void setAnswer(String answer) { // Normalize value on load
            this.answer = answer.toLowerCase().replace(",", "").replace("?", "").trim();
        }

    }

    public static class Question {
        public Integer image_id;
        private String question;
        public Integer question_id;


        public Annotation annotation;
//        @JsonIgnore
//        public Annotation getAnnotation() {
//            return annotation;
//        }

        public String getQuestion() {
            return question;
        }
        public void setQuestion(String question) { // Normalize value on load
            this.question = question.toLowerCase().replace(",", "").replace("?", "").trim();
        }

        public String getImageName() {
            return CocoFormat.getImageName(image_id);
        }
    }

    public static class License {
        public String url;
        public String name;
    }

    public static class Info {
        public String description;
        public String url;
        public String version;
        public Integer year;
        public String contributor;
        public String date_created;
    }
}

