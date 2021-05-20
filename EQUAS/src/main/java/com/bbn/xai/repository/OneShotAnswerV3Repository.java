package com.bbn.xai.repository;

import com.bbn.xai.domain.OneShotAnswerV2;
import com.bbn.xai.domain.OneShotAnswerV3;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OneShotAnswerV3Repository extends MongoRepository<OneShotAnswerV3, String> {

    Long deleteOneShotAnswerByWorkerId(String workerId);


}
