package com.bbn.xai.repository;

import com.bbn.xai.domain.BlurAnswer;
import com.bbn.xai.domain.BlurAnswerSummary;
import com.bbn.xai.domain.GlobalExplanation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlurAnswerRepository extends MongoRepository<BlurAnswer, String> {

    List<BlurAnswer> findByuserConfidence(int value);
    List<BlurAnswer> findByisFinalAnswer(boolean value);
    List<BlurAnswer> findBymodality(String value);
    List<BlurAnswerSummary> findAllSummarizedByisFinalAnswer(boolean value);  // No faster than findByisFinalAnswer :(

    // Speed up query/object mapper performance by limiting only fields of interest.
    @Query(value = "{$or: [{isFinalAnswer: true}]}",fields = "{ qId: 1, workerId: 1, assignmentId: 1, groundTruth: 1, answer: 1, modality: 1 }")
    List<BlurAnswer> customQueryFindByisFinalAnswer();

//    @Query(value = "{'isFinalAnswer' : ?0 , 'modality' : ?1}",fields = "{ qId: 1, workerId: 1, assignmentId: 1, groundTruth: 1, answer: 1, modality: 1 }")
//    List<BlurAnswer> customQueryFindByisFinalAnswer(Boolean isFinalAnswer, String modality, String workerId);
    List<BlurAnswer> findByWorkerId(String workerId);

    Long deleteBlurAnswerByWorkerId(String workerId);

    Long deleteBlurAnswerByModality(String modality);
}
