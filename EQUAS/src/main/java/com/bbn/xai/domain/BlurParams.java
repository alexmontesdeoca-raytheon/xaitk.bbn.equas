package com.bbn.xai.domain;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;


@Document(collection = "blur_params")
public class BlurParams implements Serializable {

    @Id
    public String id;
    public List<Integer> excludedQuestionIds = new ArrayList<>();
    public List<String> excludedAnswerOptions = Arrays.asList("one");
    public Integer blurMax = 98;
    public Double blurStep = 0.03;
    public Integer blurLimit = 30;  // proceed the user to the next question after they hit this blur amount limit
    public Integer questionsPerHit = 5;  // grant HIT reward after this many questions
    public Integer maxQuestionsPerWorker = 30;  // end experiment for user once they hit this question limit
    public boolean allowFeedback = true;
    public Integer blurModifier = 2;  // increase/decrease blur level for all images by specified amount
    public Double bonusPay = 0.01;
    public Double maxBonusPayout = 0.25;

    public GlobalExplanationFilter datasetFilter = GlobalExplanationFilter.blurGameDefaults();


}
