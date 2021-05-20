package com.bbn.xai.repository;

import com.bbn.xai.domain.BlurAnswer;
import com.bbn.xai.domain.BlurAnswerSummary;
import com.bbn.xai.domain.OneShotAnswer;
import com.bbn.xai.domain.coco.CocoFormat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OneShotAnswerRepository extends MongoRepository<OneShotAnswer, String> {

    Long deleteOneShotAnswerByWorkerId(String workerId);


}
