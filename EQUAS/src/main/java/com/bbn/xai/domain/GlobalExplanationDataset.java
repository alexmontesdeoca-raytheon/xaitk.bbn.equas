package com.bbn.xai.domain;

import com.bbn.xai.domain.coco.CocoFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.*;

public class GlobalExplanationDataset {
    @JsonIgnore
    public static CocoFormat.QuestionFile cocoQuestionFile;
    @JsonIgnore
    public static CocoFormat.AnnotationFile cocoAnnotationFile;
    @JsonIgnore
    public static LinkedHashMap<String, PreProcessedFaithfulExplanation.VqaBundle> preprocessedVqa;

    public GlobalExplanationStatistics statistics = new GlobalExplanationStatistics();
    @JsonIgnore
    public FolderEntity imageSet = new FolderEntity();
    @JsonIgnore
    public LinkedHashMap<String, QuestionStats> questions = new LinkedHashMap<String, QuestionStats>();
    //Allow duplicate question index
//    public Map<String, List<Integer>> answers = new LinkedHashMap<String, List<Integer>>(); // Key: Answer Text, Value:Question Index

    // Key: Answer Text, Value: LinkedHashMap<Question Index, Answer Frequency for question index>
    public LinkedHashMap<String, LinkedHashMap<Integer, Integer>> answers = new LinkedHashMap<String, LinkedHashMap<Integer, Integer>>();

    // Key: Answer Text, Value: LinkedHashMap<Question Index, Answer Frequency for question index>
    public LinkedHashMap<String, LinkedHashMap<Integer, Integer>> modelAnswers = new LinkedHashMap<String, LinkedHashMap<Integer, Integer>>();

    // Annotation/Frequency index on Answer Text;
    @JsonIgnore
    public LinkedHashMap<String, LinkedHashSet<CocoFormat.Annotation>> annotations = new LinkedHashMap<String, LinkedHashSet<CocoFormat.Annotation>>(); // Key: Answer Text, Value:Question Index, Answer Frequency for question index
    @JsonIgnore
    public LinkedHashMap<String, LinkedHashSet<CocoFormat.Annotation>> annotationsByModel = new LinkedHashMap<String, LinkedHashSet<CocoFormat.Annotation>>(); // Key: Answer Text, Value:Question Index, Answer Frequency for question index

    //public Map<String, HashSet<Integer>> answers = new LinkedHashMap<String, HashSet<Integer>>(); // Answer, list of indexes for the questions


    public Map<String, HashSet<Integer>> answerQuestionMap = new LinkedHashMap<String, HashSet<Integer>>();

    public String questionCsv;

    public TaskLog log = new TaskLog();

//    @JsonIgnore
//    public List<CocoFormat.Annotation> annotationList = new ArrayList<>();
    @JsonIgnore
    public HashMap<Integer, CocoFormat.Annotation> annotationHashMap = new HashMap<>();
    @JsonIgnore
    public LinkedHashMap<String, CocoFormat.Annotation> topUniqueAnswers = new LinkedHashMap<String, CocoFormat.Annotation>();  // Top scoring annotation for any given answer



    public static class GlobalExplanationStatistics {
        public int questionsTotal;
        public int questionsUnique;
        public int imageCount;
        public int answersTotal;
        public int answersUnique;
        public int modelAnswersUnique;
        public int modelAnswersCorrect;
        public LinkedHashMap<Integer, Integer> modelAnswersCorrectByIndex = new LinkedHashMap<Integer, Integer>() {{
            put(0, 0);
            put(1, 0);
            put(2, 0);
            put(3, 0);
            put(4, 0);
        }};

        public LinkedHashMap<Double, Integer> turkerConsensus = new LinkedHashMap<Double, Integer>() {{
            put(1.0, 0);
            put(0.9, 0);
            put(0.8, 0);
            put(0.7, 0);
            put(0.6, 0);
            put(0.5, 0);
            put(0.4, 0);
            put(0.3, 0);
            put(0.2, 0);
            put(0.1, 0);

        }};

        public LinkedHashMap<Double, Integer> turkerConsensusInTop5 = new LinkedHashMap<Double, Integer>() {{
            put(1.0, 0);
            put(0.9, 0);
            put(0.8, 0);
            put(0.7, 0);
            put(0.6, 0);
            put(0.5, 0);
            put(0.4, 0);
            put(0.3, 0);
            put(0.2, 0);
            put(0.1, 0);

        }};

        public LinkedHashMap<Double, Integer> turkerConsensusInTop1 = new LinkedHashMap<Double, Integer>() {{
            put(1.0, 0);
            put(0.9, 0);
            put(0.8, 0);
            put(0.7, 0);
            put(0.6, 0);
            put(0.5, 0);
            put(0.4, 0);
            put(0.3, 0);
            put(0.2, 0);
            put(0.1, 0);

        }};

        public void putTurkerConsensus(double percent) {
            Integer count = turkerConsensus.get(percent);
            if (count == null) {
                turkerConsensus.put(percent, 1);
            } else {
                turkerConsensus.put(percent, ++count);
            }
        }

        public void putturkerConsensusInTop5(double percent) {
            Integer count = turkerConsensusInTop5.get(percent);
            if (count == null) {
                turkerConsensusInTop5.put(percent, 1);
            } else {
                turkerConsensusInTop5.put(percent, ++count);
            }
        }

        public void putturkerConsensusInTop1(double percent) {
            Integer count = turkerConsensusInTop1.get(percent);
            if (count == null) {
                turkerConsensusInTop1.put(percent, 1);
            } else {
                turkerConsensusInTop1.put(percent, ++count);
            }
        }

    }

    public static class QuestionStats {
        public int count = 1;
        public int correctCount = 0;
        private int index;

        public int getIndex() {
            return index;
        }

        public int getCount() {
            return count;
        }
        ;
        //        public Map<String, String> images = new LinkedHashMap<String, String>();
//        public Map<String, Integer> topAnswers = new LinkedHashMap<String, Integer>();
//        public List<CocoFormat.Question> cocoQuestions = new ArrayList<>();
        public List<CocoFormat.Annotation> annotations = new ArrayList<>();

        @JsonIgnore
        public Map<Integer, Integer> images = new LinkedHashMap<Integer, Integer>();

        public QuestionStats(int index, int imageIndex) {
            this.index = index;
            this.addImage(imageIndex);
        }

        public void addImage(Integer imageIndex) {
            if (!images.containsKey(imageIndex)) {
                images.put(imageIndex, 1);
            } else {
                int count = images.get(imageIndex) + 1;
                images.put(imageIndex, count);
            }
        }
    }

    public static class AnswerStats {
        //Question Indexes
        public HashSet<Integer> qIdx = new HashSet<>();

        //Annotation Indexes
        public HashSet<Integer> aIdx = new HashSet<>();

    }

}
