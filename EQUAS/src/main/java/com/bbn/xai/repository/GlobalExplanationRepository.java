package com.bbn.xai.repository;

import com.bbn.xai.domain.GlobalExplanation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository for the GlobalExplanation entity.
 */
@SuppressWarnings("unused")
@Repository
public interface GlobalExplanationRepository extends MongoRepository<GlobalExplanation, String> {

}
