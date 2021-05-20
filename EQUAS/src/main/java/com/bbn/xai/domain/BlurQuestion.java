package com.bbn.xai.domain;

import com.bbn.xai.domain.coco.CocoFormat;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;


public class BlurQuestion implements Serializable {

    public long completedInAssignment = 0;
    public long completedTotal = 0;
    public long answersCorrect = 0;
    public long answersWrong = 0;
    public int correctBlurLevel = 99;
    public CocoFormat.Annotation annotation;
    public Date requestedOn = new Date();
    public Double bonusPayTotal = 0.0;

    public String correctQuestionId;
    public List<CocoFormat.Annotation> annotations = new ArrayList<>();
    public long maxTrials = 0;
    public double score;

}
