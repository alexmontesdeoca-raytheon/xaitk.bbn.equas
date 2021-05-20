package com.bbn.xai.repository;

import com.bbn.xai.domain.*;
import com.bbn.xai.repository.helpers.IdCount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.repository.MongoRepository;

import org.springframework.stereotype.Repository;
import org.springframework.util.Assert;

import java.util.List;

@Repository
public class CustomMongoOperations {
    private final MongoOperations operations;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public CustomMongoOperations(MongoOperations operations, MongoTemplate mongoTemplate) {
        Assert.notNull(operations, "MongoOperations must not be null!");
        Assert.notNull(operations, "MongoTemplate must not be null!");
        this.operations = operations;
        this.mongoTemplate = mongoTemplate;
    }

    public List<IdCount> questionCountByModality(Boolean isFinalAnswer, String modality) {
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("isFinalAnswer").is(isFinalAnswer).and("modality").is(modality)),
//            Aggregation.project("qId"),
//            Aggregation.unwind("qId"),
            Aggregation.group("qId")
                .count().as("count"),
            Aggregation.sort(Sort.Direction.ASC, "count")
        );

        AggregationResults<IdCount> results = operations.aggregate(aggregation, "blur_answer", IdCount.class);
        List<IdCount> idCounts = results.getMappedResults();
        return idCounts;
    }

    public List<BlurAnswer> questionsWorkerHasAlreadyCompleted(String workerId) {
        Query query = new Query(Criteria.where("isFinalAnswer").is(true).andOperator(Criteria.where("workerId").is(workerId)));
        return operations.find(query,BlurAnswer.class);
    }

    public Boolean hasWorkerAlreadyParticipatedInAnotherModality(String workerId, String modality) {
        Query query = new Query(Criteria.where("workerId").is(workerId).andOperator(Criteria.where("modality").ne(modality)));
        long count = operations.count(query, "blur_answer");
        if (count > 0){
            return true;
        } else {
            return false;
        }
    }

    public long deleteAllTestWorkers(){
        Query query = new BasicQuery("{ workerId : /^test_/ }");
        return operations.findAllAndRemove(query, "blur_answer").size();
    }

    public long deleteAllSandboxWorkers(){
        Query query = new Query(Criteria.where("sandbox").in(1,2));
        return operations.findAllAndRemove(query, "blur_answer").size();
    }

    public long renameModality(String currentName, String newName){
        Query query = new Query(Criteria.where("modality").is(currentName));
        Update update = new Update().set("modality", newName);
        return operations.updateMulti(query, update, "blur_answer").getModifiedCount();
    }


    public List<OneShotAnswer> oneShotTrialsWorkerHasAlreadyCompleted(String workerId) {
        Query query = new Query(Criteria.where("workerId").is(workerId));
        return operations.find(query,OneShotAnswer.class);
    }

    public List<OneShotAnswerV2> oneShotV2TrialsWorkerHasAlreadyCompleted(String workerId) {
        Query query = new Query(Criteria.where("workerId").is(workerId));
        return operations.find(query, OneShotAnswerV2.class);
    }

    public List<OneShotAnswerV3> oneShotV3TrialsWorkerHasAlreadyCompleted(String workerId) {
        Query query = new Query(Criteria.where("workerId").is(workerId));
        return operations.find(query, OneShotAnswerV3.class);
    }

    public List<IdCount> questionCountOneShot(Boolean isFinalAnswer, String modality) {
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("modality").is(modality)),
//            Aggregation.project("qId"),
//            Aggregation.unwind("qId"),
            Aggregation.group("_id")
                .count().as("count"),
            Aggregation.sort(Sort.Direction.ASC, "count")
        );

        AggregationResults<IdCount> results = operations.aggregate(aggregation, "oneshot_answer", IdCount.class);
        List<IdCount> idCounts = results.getMappedResults();
        return idCounts;
    }

}

