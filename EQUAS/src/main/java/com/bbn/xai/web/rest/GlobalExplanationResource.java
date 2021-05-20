package com.bbn.xai.web.rest;

import com.bbn.xai.config.Constants;
import com.bbn.xai.domain.*;
import com.bbn.xai.domain.coco.CocoFormat;
import com.bbn.xai.security.AuthoritiesConstants;
import com.codahale.metrics.annotation.Timed;
import com.bbn.xai.service.GlobalExplanationService;
import com.bbn.xai.web.rest.errors.BadRequestAlertException;
import com.bbn.xai.web.rest.util.HeaderUtil;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVWriter;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;
import io.github.jhipster.web.util.ResponseUtil;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import java.util.*;

/**
 * REST controller for managing GlobalExplanation.
 */
@RestController
@RequestMapping("/api")
public class GlobalExplanationResource {

    private final Logger log = LoggerFactory.getLogger(GlobalExplanationResource.class);

    private static final String ENTITY_NAME = "globalExplanation";

    private final GlobalExplanationService globalExplanationService;

    public GlobalExplanationResource(GlobalExplanationService globalExplanationService) {
        this.globalExplanationService = globalExplanationService;
    }

    /**
     * POST  /global-explanations : Create a new globalExplanation.
     *
     * @param globalExplanation the globalExplanation to create
     * @return the ResponseEntity with status 201 (Created) and with body the new globalExplanation, or with status 400 (Bad Request) if the globalExplanation has already an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/global-explanations")
    @Timed
    public ResponseEntity<GlobalExplanation> createGlobalExplanation(@RequestBody GlobalExplanation globalExplanation) throws URISyntaxException {
        log.debug("REST request to save GlobalExplanation : {}", globalExplanation);
        if (globalExplanation.getId() != null) {
            throw new BadRequestAlertException("A new globalExplanation cannot already have an ID", ENTITY_NAME, "idexists");
        }
        GlobalExplanation result = globalExplanationService.save(globalExplanation);
        return ResponseEntity.created(new URI("/api/global-explanations/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    /**
     * PUT  /global-explanations : Updates an existing globalExplanation.
     *
     * @param globalExplanation the globalExplanation to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated globalExplanation,
     * or with status 400 (Bad Request) if the globalExplanation is not valid,
     * or with status 500 (Internal Server Error) if the globalExplanation couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/global-explanations")
    @Timed
    public ResponseEntity<GlobalExplanation> updateGlobalExplanation(@RequestBody GlobalExplanation globalExplanation) throws URISyntaxException {
        log.debug("REST request to update GlobalExplanation : {}", globalExplanation);
        if (globalExplanation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        GlobalExplanation result = globalExplanationService.save(globalExplanation);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, globalExplanation.getId().toString()))
            .body(result);
    }

    /**
     * GET  /global-explanations : get all the globalExplanations.
     *
     * @return the ResponseEntity with status 200 (OK) and the list of globalExplanations in body
     */
    @GetMapping("/global-explanations")
    @Timed
    public List<GlobalExplanation> getAllGlobalExplanations() {
        log.debug("REST request to get all GlobalExplanations");
        return globalExplanationService.findAll();
    }

    /**
     * GET  /global-explanations/:id : get the "id" globalExplanation.
     *
     * @param id the id of the globalExplanation to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the globalExplanation, or with status 404 (Not Found)
     */
    @GetMapping("/global-explanations/{id}")
    @Timed
    public ResponseEntity<GlobalExplanation> getGlobalExplanation(@PathVariable String id) {
        log.debug("REST request to get GlobalExplanation : {}", id);
        Optional<GlobalExplanation> globalExplanation = globalExplanationService.findOne(id);
        return ResponseUtil.wrapOrNotFound(globalExplanation);
    }

