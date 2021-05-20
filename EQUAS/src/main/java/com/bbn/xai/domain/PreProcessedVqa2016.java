package com.bbn.xai.domain;


import com.bbn.xai.domain.coco.CocoFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

public class PreProcessedVqa2016 {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VqaBundle {
        public Integer id; // This is the Coco image_id
        public String answer;  // Top answer by Turkers as determined by get_top_answers in EQUAS\ext\HieCoAttenVQA\prepro\prepro_vqa.py
        public VqaReply reply;
//        @JsonIgnore
//        public CocoFormat.Question question;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VqaReply {
        public String answer = "";  // 2016 VQA model answer
    }
}
