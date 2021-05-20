package com.bbn.xai.repository;

import com.bbn.xai.domain.OneShotAnswerV2;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OneShotAnswerV2Repository extends MongoRepository<OneShotAnswerV2, String> {

    Long deleteOneShotAnswerByWorkerId(String workerId);


}
