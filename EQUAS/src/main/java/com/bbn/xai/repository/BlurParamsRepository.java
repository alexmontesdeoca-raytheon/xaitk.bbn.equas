package com.bbn.xai.repository;

import com.bbn.xai.domain.BlurParams;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlurParamsRepository extends MongoRepository<BlurParams, String> {

}
