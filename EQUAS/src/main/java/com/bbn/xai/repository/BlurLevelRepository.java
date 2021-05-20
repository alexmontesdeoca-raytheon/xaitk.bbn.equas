package com.bbn.xai.repository;

import com.bbn.xai.domain.BlurLevel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlurLevelRepository extends MongoRepository<BlurLevel, String> {

}