    /**
     * DELETE  /global-explanations/:id : delete the "id" globalExplanation.
     *
     * @param id the id of the globalExplanation to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/global-explanations/{id}")
    @Timed
    public ResponseEntity<Void> deleteGlobalExplanation(@PathVariable String id) {
        log.debug("REST request to delete GlobalExplanation : {}", id);
        globalExplanationService.delete(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id)).build();
    }


    @ApiOperation("Request question history CSV")
    @GetMapping("/global-explanations/annotation-csv/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{filter:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<String> getAnnotationCSV(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable String filter, GlobalExplanationFilter filterParams) throws IOException {
        String result = this.globalExplanationService.getGlobalExplanationDataset(datasetName, evaluationPhase, filter, filterParams).questionCsv;
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request global explanation dataset")
    @GetMapping("/global-explanations/global-explanation-dataset/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{filter:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<GlobalExplanationDataset> getGlobalExplanationDataset(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable String filter, GlobalExplanationFilter filterParams) throws IOException {
        GlobalExplanationDataset result = this.globalExplanationService.getGlobalExplanationDataset(datasetName, evaluationPhase, filter, filterParams);
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request annotations for a particular question")
    @PostMapping("/global-explanations/annotations-for-question/{filter:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<List<CocoFormat.Annotation>> getAnnotationsForQuestion(@PathVariable String filter, @RequestBody String question, GlobalExplanationFilter filterParams) throws IOException {
        GlobalExplanationDataset.QuestionStats qStat = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, filter, filterParams).questions.get(question);
        return new ResponseEntity<>(qStat.annotations, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request annotation by Id")
    @GetMapping("/global-explanations/annotation/{id:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<CocoFormat.Annotation> getAnnotationById(@PathVariable Integer id) throws IOException {
        GlobalExplanationDataset ged = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "", new GlobalExplanationFilter());
        if (ged.annotationHashMap.containsKey(id)) {
            return new ResponseEntity<>(ged.annotationHashMap.get(id), HeaderUtil.createHeader(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(null, HeaderUtil.createHeader(), HttpStatus.OK);
        }
    }

    @ApiOperation("Request annotations for a turker answer")
    @PostMapping("/global-explanations/annotations-for-answer/{filter:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity< HashSet<CocoFormat.Annotation>> getAnnotationsForAnswer(@PathVariable String filter, @RequestBody String answer, GlobalExplanationFilter filterParams) throws IOException {
        HashSet<CocoFormat.Annotation> result = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, filter, filterParams).annotations.get(answer);
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request annotations for a model answer")
    @PostMapping("/global-explanations/annotations-for-model-answer/{filter:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity< HashSet<CocoFormat.Annotation>> getAnnotationsForModelAnswer(@PathVariable String filter, @RequestBody String answer, GlobalExplanationFilter filterParams) throws IOException {
        HashSet<CocoFormat.Annotation> result = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, filter, filterParams).annotationsByModel.get(answer);
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Get similar images to the one specified")
    @GetMapping("/global-explanations/similar-images/{imageName:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<List<Integer>> getSimilarImages(@PathVariable String imageName) throws IOException, URISyntaxException {
        return new ResponseEntity<>(this.globalExplanationService.getSimilarImages(imageName), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request N annotations")
    @GetMapping("/global-explanations/n-annotations/{maxResults:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<Collection<CocoFormat.Annotation>> getNAnnotations(@PathVariable Integer maxResults, GlobalExplanationFilter filterParams) throws IOException {
        GlobalExplanationDataset globalExplanationDataset = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "",  filterParams);
        List<CocoFormat.Annotation> result = new ArrayList<>();
        for(CocoFormat.Annotation annotation : globalExplanationDataset.annotationHashMap.values()) {
            result.add(annotation);
            if (result.size() >= maxResults) {
                return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
            }
        }
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }


//    @ApiOperation("Request blur game question")
//    @PostMapping("/global-explanations/blur-game-question/")
//    @Timed
//    public ResponseEntity<List<CocoFormat.Annotation>> getBlurGameQuestion() throws IOException {
//        LinkedHashMap<String, GlobalExplanationDataset.QuestionStats> questions = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game").questions;
//
//        List<CocoFormat.Annotation> result = null;
//        for (GlobalExplanationDataset.QuestionStats qStat : questions.values()) {
//            if (qStat.count > 25) {
//                result = qStat.annotations;
//            }
//        }
//
//        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
//    }

    @ApiOperation("Request blur game questions")
    @GetMapping("/global-explanations/blur-game-questions")
    @Timed
    public ResponseEntity<Collection<CocoFormat.Annotation>> getBlurGameQuestions() throws IOException {
        BlurParams blurParams = this.globalExplanationService.getBlurGameParams();
        GlobalExplanationDataset globalExplanationDataset = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game", blurParams.datasetFilter);
        return new ResponseEntity<>(globalExplanationDataset.annotationHashMap.values(), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request next blur game question")
    @GetMapping(value = {
        "/global-explanations/blur-game-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX + "}",
        "/global-explanations/blur-game-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX  + "}/{modality:" + Constants.FILE_REGEX  + "}"
    })
    @Timed
    public ResponseEntity<BlurQuestion> getNextBlurGameQuestion(@PathVariable String workerId, @PathVariable String assignmentId, @PathVariable Integer forceQuestionId, @PathVariable(required = false)  String modality) throws IOException {
        if (modality == null) {
            modality = "";
        }
        return new ResponseEntity<>(this.globalExplanationService.getNextBlurGameQuestion(workerId, assignmentId, forceQuestionId, modality), HeaderUtil.createHeader(), HttpStatus.OK);
    }


    @ApiOperation("Request next one shot question")
    @GetMapping(value = {
        "/global-explanations/one-shot-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX  + "}/{modality:" + Constants.FILE_REGEX  + "}",
        "/global-explanations/one-shot-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX  + "}/{modality:" + Constants.FILE_REGEX  + "}/{category:" + Constants.ALLOWSPACE_REGEX  +  "}/{trial:" + Constants.FILE_REGEX  + "}"
    })
    @Timed
    public ResponseEntity<BlurQuestion> getNextOneShotGameQuestion(@PathVariable String workerId, @PathVariable String assignmentId, @PathVariable Integer forceQuestionId, @PathVariable String modality, @PathVariable String category, @PathVariable Integer trial) throws IOException {
        if (modality == null) {
            modality = "";
        }
        if (category.equals("none")) {
            return new ResponseEntity<>(this.globalExplanationService.getNextOneShotGameQuestion(workerId, assignmentId, forceQuestionId, modality), HeaderUtil.createHeader(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(this.globalExplanationService.getNextOneShotGameQuestion(workerId, assignmentId, forceQuestionId, modality, category, trial), HeaderUtil.createHeader(), HttpStatus.OK);
        }
    }


    @ApiOperation("Request next one shot question")
    @GetMapping(value = {
        "/global-explanations/one-shot-v2-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX  + "}/{modality:" + Constants.FILE_REGEX  + "}"
    })
    @Timed
    public ResponseEntity<BlurQuestion> getNextOneShotV2GameQuestion(@PathVariable String workerId, @PathVariable String assignmentId, @PathVariable Integer forceQuestionId, @PathVariable String modality) throws IOException {
        if (modality == null) {
            modality = "";
        }
        return new ResponseEntity<>(this.globalExplanationService.getNextOneShotV2GameQuestion(workerId, assignmentId, forceQuestionId, modality), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request next one shot question")
    @GetMapping(value = {
        "/global-explanations/one-shot-v3-next-question/{workerId:" + Constants.FILE_REGEX + "}/{assignmentId:" + Constants.FILE_REGEX + "}/{forceQuestionId:" + Constants.FILE_REGEX  + "}/{modality:" + Constants.FILE_REGEX  + "}"
    })
    @Timed
    public ResponseEntity<BlurQuestion> getNextOneShotV3GameQuestion(@PathVariable String workerId, @PathVariable String assignmentId, @PathVariable Integer forceQuestionId, @PathVariable String modality) throws IOException {
        if (modality == null) {
            modality = "";
        }
        return new ResponseEntity<>(this.globalExplanationService.getNextOneShotV3GameQuestion(workerId, assignmentId, forceQuestionId, modality), HeaderUtil.createHeader(), HttpStatus.OK);
    }

//    @ApiOperation("Request blur game highest scored questions")
//    @GetMapping("/global-explanations/blur-game-top-questions")
//    @Timed
//    public ResponseEntity<Collection<CocoFormat.Annotation>> getBlurGameQuestionsForTopUniqueAnswers() throws IOException {
//        GlobalExplanationDataset globalExplanationDataset = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game", GlobalExplanationFilter.blurGameDefaults());
//        return new ResponseEntity<>(globalExplanationDataset.topUniqueAnswers.values(), HeaderUtil.createHeader(), HttpStatus.OK);
//    }

    @ApiOperation("Request all unique answers for the full Global Explanation dataset")
    @GetMapping("/global-explanations/all-unique-answers")
    @Timed
    public ResponseEntity<List<String>> getAllUniqueAnswers() throws IOException {
        GlobalExplanationDataset globalExplanationDataset = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "", new GlobalExplanationFilter());
        return new ResponseEntity<>(new ArrayList<String>(globalExplanationDataset.topUniqueAnswers.keySet()), HeaderUtil.createHeader(), HttpStatus.OK);
    }

//    @ApiOperation("Request blur game question")
//    @PostMapping("/global-explanations/blur-game-question/{annotationIndex:" + Constants.FILE_REGEX + "}")
//    @Timed
//    public ResponseEntity<CocoFormat.Annotation> getBlurGameQuestion(@PathVariable int annotationIndex, @RequestBody String question) throws IOException {
//        GlobalExplanationDataset.QuestionStats qStat = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game", GlobalExplanationFilter.blurGameDefaults()).questions.get(question);
//        return new ResponseEntity<>(qStat.annotations.get(annotationIndex), HeaderUtil.createHeader(), HttpStatus.OK);
//    }

    @ApiOperation("Lookup questions")
    @PostMapping("/global-explanations/lookup-questions-by-id")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<String> saveBlurGameAnswer(@RequestBody String ids)  throws IOException {
        String[] listofIds = ids.split("\n");
        String result = "";
        GlobalExplanationDataset ged = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "", new GlobalExplanationFilter());
        for (String id: listofIds ) {
//            log.debug(ged.annotationHashMap.get(Integer.parseInt(id)).question.getQuestion());
            result += ged.annotationHashMap.get(Integer.parseInt(id)).getQuestion() + "\n";
        }
//        return ResponseEntity.ok().build();
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }


    @ApiOperation("Import blur game answers")
    @PostMapping("/global-explanations/import-blur-game-answers")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> saveBlurGameAnswer(@RequestParam MultipartFile blurAnswersFile) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        List<BlurAnswer> blurAnswers = mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).readValue(blurAnswersFile.getInputStream(), mapper.getTypeFactory().constructCollectionType(List.class, BlurAnswer.class));
        this.globalExplanationService.importBlurGameAnswers(blurAnswers);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Delete all blur game answers for a particular workerId")
    @DeleteMapping("/global-explanations/delete-blur-game-answers-by-worker-id/{workerId}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteBlurGameAnswersByWokerId(@PathVariable String workerId) {
        this.globalExplanationService.deleteBlurGameAnswersByWorkerId(workerId);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("blurAnswer", workerId)).build();
    }

    @ApiOperation("Delete all e2e test workers")
    @DeleteMapping("/global-explanations/delete-e2e-workers")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteTestWorkers() {
        long count = this.globalExplanationService.deleteAllTestWorkers();
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("count", Long.toString(count))).build();
    }

    @ApiOperation("Delete all sandbox (workersandbox and equas.net) workers")
    @DeleteMapping("/global-explanations/delete-sandbox-workers")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteSandboxWorkers() {
        long count = this.globalExplanationService.deleteAllSandboxWorkers();
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("count", Long.toString(count))).build();
    }

    @ApiOperation("Delete ALL blur game answers")
    @DeleteMapping("/global-explanations/delete-all-blur-game-answers/{safeWord}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteAllBlurGameAnswers(@PathVariable String safeWord) {
        this.globalExplanationService.deleteAllBlurGameAnswers(safeWord);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("blurAnswer", "allBlurAnswers")).build();
    }

    @ApiOperation("Delete ALL blur game answers for the specified modality")
    @DeleteMapping("/global-explanations/delete-blur-game-answers-by-modality/{safeWord}/{modality}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteBlurGameAnswersForModality(@PathVariable String safeWord, @PathVariable String modality) {
        long count = this.globalExplanationService.deleteBlurGameAnswersByModality(safeWord, modality);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("count",  Long.toString(count))).build();
    }

    @ApiOperation("Rename modality")
    @PostMapping("/global-explanations/rename-modality/{currentName}/{newName}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> renameModality(@PathVariable String currentName, @PathVariable String newName) {
        long count = this.globalExplanationService.renameModality(currentName, newName);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("count", Long.toString(count))).build();
    }

    @ApiOperation("Answer blur game question")
    @PostMapping("/global-explanations/blur-game-answer")
    @Timed
    public ResponseEntity<Void> saveBlurGameAnswer(@RequestBody BlurAnswer blurAnswer,  HttpServletRequest request) {
        blurAnswer.ip = request.getRemoteAddr();
        blurAnswer.setId(null); // Let Mongo generate the Id.
        BlurAnswer result = this.globalExplanationService.saveBlurGameAnswer(blurAnswer);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityCreationAlert("blurAnswer", result.id)).build();
    }

    @ApiOperation("Save user feedback for blur game")
    @PostMapping("/global-explanations/blur-game-feedback/{id}/{collectReward}/{likertResponses}")
    @Timed
    public ResponseEntity<Void> saveBlurGameFeedback(@RequestBody(required = false) String feedback, @PathVariable String id, @PathVariable boolean collectReward, @PathVariable String likertResponses) {
        this.globalExplanationService.saveBlurGameFeedback(id, feedback, collectReward, likertResponses);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Get blur game answer results in CSV format")
    @GetMapping("/global-explanations/blur-game-results-csv")
    @Timed
    public void getBlurGameAnswerResultsCsv(HttpServletResponse response) throws Exception  {
//        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResults(), HeaderUtil.createHeader(), HttpStatus.OK);
        //set file name and content type
        String filename = "blur-game-results.csv";

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"");

        //create a csv writer
        StatefulBeanToCsv<BlurAnswer> writer = new StatefulBeanToCsvBuilder<BlurAnswer>(response.getWriter())
            .withSeparator(CSVWriter.DEFAULT_SEPARATOR)
            .withOrderedResults(true)
            .build();

        //write all BlurAnswers to csv file
        writer.write(this.globalExplanationService.getBlurGameAnswerResults());
    }

//    @ApiOperation("Get blur game answer results")
//    @GetMapping("/global-explanations/blur-game-results")
//    @Timed
//    public ResponseEntity<List<BlurAnswer>> getBlurGameAnswerResults() {
//        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResults(), HeaderUtil.createHeader(), HttpStatus.OK);
//    }

    @ApiOperation("Get blur game answer results")
    @GetMapping("/global-explanations/blur-game-results")
    @Timed
    public ResponseEntity<List<BlurAnswer>> getBlurGameAnswerResults() throws IOException {
//        BlurParams blurParams = this.globalExplanationService.getBlurGameParams();
        List<BlurAnswer>BlurGameAnswerResults = this.globalExplanationService.getBlurGameAnswerResults();

//        GlobalExplanationDataset globalExplanationDataset = this.globalExplanationService.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game",  new GlobalExplanationFilter());
//        for (BlurAnswer blurAnswer : BlurGameAnswerResults) {
//            PreProcessedFaithfulExplanation.VqaBundle modelResults = globalExplanationDataset.preprocessedVqa.get(blurAnswer.qId);
//            blurAnswer.modelAnswer = modelResults.answer;
//        }
        return new ResponseEntity<>(BlurGameAnswerResults, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Determine if a worker has already participated in a another modality")
    @GetMapping(value = {
        "/global-explanations/worker-already-participated/{workerId}",
        "/global-explanations/worker-already-participated/{workerId}/{modality}"
    })
    @Timed
    public ResponseEntity<Boolean> hasWorkerAlreadyParticipatedInAnotherModality(@PathVariable String workerId, @PathVariable(required = false)  String modality) {
        if (modality == null) {
            modality = "";
        }
        return new ResponseEntity<>( this.globalExplanationService.hasWorkerAlreadyParticipatedInAnotherModality(workerId, modality), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Get blur game answer results by worker")
    @GetMapping("/global-explanations/blur-game-results/{workerId}")
    @Timed
    public ResponseEntity<List<BlurAnswer>> getBlurGameAnswerResultsByWorker(@PathVariable String workerId) {
        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResultsByWorkerId(workerId), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Get blur game answer results")
    @GetMapping("/global-explanations/blur-game-results-final-answers")
    @Timed
    public ResponseEntity<List<BlurAnswer>> getBlurGameAnswerResultsFinalAnswers() {
        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResultsFinalAnswers(), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Get blur game answer results by modality")
    @GetMapping(value ={"/global-explanations/blur-game-results-by-modality/", "/global-explanations/blur-game-results-by-modality/{modality}"})
    @Timed
    public ResponseEntity<List<BlurAnswer>> getBlurGameAnswerResultsByModality(@PathVariable(required = false)  String modality) {
        if (modality == null) {
            modality = "";
        }
        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResultsByModality(modality), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Save blur game params")
    @PostMapping("/global-explanations/save-blur-game-params")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> saveBlurGameParams(@RequestBody BlurParams blurParams) {
        this.globalExplanationService.saveBlurGameParams(blurParams);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Save blur level for image/question pairs")
    @PostMapping("/global-explanations/save-blur-levels")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> saveBlurLevels(@RequestBody List<BlurLevel> blurLevels) {
        this.globalExplanationService.saveBlurLevels(blurLevels);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Get blur levels for image/question pairs")
    @GetMapping("/global-explanations/blur-levels")
    @Timed
    public ResponseEntity<List<BlurLevel>> getBlurLevels() {
        return new ResponseEntity<>(this.globalExplanationService.getBlurLevels(), HeaderUtil.createHeader(), HttpStatus.OK);
    }


    @ApiOperation("Get blur game params")
    @GetMapping("/global-explanations/blur-game-params")
    @Timed
    public ResponseEntity<BlurParams> getBlurGameParams() {
        return new ResponseEntity<>( this.globalExplanationService.getBlurGameParams(), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit one-shot answer")
    @PostMapping("/global-explanations/one-shot-answer")
    @Timed
    public ResponseEntity<Void> saveOneShotAnswer(@RequestBody OneShotAnswer oneshotAnswer,  HttpServletRequest request) {
        oneshotAnswer.ip = request.getRemoteAddr();
        oneshotAnswer.setId(null); // Let Mongo generate the Id.
        OneShotAnswer result = this.globalExplanationService.saveOneShotAnswer(oneshotAnswer);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityCreationAlert("oneshotAnswer", result.id)).build();
    }

    @ApiOperation("Get one-shot answer results")
    @GetMapping("/global-explanations/one-shot-results")
    @Timed
    public ResponseEntity<List<OneShotAnswer>> getOneShotAnswerResults() throws IOException {
        List<OneShotAnswer>BlurGameAnswerResults = this.globalExplanationService.getOneShotAnswerResults();
        return new ResponseEntity<>(BlurGameAnswerResults, HeaderUtil.createHeader(), HttpStatus.OK);
    }
    @ApiOperation("Delete one-shot answer by id")
    @DeleteMapping("/global-explanations/delete-one-shot-answer-by-id/{id}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotAnswersById(@PathVariable String id) {
        this.globalExplanationService.deleteOneShotAnswerById(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", id.toString())).build();
    }

    @ApiOperation("Delete one-shot answer by id")
    @DeleteMapping("/global-explanations/delete-one-shot-v2-answer-by-id/{id}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotV2AnswersById(@PathVariable String id) {
        this.globalExplanationService.deleteOneShotV2AnswerById(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", id.toString())).build();
    }

    @ApiOperation("Delete one-shot answer by id")
    @DeleteMapping("/global-explanations/delete-one-shot-v3-answer-by-id/{id}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotV3AnswersById(@PathVariable String id) {
        this.globalExplanationService.deleteOneShotV3AnswerById(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", id.toString())).build();
    }

    @ApiOperation("Delete all one-shot answers for a particular workerId")
    @DeleteMapping("/global-explanations/delete-one-shot-answers-by-worker-id/{workerId}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotAnswersByWorkerId(@PathVariable String workerId) {
        this.globalExplanationService.deleteOneShotAnswersByWorkerId(workerId);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", workerId)).build();
    }

    @ApiOperation("Delete all one-shot answers for a particular workerId")
    @DeleteMapping("/global-explanations/delete-one-shot-v2-answers-by-worker-id/{workerId}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotV2AnswersByWorkerId(@PathVariable String workerId) {
        this.globalExplanationService.deleteOneShotV2AnswersByWorkerId(workerId);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", workerId)).build();
    }

    @ApiOperation("Delete all one-shot answers for a particular workerId")
    @DeleteMapping("/global-explanations/delete-one-shot-v3-answers-by-worker-id/{workerId}")
    @Timed
//    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteOneshotV3AnswersByWorkerId(@PathVariable String workerId) {
        this.globalExplanationService.deleteOneShotV3AnswersByWorkerId(workerId);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", workerId)).build();
    }

    @ApiOperation("Delete ALL one-shot answers")
    @DeleteMapping("/global-explanations/delete-all-one-shot-answers/{safeWord}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteAllOneShotAnswers(@PathVariable String safeWord) {
        this.globalExplanationService.deleteOneShotGameAnswers(safeWord);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", "allOneshotAnswer")).build();
    }

    @ApiOperation("Delete ALL one-shot answers")
    @DeleteMapping("/global-explanations/delete-all-one-shot-v2-answers/{safeWord}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteAllOneShotV2Answers(@PathVariable String safeWord) {
        this.globalExplanationService.deleteOneShotV2GameAnswers(safeWord);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", "allOneshotAnswer")).build();
    }

    @ApiOperation("Delete ALL one-shot answers")
    @DeleteMapping("/global-explanations/delete-all-one-shot-v3-answers/{safeWord}")
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<Void> deleteAllOneShotV3Answers(@PathVariable String safeWord) {
        this.globalExplanationService.deleteOneShotV3GameAnswers(safeWord);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert("oneshotAnswer", "allOneshotAnswer")).build();
    }

    @ApiOperation("Save user feedback for one-shot game")
    @PostMapping("/global-explanations/one-shot-feedback/{id}/{collectReward}/{likertResponses}")
    @Timed
    public ResponseEntity<Void> saveOneShotFeedback(@RequestBody(required = false) String feedback, @PathVariable String id, @PathVariable boolean collectReward, @PathVariable String likertResponses) {
        this.globalExplanationService.saveOneShotFeedback(id, feedback, collectReward, likertResponses);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Save user feedback for one-shot game")
    @PostMapping("/global-explanations/one-shot-v2-feedback/{id}/{collectReward}/{likertResponses}")
    @Timed
    public ResponseEntity<Void> saveOneShotV2Feedback(@RequestBody(required = false) String feedback, @PathVariable String id, @PathVariable boolean collectReward, @PathVariable String likertResponses) {
        this.globalExplanationService.saveOneShotV2Feedback(id, feedback, collectReward, likertResponses);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Save user feedback for one-shot game")
    @PostMapping("/global-explanations/one-shot-v3-feedback/{id}/{collectReward}/{likertResponses}")
    @Timed
    public ResponseEntity<Void> saveOneShotV3Feedback(@RequestBody(required = false) String feedback, @PathVariable String id, @PathVariable boolean collectReward, @PathVariable String likertResponses) {
        this.globalExplanationService.saveOneShotV3Feedback(id, feedback, collectReward, likertResponses);
        return ResponseEntity.ok().build();
    }

    @ApiOperation("Get one-shot answer results in CSV format")
    @GetMapping("/global-explanations/one-shot-results-csv")
    @Timed
    public void getOneShotAnswerResultsCsv(HttpServletResponse response) throws Exception  {
//        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResults(), HeaderUtil.createHeader(), HttpStatus.OK);
        //set file name and content type
        String filename = "one-shot-results.csv";

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"");

        //create a csv writer
        StatefulBeanToCsv<OneShotAnswer> writer = new StatefulBeanToCsvBuilder<OneShotAnswer>(response.getWriter())
            .withSeparator(CSVWriter.DEFAULT_SEPARATOR)
            .withOrderedResults(true)
            .build();

        //write all BlurAnswers to csv file
        writer.write(this.globalExplanationService.getOneShotAnswerResults());
    }

    @ApiOperation("Get one-shot answer results in CSV format")
    @GetMapping("/global-explanations/one-shot-results-v2-csv")
    @Timed
    public void getOneShotAnswerResultsV2Csv(HttpServletResponse response) throws Exception  {
//        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResults(), HeaderUtil.createHeader(), HttpStatus.OK);
        //set file name and content type
        String filename = "one-shot-results-v2.csv";

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"");

        //create a csv writer
        StatefulBeanToCsv<OneShotAnswerV2> writer = new StatefulBeanToCsvBuilder<OneShotAnswerV2>(response.getWriter())
            .withSeparator(CSVWriter.DEFAULT_SEPARATOR)
            .withOrderedResults(true)
            .build();

        //write all BlurAnswers to csv file
        writer.write(this.globalExplanationService.getOneShotAnswerV2Results());
    }

    @ApiOperation("Get one-shot answer results in CSV format")
    @GetMapping("/global-explanations/one-shot-results-v3-csv")
    @Timed
    public void getOneShotAnswerResultsV3Csv(HttpServletResponse response) throws Exception  {
//        return new ResponseEntity<>( this.globalExplanationService.getBlurGameAnswerResults(), HeaderUtil.createHeader(), HttpStatus.OK);
        //set file name and content type
        String filename = "one-shot-results-v3.csv";

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + filename + "\"");

        //create a csv writer
        StatefulBeanToCsv<OneShotAnswerV3> writer = new StatefulBeanToCsvBuilder<OneShotAnswerV3>(response.getWriter())
            .withSeparator(CSVWriter.DEFAULT_SEPARATOR)
            .withOrderedResults(true)
            .build();

        //write all BlurAnswers to csv file
        writer.write(this.globalExplanationService.getOneShotAnswerV3Results());
    }
}
