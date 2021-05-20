package com.bbn.xai.service;

import com.bbn.xai.config.ApplicationProperties;
import com.bbn.xai.domain.*;
import com.bbn.xai.domain.coco.CocoFormat;
import com.bbn.xai.repository.*;
import com.bbn.xai.repository.helpers.IdCount;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.discovery.converters.Auto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StopWatch;

import java.io.*;
import java.net.URISyntaxException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipFile;

/**
 * Service Implementation for managing GlobalExplanation.
 */
@Service
public class GlobalExplanationService {

    private final Logger log = LoggerFactory.getLogger(GlobalExplanationService.class);

    private final GlobalExplanationRepository globalExplanationRepository;

    @Autowired
    private OneShotAnswerRepository oneShotAnswerRepository;

    @Autowired
    private OneShotAnswerV2Repository oneShotAnswerV2Repository;

    @Autowired
    private OneShotAnswerV3Repository oneShotAnswerV3Repository;

    @Autowired
    private BlurAnswerRepository blurAnswerRepository;

    @Autowired
    private CustomMongoOperations customMongoOperations;

    @Autowired
    private BlurParamsRepository blurParamsRepository;

    @Autowired
    private BlurLevelRepository blurLevelRepository;

    @Autowired
    private ExperimentService experimentService;

    @Autowired
    private ApplicationProperties applicationProperties;

    public GlobalExplanationService(GlobalExplanationRepository globalExplanationRepository) {
        this.globalExplanationRepository = globalExplanationRepository;
    }

    /**
     * Save a globalExplanation.
     *
     * @param globalExplanation the entity to save
     * @return the persisted entity
     */
    public GlobalExplanation save(GlobalExplanation globalExplanation) {
        log.debug("Request to save GlobalExplanation : {}", globalExplanation);
        return globalExplanationRepository.save(globalExplanation);
    }

    /**
     * Get all the globalExplanations.
     *
     * @return the list of entities
     */
    public List<GlobalExplanation> findAll() {
        log.debug("Request to get all GlobalExplanations");
        return globalExplanationRepository.findAll();
    }


    /**
     * Get one globalExplanation by id.
     *
     * @param id the id of the entity
     * @return the entity
     */
    public Optional<GlobalExplanation> findOne(String id) {
        log.debug("Request to get GlobalExplanation : {}", id);
        return globalExplanationRepository.findById(id);
    }

    /**
     * Delete the globalExplanation by id.
     *
     * @param id the id of the entity
     */
    public void delete(String id) {
        log.debug("Request to delete GlobalExplanation : {}", id);
        globalExplanationRepository.deleteById(id);
    }

    public LinkedHashMap<String, GlobalExplanationDataset> globalExplanationDatasets = new LinkedHashMap<String, GlobalExplanationDataset>();

    public boolean isInt(String str) {
        if (str == null) {
            return false;
        }
        int length = str.length();
        if (length == 0) {
            return false;
        }
        int i = 0;
        if (str.charAt(0) == '-') {
            if (length == 1) {
                return false;
            }
            i = 1;
        }
        for (; i < length; i++) {
            char c = str.charAt(i);
            if (c <= '/' || c >= ':') {
                return false;
            }
        }
        return true;
    }

    public GlobalExplanationDataset getGlobalExplanationDataset(String datasetName, EvaluationPhase evaluationPhase, String filterName, GlobalExplanationFilter filterParams) throws IOException {
        int debugMaxQuestionsCount = 0;
        int debugMaxQuestionsLimit = 999999999;
        String eol = System.getProperty("line.separator");
        ObjectMapper mapper = new ObjectMapper();
        datasetName = "v2_coco"; // Its always coco
        String outputPath = applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/" + "globalExplanationDataset.json";

        String key = datasetName + "-" + evaluationPhase.toString() + "-" + filterName;
        if (filterParams != null) {
            key += filterParams.toString();
        }
        if (this.globalExplanationDatasets.containsKey(key)) {
            return this.globalExplanationDatasets.get(key);
        } else {
            GlobalExplanationDataset result = new GlobalExplanationDataset();

            // Get a list of all images for the dataset
            // Not needed at the moment
            // result.imageSet = experimentService.getAllImageFiles(datasetName, evaluationPhase);
            //Create linked hash map for image names for quicker lookup.
            Map<String, Integer> uniqueImages = new LinkedHashMap<String, Integer>();

            //intially populate image list with those that are found on disk.  Note: Images could be missing.
//            int imgIndex = 0;
//            for (String imgName : result.imageSet.getFiles()) {
//                uniqueImages.put(imgName, imgIndex);
//                imgIndex += 1;
//            }


            if (result.cocoQuestionFile == null) {
                result.log.startTask("Server - Load Coco Question/Annotation Files");
//                if (evaluationPhase == EvaluationPhase.training) {
//                    result.cocoQuestionFile = mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/questions/v2_OpenEnded_mscoco_train2014_questions.json"), CocoFormat.QuestionFile.class);
//                    result.cocoAnnotationFile = mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/annotations/v2_mscoco_train2014_annotations.json"), CocoFormat.AnnotationFile.class);
//                } else if (evaluationPhase == EvaluationPhase.validation) {
                    result.cocoQuestionFile = mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/questions/v2_OpenEnded_mscoco_val2014_questions.json"), CocoFormat.QuestionFile.class);
                    result.cocoAnnotationFile = mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/annotations/v2_mscoco_val2014_annotations.json"), CocoFormat.AnnotationFile.class);
//                }
            }

            if (result.preprocessedVqa == null) {
                result.log.startTask("Server - Load Pre-Processed VQA results");
//                if (evaluationPhase == EvaluationPhase.training) {
//                    result.preprocessedVqa = mapper.readValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/fe_ge_train.json"), new TypeReference<LinkedHashMap<String, PreProcessedFaithfulExplanation.VqaBundle>>() {
//                    });
//                } else if (evaluationPhase == EvaluationPhase.validation) {
                    result.preprocessedVqa = mapper.readValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/fe_ge_val_full.json"), new TypeReference<LinkedHashMap<String, PreProcessedFaithfulExplanation.VqaBundle>>() {
                    });
//                }



                for (int i = 0; i < result.cocoQuestionFile.questions.size(); i++) { // Link up questions and annotations
                    //The question and answer file are currently in the same order, but can this always be guaranteed?
                    CocoFormat.Question cocoQuestion = result.cocoQuestionFile.questions.get(i);
                    CocoFormat.Annotation cocoAnnotation = result.cocoAnnotationFile.annotations.get(i);
                    cocoQuestion.annotation = cocoAnnotation;
                    cocoAnnotation._question = cocoQuestion;

                    PreProcessedFaithfulExplanation.VqaBundle modelResults = result.preprocessedVqa.get(cocoQuestion.question_id.toString());
                    modelResults.cocoQuestion = cocoQuestion;
                    cocoQuestion.annotation.modelAnswer = modelResults.answer;
                    cocoQuestion.annotation.calcTurkerConsensusAndGroundTruth(); // If there is a tie between Turker answers.  The model answer will be the tie breaker
                    modelResults.setTop_turker_answer(cocoQuestion.annotation.topAnswer); // Override the preprocessedVqa top_turker_answer with value from calcTurkerConsensusAndGroundTruth
//                cocoQuestion.annotation.topAnswer = modelResults.getTop_turker_answer();

//                if (!cocoQuestion.annotation.topAnswer.equals(modelResults.getTop_turker_answer())) {
//
//                }

                    cocoQuestion.annotation.explanationHtml = modelResults.explanationHtml;
                    cocoQuestion.annotation.topN = modelResults.top_n;
                    cocoQuestion.annotation.componentExplanation = modelResults.componentExplanation;
                }
            }


            LinkedHashMap<Integer, PreProcessedFaithfulExplanation.VqaBundle> filteredPreproccessedVqa = new LinkedHashMap<>();
//
//            if (filterName.equals("all")) {
//                for (PreProcessedFaithfulExplanation.VqaBundle vqaBundle : result.preprocessedVqa.values()) {
//                    filteredPreproccessedVqa.put(vqaBundle.id, vqaBundle);
//                }
//            } else if (filterName.equals("rejected-alternatives")) {
//                for (PreProcessedFaithfulExplanation.VqaBundle vqaBundle : result.preprocessedVqa.values()) {
//                    if (vqaBundle.isInteresting()) {
//                        if (vqaBundle.inTop2()) {
//                            // if (vqaBundle.topModelAnswerWrongButSecondIsRight()) {
//                            if (vqaBundle.getSlope1_2() >= 1) {
//                                if (vqaBundle.isPlural() == false) {
//                                    if (vqaBundle.isSimilarAnswer() == false) {
//                                        if (vqaBundle.compositeScore() > 0) {
//                                            filteredPreproccessedVqa.put(vqaBundle.id, vqaBundle);
//                                        }
//                                    }
//                                }
//                            }
//                        }
//                    }
//                }
//
//            } else if (filterName.equals("blur-game")) {
            HashSet<Integer> visitedImages = new HashSet<>();  // Used to exclude duplicate images
            HashSet<String> visitedQuestions = new HashSet<>();  // Used to exclude duplicate Question/Answer/Image triples

            // Shuffle preprocessedVqa collection if the seed is greater that zero
            List<PreProcessedFaithfulExplanation.VqaBundle> preprocessedVqaList = new ArrayList(result.preprocessedVqa.values());
            if (filterParams.getShuffleSeed() != 0) {
                Collections.shuffle(preprocessedVqaList, new Random(filterParams.getShuffleSeed()));
            }

            for (PreProcessedFaithfulExplanation.VqaBundle vqaBundle : preprocessedVqaList) {
                if (vqaBundle.cocoQuestion.annotation.consensus >= filterParams.getMinTurkerConsensus()) {                             // Turker agreement percent. out of 10 Turkers
                    if ((filterParams.getVqaRight() && vqaBundle.isVqaCorrect() || filterParams.getVqaWrong() && vqaBundle.isVqaWrong())) {  // VQA model got the answer correct
                        if (filteredPreproccessedVqa.size() < filterParams.getMaxQuestions()) {
                            if ((filterParams.getAllowYesNo() && vqaBundle.isYesNoAnswer()) || filterParams.getAllowNumeric() && vqaBundle.isNumericAnswer() || !vqaBundle.isYesNoAnswer() && !vqaBundle.isNumericAnswer()) { //&& vqaBundle.hasInterestingSegmentationMask()) {
                                if (filterParams.getAllowDuplicateImages() || !visitedImages.contains(vqaBundle.cocoQuestion.image_id)) {
                                    if (filterParams.getAllowDuplicateQuestions() || !visitedQuestions.contains(vqaBundle.getQuestion())) {
                                        if (filterParams.getAllowDuplicateAnswers() || !result.topUniqueAnswers.containsKey(vqaBundle.getTop_turker_answer())) {
                                            if (filterParams.getAllowPluralForms() || !pluralForms.contains(vqaBundle.getTop_turker_answer())) {
                                                if (filterParams.getAllowBinary() || !isBinary(vqaBundle.getQuestion())) {
                                                    if (filterParams.getAllowOcr() || !isOcr(vqaBundle.getQuestion())) {
                                                        visitedImages.add(vqaBundle.cocoQuestion.image_id);
                                                        visitedQuestions.add(vqaBundle.getQuestion());
                                                        filteredPreproccessedVqa.put(vqaBundle.id, vqaBundle);
                                                        result.annotationHashMap.put(vqaBundle.cocoQuestion.question_id, vqaBundle.cocoQuestion.annotation);
//                                                uniqueAnswers.add(vqaBundle.getTop_turker_answer());
//                                                if (result.randomUniqueAnswers.containsKey(vqaBundle.getTop_turker_answer())) {
//                                                    result.randomUniqueAnswers.put(vqaBundle.getTop_turker_answer(), vqaBundle.cocoQuestion.annotation);
//                                                }
                                                        CocoFormat.Annotation topAnswer = result.topUniqueAnswers.get(vqaBundle.getTop_turker_answer());
                                                        if (topAnswer == null ||
                                                            (vqaBundle.answer.equals(vqaBundle.getTop_turker_answer()) && !topAnswer.topAnswer.equals(topAnswer.modelAnswer)) ||
                                                            (vqaBundle.answer.equals(vqaBundle.getTop_turker_answer()) && topAnswer.topAnswer.equals(topAnswer.modelAnswer) && vqaBundle.cocoQuestion.annotation.topN.get(0).score >= topAnswer.topN.get(0).score)
                                                        ) {
                                                            result.topUniqueAnswers.put(vqaBundle.getTop_turker_answer(), vqaBundle.cocoQuestion.annotation);
                                                        }
//                                                CocoFormat.Annotation topAnswer = result.topUniqueAnswers.get(vqaBundle.getTop_turker_answer());
//                                                if (topAnswer == null) {
//                                                    result.topUniqueAnswers.put(vqaBundle.getTop_turker_answer(), vqaBundle.cocoQuestion.annotation);
//                                                }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }


            if (!filterParams.getAllowDuplicateAnswers()) {
                List<String> blurGameUniqueAnswers = new ArrayList<String>(result.topUniqueAnswers.keySet());
                blurGameUniqueAnswers.sort(String::compareTo);
                log.info("Finding plural forms of answers");
                String pluralList = "\n\"";


                for (CocoFormat.Annotation a : result.topUniqueAnswers.values()) {
                    if (result.topUniqueAnswers.keySet().contains(a.topAnswer + "s")) {
                        pluralList += a.topAnswer + "s\",\n\"";
                    }
                }
                log.info(pluralList);
            }

            int numCorrect = 0;
            int numWrong = 0;
            for (CocoFormat.Annotation a : result.topUniqueAnswers.values()) {
                if (a.topAnswer.equals(a.modelAnswer)) {
                    numCorrect += 1;
                } else {
                    numWrong += 1;
                }
            }
            log.info("Unique Answers Correct: " + numCorrect + " - %" + ((double) numCorrect / (numCorrect + numWrong)));
            log.info("Unique Answers Wrong: " + numWrong + " - %" + ((double) numWrong / (numCorrect + numWrong)));


//            }


//            // Optional CSV output for debugging/viewing in excel
//            try (Writer writer = new FileWriter(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/preprocessedVqa.csv"))) {
//                for (PreProcessedFaithfulExplanation.VqaBundle  vqaBundle : rejectedAlternatives.values()) {
//                    StringBuilder topAnswersString = new StringBuilder();
//                    for (AnswerScore answerScore : vqaBundle.top_n) {
//                        topAnswersString.append("," + answerScore.answer + "," + String.format( "%.4f", answerScore.score ));
//                    }
//                    writer.append(Integer.toString(vqaBundle.id))
//                        .append(',')
//                        .append(vqaBundle.getQuestion())
//                        .append(',')
//                        .append(vqaBundle.img)
//                        .append(',')
//                        .append(vqaBundle.getTop_turker_answer())
//                        .append(topAnswersString.toString())
//                        .append(',')
//                        .append(vqaBundle.explanation.replace(",", ""))
////                        .append(Integer.toString(qStat.getValue().images.size()))
//                        .append(eol);
//
//                }
//                writer.flush();
//            } catch (IOException ex) {
//                ex.printStackTrace(System.err);
//            }


//            List<PreProcessedVqa2016.VqaBundle> preprocessedVqa = Arrays.asList(mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/preprocessedVqa.json"), PreProcessedVqa2016.VqaBundle[].class));
//            mapper.writeValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/preprocessedVqa_Min.json"), preprocessedVqa);

//            List<PreProcessedVqa2016.VqaBundle> preprocessedVqa = Arrays.asList(mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/preprocessedVqa_Min.json"), PreProcessedVqa2016.VqaBundle[].class));

//            List<PreProcessedFaithfulExplanation.VqaBundle> preprocessedVqa = Arrays.asList(mapper.readValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/fe_ge.json"), PreProcessedFaithfulExplanation.VqaBundle[].class));


            result.log.startTask("Server - Collect Question/Answer Stats");
            //Mary up coco questions/annotations and model results
            for (int i = 0; i < result.cocoQuestionFile.questions.size(); i++) {
                CocoFormat.Question cocoQuestion = result.cocoQuestionFile.questions.get(i);

                if (filteredPreproccessedVqa.containsKey(cocoQuestion.question_id) == false) {
                    continue;
                }


                // Determine Turker consensus distribution
                result.statistics.putTurkerConsensus(cocoQuestion.annotation.consensus);

                // Determine if the ground truth is in the top five answers
                for (AnswerScore as : cocoQuestion.annotation.topN) {
                    if (as.answer.equals(cocoQuestion.annotation.topAnswer)) {
                        int answerIndex = ((List<AnswerScore>) cocoQuestion.annotation.topN).indexOf(as);
                        int count = result.statistics.modelAnswersCorrectByIndex.get(answerIndex);
                        count += 1;
                        result.statistics.modelAnswersCorrectByIndex.put(answerIndex, count);
                        result.statistics.putturkerConsensusInTop5(cocoQuestion.annotation.consensus);
                        break;
                    }
                }

                if (cocoQuestion.annotation.modelAnswer.equals(cocoQuestion.annotation.topAnswer)) {
                    result.statistics.modelAnswersCorrect += 1;
                    result.statistics.putturkerConsensusInTop1(cocoQuestion.annotation.consensus);
                }


//                modelResult.question = cocoQuestion;
//                if (cocoQuestion.question_id.equals(modelResult.id) == false) {
//                    int x = 1;
//                }
            }

            // Experimenting with near misses via semilar
//            try (Writer writer = new FileWriter(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/semanticDistanceInput.csv"))) {
//                for (int i = 0; i < result.cocoQuestionFile.questions.size(); i++) {
//                    writer.append(
//                        result.cocoQuestionFile.questions.get(i).getImageName())
//                        .append(',')
//                        .append(result.cocoQuestionFile.questions.get(i).getQuestion())
//                        .append(',')
//                        .append(result.cocoQuestionFile.questions.get(i).annotation.topAnswer)
//                        .append(',')
//                        .append(result.cocoQuestionFile.questions.get(i).annotation.modelAnswer)
////                        .append(',')
////                        .append(Integer.toString(qStat.getValue().images.size()))
//                        .append(eol);
//                }
//                writer.flush();
//            } catch (IOException ex) {
//                ex.printStackTrace(System.err);
//            }


            int questionTotal = 0;
            int answersTotal = 0;
            for (CocoFormat.Question cocoQuestion : result.cocoQuestionFile.questions) {
                if (filteredPreproccessedVqa.containsKey(cocoQuestion.question_id) == false) {
                    continue;
                }
                if (debugMaxQuestionsCount >= debugMaxQuestionsLimit) {
                    break;
                }
                debugMaxQuestionsCount += 1;

                String qFormat = cocoQuestion.getQuestion();

                // Add any missing images that a question references but do not exists on disk:  They will show up in the UI as a red x.
                if (!uniqueImages.containsKey(cocoQuestion.getImageName())) {
                    uniqueImages.put(cocoQuestion.getImageName(), 1);
                }

                GlobalExplanationDataset.QuestionStats qStat = result.questions.get(qFormat);
                if (qStat != null) {
                    qStat.count += 1;
                    qStat.addImage(uniqueImages.get(cocoQuestion.getImageName()));
                } else {
                    qStat = new GlobalExplanationDataset.QuestionStats(result.questions.size(), uniqueImages.get(cocoQuestion.getImageName()));
                    result.questions.put(qFormat, qStat);
                }

                questionTotal += 1;

                // Tally correct answers
                if (cocoQuestion.annotation.modelAnswer.equals(cocoQuestion.annotation.topAnswer)) {
                    qStat.correctCount += 1;
                }

//                if (cocoQuestion.annotation.modelAnswer) {
//
//                }
                //Model Answers
                LinkedHashMap<Integer, Integer> questionIndexesModel = result.modelAnswers.get(cocoQuestion.annotation.modelAnswer);
                if (questionIndexesModel == null) {
                    questionIndexesModel = new LinkedHashMap<Integer, Integer>();
                    result.modelAnswers.put(cocoQuestion.annotation.modelAnswer, questionIndexesModel);
                }

                if (!questionIndexesModel.containsKey(qStat.getIndex())) {
                    questionIndexesModel.put(qStat.getIndex(), 1);
                } else {
                    int answerFreq = questionIndexesModel.get(qStat.getIndex());
                    questionIndexesModel.put(qStat.getIndex(), answerFreq + 1);
                }
//                //Model Answer / Annotations set
                LinkedHashSet<CocoFormat.Annotation> annotationModelAnswerSet = result.annotationsByModel.get(cocoQuestion.annotation.modelAnswer);
                if (annotationModelAnswerSet == null) {
                    annotationModelAnswerSet = new LinkedHashSet<CocoFormat.Annotation>();
                    result.annotationsByModel.put(cocoQuestion.annotation.modelAnswer, annotationModelAnswerSet);
                }
                annotationModelAnswerSet.add(cocoQuestion.annotation);

                // Turker Answers: TOP answer only.  ======================================================
                answersTotal += cocoQuestion.annotation.answers.size();

                LinkedHashMap<Integer, Integer> questionIndexes = result.answers.get(cocoQuestion.annotation.topAnswer);
                if (questionIndexes == null) {
                    questionIndexes = new LinkedHashMap<Integer, Integer>();
                    result.answers.put(cocoQuestion.annotation.topAnswer, questionIndexes);
                }

                if (!questionIndexes.containsKey(qStat.getIndex())) {
                    questionIndexes.put(qStat.getIndex(), 1);
                } else {
                    int answerFreq = questionIndexes.get(qStat.getIndex());
                    questionIndexes.put(qStat.getIndex(), answerFreq + 1);
                }
                //Turker Answer / Annotations set
                LinkedHashSet<CocoFormat.Annotation> annotationAnswerSet = result.annotations.get(cocoQuestion.annotation.topAnswer);
                if (annotationAnswerSet == null) {
                    annotationAnswerSet = new LinkedHashSet<CocoFormat.Annotation>();
                    result.annotations.put(cocoQuestion.annotation.topAnswer, annotationAnswerSet);
                }
                annotationAnswerSet.add(cocoQuestion.annotation);

                // Turker Answers: ALL answers ======================================================
//                for (CocoFormat.Answer cocoAnswer : cocoQuestion.annotation.answers) {
//                    LinkedHashMap<Integer, Integer> questionIndexes = result.answers.get(cocoAnswer.getAnswer());
//                    if (questionIndexes == null) {
//                        questionIndexes = new LinkedHashMap<Integer, Integer>();
//                        result.answers.put(cocoAnswer.getAnswer(), questionIndexes);
//                    }
//
//                    if (!questionIndexes.containsKey(qStat.getIndex())) {
//                        questionIndexes.put(qStat.getIndex(), 1);
//                    } else {
//                        int answerFreq = questionIndexes.get(qStat.getIndex());
//                        questionIndexes.put(qStat.getIndex(), answerFreq + 1);
//                    }
//                    //Turker Answer / Annotations set
//                    HashSet<CocoFormat.Annotation> annotationAnswerSet = result.annotations.get(cocoAnswer.getAnswer());
//                    if (annotationAnswerSet == null) {
//                        annotationAnswerSet = new HashSet<CocoFormat.Annotation>();
//                        result.annotations.put(cocoAnswer.getAnswer(), annotationAnswerSet);
//                    }
//                    annotationAnswerSet.add(cocoQuestion.annotation);
//                }


                qStat.annotations.add(cocoQuestion.annotation);
            }

            result.log.startTask("Server - Write Question Stats CSV String");


            try (Writer writer = new StringWriter()) {
                for (Map.Entry<String, GlobalExplanationDataset.QuestionStats> qStat : result.questions.entrySet()) {
                    writer.append(qStat.getKey())
                        .append(',')
                        .append(Integer.toString(qStat.getValue().correctCount))
                        .append(',')
                        .append(Integer.toString(qStat.getValue().count))
//                        .append(Integer.toString(qStat.getValue().images.size()))
                        .append(eol);
                }
                writer.flush();
                result.questionCsv = writer.toString();
            } catch (IOException ex) {
                ex.printStackTrace(System.err);
            }
            result.statistics.questionsTotal = questionTotal;
            result.statistics.questionsUnique = result.questions.size();
            result.statistics.answersTotal = answersTotal;
            result.statistics.answersUnique = result.answers.size();
            result.statistics.modelAnswersUnique = result.modelAnswers.size();
            result.statistics.imageCount = uniqueImages.size();


            // result.log.startTask("Server - Write Question Stats CSV File (Remove for production)");
            // mapper = new ObjectMapper();
            // mapper.writeValue(new File(outputPath), result);
            result.log.endTask();


            // Experimenting with compression and smile binary format.
            // Test results
            // Json   : 34,234 KB
            // Smile  : 24,838 KB
            // Zipped :  6,278 KB
            // 7zip   :  5,517 KB
//            ObjectMapper binaryMapper = new ObjectMapper(new SmileFactory());
//            byte[] smileEncoded = binaryMapper.writeValueAsBytes(result);
//            FileOutputStream stream = new FileOutputStream(outputPath + ".binary");
//            try {
//                stream.write(smileEncoded);
//            } finally {
//                stream.close();
//            }

            this.globalExplanationDatasets.put(key, result);
            return result;
        }

//        mapper = new ObjectMapper();
//        globalExplanationDataset = mapper.readValue(new File(outputPath), GlobalExplanationDataset.class);
//        return globalExplanationDataset;
    }

    public boolean isBinary(String question) {
        if (question.contains(" or ")) {
            return true;
        }
        return false;
    }

    public boolean isOcr(String question) {
        if (question.contains(" say")) {
            return true;
        } else if (question.contains(" letter")) {
            return true;
        } else if (question.contains(" character")) {
            return true;
        } else if (question.contains(" word")) {
            return true;
        } else if (question.contains(" written")) {
            return true;
        } else if (question.contains("number")) {
            return true;
        } else if (question.contains("time")) {
            return true;
        }
        return false;
    }


    public List<Integer> getSimilarImages(String imageName) throws IOException, URISyntaxException {
//        imageName = imageName.replace("COCO_train2014_", ""); // Remove COCO name prefix
        imageName = imageName.replace(".jpg", ""); // Remove file extension
//        imageName = imageName.replaceFirst("^0+(?!$)", ""); // Remove padded zeros


        // Read directly from the zip file
        File zipFile = new File(applicationProperties.getEvaluation().getDatasetRootPath() + "/image_sorting_output.zip");
        ZipFile zip = new ZipFile(zipFile);
        InputStream inputStream = zip.getInputStream(zip.getEntry("image_sorting_output/" + imageName + ".json"));

        LinkedHashMap<String, ArrayList<Integer>> result;
        ObjectMapper mapper = new ObjectMapper();
        result = mapper.readValue(inputStream, LinkedHashMap.class);

        return result.get(imageName).subList(0, 500);
    }

    public void saveBlurGameFeedback(String blurAnswerId, String feedback, Boolean collectReward, String likertResponses) {
        try {
            Optional<BlurAnswer> blurAnswer = this.blurAnswerRepository.findById(blurAnswerId);
            if (blurAnswer != null && blurAnswer.isPresent()) {
                blurAnswer.get().setFeedback(feedback);
                blurAnswer.get().setHitReward(collectReward);
                blurAnswer.get().setLikert(likertResponses);
                this.blurAnswerRepository.save(blurAnswer.get());
            } else {
                log.error("Unable to find blurAnswer with Id: " + blurAnswerId);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

    public BlurAnswer saveBlurGameAnswer(BlurAnswer blurAnswer) {
        return this.blurAnswerRepository.save(blurAnswer);
    }

    public void importBlurGameAnswers(List<BlurAnswer> blurAnswers) {
        this.blurAnswerRepository.saveAll(blurAnswers);
    }
    public long renameModality(String currentName, String newName) {
        return this.customMongoOperations.renameModality(currentName, newName);
    }
    public void deleteBlurGameAnswersByWorkerId(String workerId) {
        this.blurAnswerRepository.deleteBlurAnswerByWorkerId(workerId);
    }
    public long deleteAllTestWorkers() {
        return this.customMongoOperations.deleteAllTestWorkers();
    }
    public long deleteAllSandboxWorkers() {
        return this.customMongoOperations.deleteAllSandboxWorkers();
    }
    public void deleteAllBlurGameAnswers(String safeWord) {
        if (safeWord.equals("Nuke It")) {
            this.blurAnswerRepository.deleteAll();
        }
    }

    public long deleteBlurGameAnswersByModality(String safeWord, String modality) {
        if (safeWord.equals("Nuke It")) {
            return this.blurAnswerRepository.deleteBlurAnswerByModality(modality);
        }
        return 0;
    }

    public List<BlurAnswer> getBlurGameAnswerResults() {
        return this.blurAnswerRepository.findAll();
    }

    public List<BlurAnswer> getBlurGameAnswerResultsByWorkerId(String workerId) {
        return this.blurAnswerRepository.findByWorkerId(workerId);
    }
    public List<BlurAnswer> getBlurGameAnswerResultsFinalAnswers() {
        return this.blurAnswerRepository.findByisFinalAnswer(true);
    }
    public List<BlurAnswer> getBlurGameAnswerResultsByModality(String modality) {
        return this.blurAnswerRepository.findBymodality(modality);
    }
    public boolean hasWorkerAlreadyParticipatedInAnotherModality(String workerId, String modality) {
        return this.customMongoOperations.hasWorkerAlreadyParticipatedInAnotherModality(workerId, modality);
    }
    public BlurQuestion getNextBlurGameQuestion(String workerId, String assignmentId, Integer forceQuestionId, String modality) throws IOException {
        StopWatch watch = new StopWatch("getNextBlurGameQuestion");
        watch.start("1) Retrieve Blur Dataset");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        HashMap<Integer, Long> completedQuestionIds = new HashMap<>();
        BlurParams blurParams = this.getBlurGameParams();
        GlobalExplanationDataset globalExplanationDataset = this.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game", blurParams.datasetFilter);

        for (Integer qId : globalExplanationDataset.annotationHashMap.keySet()) {
            if (!completedQuestionIds.containsKey(qId)) {
                completedQuestionIds.put(qId, 0L);
            }
        }

//        //Build a map of questionIs and count of how many time that question has been completed by a user
        watch.stop();
        watch.start("2) Query Mongo OPERATIONS for completed questions for ALL users");
        List<IdCount> idCounts = this.customMongoOperations.questionCountByModality(true, modality);
        watch.stop();

        watch.start("3) Build a map of questionIs and count of how many time that question has been completed by ALL users");
        for (IdCount idCount : idCounts) {
            Integer qId = Integer.parseInt(idCount.getId());
            if (completedQuestionIds.containsKey(qId)) { // Careful to add only what's found in step 1 as Blur and Mental Model dataset are different.
                completedQuestionIds.put(qId, idCount.getCount());
            }
        }

        // Remove the questions that we have excluded via the Curate UI.
        for (Integer excludedQuestionId : blurParams.excludedQuestionIds) {
            completedQuestionIds.remove(excludedQuestionId);
        }

        watch.stop();
        watch.start("4) Remove the questions for which the user making this request has already completed");
        // Remove the questions for which the user making this request has already completed.
        // Also tally up how many questions the Turker has completed total and for the assignment.
        List<BlurAnswer> questionsWorkerHasAlreadyCompleted = this.customMongoOperations.questionsWorkerHasAlreadyCompleted(workerId);
        for (BlurAnswer ba : questionsWorkerHasAlreadyCompleted) {
//            if (ba.getModality() != null && ba.getModality().isEmpty() == false) { //FIX THIS BEFORE NEXT BLUR PILOT RUN
//                if (ba.workerId.equals(workerId)) {
                    Integer qId = Integer.parseInt(ba.qId);
                    completedQuestionIds.remove(qId);

                    if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                        blurQuestion.completedTotal += 1;
                        blurQuestion.bonusPayTotal += ba.bonus;
                        if (ba.getIsCorrect()) {
                            blurQuestion.answersCorrect += 1;
                        } else {
                            blurQuestion.answersWrong += 1;
                        }

                        // Assignment Credit
                        if (ba.assignmentId.equals(assignmentId)) {
                            blurQuestion.completedInAssignment += 1;
                        }
                    }
//                }
//            }
        }
        // Assignment Credit
        // If the Turker returns a HIT or lets it expire,
        // lets give them credit for the completed questions if they accept a new HIT.
        long orphanedCompletedCount = blurQuestion.completedTotal % blurParams.questionsPerHit;
        blurQuestion.completedInAssignment  = Math.max(orphanedCompletedCount, blurQuestion.completedInAssignment);


        watch.stop();
        watch.start("5) Sort questions by least completion rate");
        // Sort questions by least completion rate
        Map<Integer, Long> questionsSortedByCompletionCount = completedQuestionIds.entrySet().stream().sorted(Map.Entry.comparingByValue()).collect(Collectors.toMap(
            Map.Entry::getKey,
            Map.Entry::getValue,
            (oldValue, newValue) -> oldValue, LinkedHashMap::new));

//        questionsSortedByCompletionCount.entrySet().stream().forEach(System.out::println);
        if (forceQuestionId != 0) {
            blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(forceQuestionId);
        } else {
            // Instead of drawing the first off the stack randomly pick one out of the top 10
            // This is to prevent multiple users from grabbing a single question, should they all do a request at the same time.
            Integer bound = Math.min(questionsSortedByCompletionCount.entrySet().size(), 10);
            Random rand = new Random();
            Integer randomIndex = rand.nextInt(bound);
//        log.info("randomIndex: " + randomIndex.toString());
            Integer keyIndex = 0;
            for (Integer key : questionsSortedByCompletionCount.keySet()) {
//            log.info(keyIndex.toString() + " - " + key);
                if (keyIndex == randomIndex) {
                    blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(key);
                    break;
                }
                keyIndex += 1;
            }
        }

        // Look up the correct blur level
        Optional<BlurLevel> blurlevel =  this.blurLevelRepository.findById(blurQuestion.annotation.question_id.toString());
        if (blurlevel.isPresent()) {
            blurQuestion.correctBlurLevel = blurlevel.get().getBlurLevel();
        }
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public BlurQuestion getNextOneShotGameQuestion(String workerId, String assignmentId, Integer forceQuestionId, String modality, String category, Integer trial) throws IOException {
        Integer maxImagesPerTrial = 6;
        StopWatch watch = new StopWatch("getNextBlurGameQuestion");
        watch.start("1) Retrieve Blur Dataset");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        HashMap<Integer, Long> completedQuestionIds = new HashMap<>();
        HashMap<Integer, Long> uniqueImages = new HashMap<>();
        BlurParams blurParams = this.getBlurGameParams();

        GlobalExplanationDataset globalExplanationDataset = this.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training,"", new GlobalExplanationFilter());
//        HashSet<CocoFormat.Annotation> annotationsForAnswer = globalExplanationDataset.annotations.get(category);
        List<CocoFormat.Annotation> annotationsForAnswer = new ArrayList<>(globalExplanationDataset.annotations.get(category));
        List<CocoFormat.Annotation> uniqueAnnotationsForAnswer = new ArrayList<>();
//        Collections.shuffle(annotationsForAnswer);

        for (CocoFormat.Annotation annotation: annotationsForAnswer) {
            if (!uniqueImages.containsKey(annotation.image_id)) {
                uniqueImages.put(annotation.image_id, 0L);
                uniqueAnnotationsForAnswer.add(annotation);
                if (!completedQuestionIds.containsKey(annotation.question_id)) {
                    completedQuestionIds.put(annotation.question_id, 0L);
                }
            }
        }

        blurQuestion.maxTrials = (long) Math.round(uniqueImages.size() / maxImagesPerTrial);

//        ObjectMapper mapper = new ObjectMapper();
//        LinkedHashMap<String, PreProcessedFaithfulExplanation.VqaBundle> preprocessedVqa = mapper.readValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/soccer.json"), new TypeReference<LinkedHashMap<String, PreProcessedFaithfulExplanation.VqaBundle>>() {});
//        for (String question_id: preprocessedVqa.keySet()) {
//            Integer qId = Integer.parseInt(question_id);
//            if (!completedQuestionIds.containsKey(qId)) {
//                completedQuestionIds.put(qId, 0L);
//            }
//        }


//        //Build a map of questionIs and count of how many time that question has been completed by a user
        watch.stop();
        watch.start("2) Query Mongo OPERATIONS for completed questions for ALL users");
        List<IdCount> idCounts = this.customMongoOperations.questionCountOneShot(true, modality);
        watch.stop();

        watch.start("3) Build a map of questionIs and count of how many time that question has been completed by ALL users");
//        for (IdCount idCount : idCounts) {
//            Integer qId = Integer.parseInt(idCount.getId());
//            if (completedQuestionIds.containsKey(qId)) { // Careful to add only what's found in step 1 as Blur and Mental Model dataset are different.
//                completedQuestionIds.put(qId, idCount.getCount());
//            }
//        }
//
//        // Remove the questions that we have excluded via the Curate UI.
//        for (Integer excludedQuestionId : blurParams.excludedQuestionIds) {
//            completedQuestionIds.remove(excludedQuestionId);
//        }

        watch.stop();
        watch.start("4) Remove the questions for which the user making this request has already completed");
        // Remove the questions for which the user making this request has already completed.
        // Also tally up how many questions the Turker has completed total and for the assignment.
        List<OneShotAnswer> questionsWorkerHasAlreadyCompleted = this.customMongoOperations.oneShotTrialsWorkerHasAlreadyCompleted(workerId);
        for (OneShotAnswer ba : questionsWorkerHasAlreadyCompleted) {
//            if (ba.getModality() != null && ba.getModality().isEmpty() == false) { //FIX THIS BEFORE NEXT BLUR PILOT RUN
//                if (ba.workerId.equals(workerId)) {
//            Integer qId = Integer.parseInt(ba.id);
//            completedQuestionIds.remove(qId);

            if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                blurQuestion.completedTotal += 1;
//                blurQuestion.bonusPayTotal += ba.bonus;
//                if (ba.getIsCorrect()) {
//                    blurQuestion.answersCorrect += 1;
//                } else {
//                    blurQuestion.answersWrong += 1;
//                }

                // Assignment Credit
                if (ba.assignmentId.equals(assignmentId)) {
                    blurQuestion.completedInAssignment += 1;
                }
            }
//                }
//            }
        }
        // Assignment Credit
        // If the Turker returns a HIT or lets it expire,
        // lets give them credit for the completed questions if they accept a new HIT.
        long orphanedCompletedCount = blurQuestion.completedTotal % blurParams.questionsPerHit;
        blurQuestion.completedInAssignment  = Math.max(orphanedCompletedCount, blurQuestion.completedInAssignment);


        watch.stop();
        watch.start("5) Sort questions by least completion rate");
        // Sort questions by least completion rate
        Map<Integer, Long> questionsSortedByCompletionCount = completedQuestionIds.entrySet().stream().sorted(Map.Entry.comparingByValue()).collect(Collectors.toMap(
            Map.Entry::getKey,
            Map.Entry::getValue,
            (oldValue, newValue) -> oldValue, LinkedHashMap::new));

//        questionsSortedByCompletionCount.entrySet().stream().forEach(System.out::println);
        if (forceQuestionId != 0) {
//            blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(forceQuestionId);
            CocoFormat.Annotation annotation = globalExplanationDataset.annotationHashMap.get(forceQuestionId);

            //Inject the componentExplanation from the whitelist subset
//            annotation.componentExplanation.clear();
//            annotation.componentExplanation.addAll(preprocessedVqa.get(annotation.question_id.toString()).componentExplanation);
            blurQuestion.annotations.add(annotation);

        } else {
            // Instead of drawing the first off the stack randomly pick one out of the top 10
            // This is to prevent multiple users from grabbing a single question, should they all do a request at the same time.
//            Integer bound = Math.min(questionsSortedByCompletionCount.entrySet().size(), 10);
//            Random rand = new Random();
//            Integer randomIndex = rand.nextInt(bound);
////        log.info("randomIndex: " + randomIndex.toString());
//            Integer keyIndex = 0;
//            for (Integer key : questionsSortedByCompletionCount.keySet()) {
////            log.info(keyIndex.toString() + " - " + key);
//                if (keyIndex == randomIndex) {
//                    blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(key);
//                    break;
//                }
//                keyIndex += 1;
//            }
        }


        Integer startIndex = trial * maxImagesPerTrial;
        for (int i = startIndex; i < startIndex + maxImagesPerTrial; i++) {
            if (i < uniqueAnnotationsForAnswer.size()) {
                CocoFormat.Annotation annotation = uniqueAnnotationsForAnswer.get(i);
                //Inject the componentExplanation from the whitelist subset
//            annotation.componentExplanation.clear();
//            annotation.componentExplanation.addAll(preprocessedVqa.get(annotation.question_id.toString()).componentExplanation);
                blurQuestion.annotations.add(annotation);
            }
        }

//        for (CocoFormat.Annotation annotation: annotationsForAnswer) {
//            if ( blurQuestion.annotations.size() >= 6) {
//                break;
//            }
//            //Inject the componentExplanation from the whitelist subset
//            annotation.componentExplanation.clear();
//            annotation.componentExplanation.addAll(preprocessedVqa.get(annotation.question_id.toString()).componentExplanation);
//            blurQuestion.annotations.add(annotation);
//        }


        blurQuestion.correctBlurLevel = 0;
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public BlurQuestion getNextOneShotGameQuestion(String workerId, String assignmentId, Integer forceQuestionId, String modality) throws IOException {
//        Integer maxImagesPerTrial = 6;
        StopWatch watch = new StopWatch("getNextBlurGameQuestion");
        watch.start("1) Retrieve One Shot Game Key");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        HashMap<Integer, Long> completedQuestionIds = new HashMap<>();
        HashMap<Integer, Long> uniqueImages = new HashMap<>();

        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        List<OneShotAnswer> gameKey = mapper.readValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/one-shot-key.json"), new TypeReference<List<OneShotAnswer>>() {});
        blurQuestion.maxTrials = gameKey.size();


//        String msgLog = "";
//        for (OneShotAnswer osa : gameKey) {
//            msgLog += osa.category + "\n";
//            for (CocoFormat.Annotation a : osa.annotations) {
//                if (osa.getSelectedQuestionId().equals(a.question_id.toString())) {
//                    msgLog += "* ";
//                }
//                msgLog += "https://www.equas.net/evaluation_dataset/v2_coco/training/images/" + a.getImageName() + "\n";
//            }
//        }
//        log.debug(msgLog);

//// Shuffle the game key
//        Collections.shuffle(gameKey, new Random());
//        mapper.writeValue(new File(applicationProperties.getEvaluation().getDatasetRootPath() + "fe_ge_results/one-shot-key_shuffled.json"), gameKey);

//        //Build a map of questionIs and count of how many time that question has been completed by a user
        watch.stop();

        watch.start("2) Count the questions for the user making this request has already completed");
        // Remove the questions for which the user making this request has already completed.
        // Also tally up how many questions the Turker has completed total and for the assignment.
        List<OneShotAnswer> questionsWorkerHasAlreadyCompleted = this.customMongoOperations.oneShotTrialsWorkerHasAlreadyCompleted(workerId);
        for (OneShotAnswer ba : questionsWorkerHasAlreadyCompleted) {

            if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                blurQuestion.completedTotal += 1;
                // Assignment Credit
//                if (ba.assignmentId.equals(assignmentId)) {
                    blurQuestion.completedInAssignment += 1;
                    blurQuestion.score += this.normalize(ba.kendallsTau, -1, 1, 0, 100);
//                }
            }
        }
        if (blurQuestion.completedInAssignment < gameKey.size()) {
            blurQuestion.correctQuestionId = gameKey.get((int)blurQuestion.completedInAssignment).selectedQuestionId;
            blurQuestion.annotations.addAll(gameKey.get((int)blurQuestion.completedInAssignment).annotations);
        }

        blurQuestion.correctBlurLevel = 0;
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public BlurQuestion getNextOneShotV2GameQuestion(String workerId, String assignmentId, Integer forceQuestionId, String modality) throws IOException {
//        Integer maxImagesPerTrial = 6;
        StopWatch watch = new StopWatch("getNextOneShotV2GameQuestion");
        watch.start("1) Retrieve One Shot Game Key");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        blurQuestion.maxTrials = 17;
        watch.stop();

        watch.start("2) Count the questions for the user making this request has already completed");
        // Tally up how many questions the Turker has completed total and for the assignment.
        List<OneShotAnswerV2> questionsWorkerHasAlreadyCompleted = this.customMongoOperations.oneShotV2TrialsWorkerHasAlreadyCompleted(workerId);
        for (OneShotAnswerV2 ba : questionsWorkerHasAlreadyCompleted) {

            if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                blurQuestion.completedTotal += 1;
                // Assignment Credit
//                if (ba.assignmentId.equals(assignmentId)) {
                blurQuestion.completedInAssignment += 1;
//                blurQuestion.score += this.normalize(ba.kendallsTau, -1, 1, 0, 100);
//                }
            }
        }
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public BlurQuestion getNextOneShotV3GameQuestion(String workerId, String assignmentId, Integer forceQuestionId, String modality) throws IOException {
//        Integer maxImagesPerTrial = 6;
        StopWatch watch = new StopWatch("getNextOneShotV3GameQuestion");
        watch.start("1) Retrieve One Shot Game Key");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        blurQuestion.maxTrials = 17;
        watch.stop();

        watch.start("2) Count the questions for the user making this request has already completed");
        // Tally up how many questions the Turker has completed total and for the assignment.
        List<OneShotAnswerV3> questionsWorkerHasAlreadyCompleted = this.customMongoOperations.oneShotV3TrialsWorkerHasAlreadyCompleted(workerId);
        for (OneShotAnswerV3 ba : questionsWorkerHasAlreadyCompleted) {

            if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                blurQuestion.completedTotal += 1;
                // Assignment Credit
//                if (ba.assignmentId.equals(assignmentId)) {
                blurQuestion.completedInAssignment += 1;
//                blurQuestion.score += this.normalize(ba.kendallsTau, -1, 1, 0, 100);
//                }
            }
        }
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public double normalize(double val, double valmin, double valmax, double min, double max)
    {
        return (((val - valmin) / (valmax - valmin)) * (max - min)) + min;
    }

    public BlurQuestion getNextBlurGameQuestion_OLD(String workerId, String assignmentId, Integer forceQuestionId, String modality) throws IOException {
        StopWatch watch = new StopWatch("getNextBlurGameQuestion");
        watch.start("Retrieve Blur Dataset");
        //Add all question options
        BlurQuestion blurQuestion = new BlurQuestion();
        HashMap<Integer, Integer> completedQuestionIds = new HashMap<>();
        BlurParams blurParams = this.getBlurGameParams();
        GlobalExplanationDataset globalExplanationDataset = this.getGlobalExplanationDataset("v2_coco", EvaluationPhase.training, "blur-game", blurParams.datasetFilter);

        for (Integer qId : globalExplanationDataset.annotationHashMap.keySet()) {
            if (!completedQuestionIds.containsKey(qId)) {
                completedQuestionIds.put(qId, 0);
            }
        }

        watch.stop();
        watch.start("Query Mongo for completed questions for ALL users");
//        List<BlurAnswerSummary> completedQuestions = this.blurAnswerRepository.findAllSummarizedByisFinalAnswer(true);
        List<BlurAnswer> completedQuestions = this.blurAnswerRepository.customQueryFindByisFinalAnswer();
        //Build a map of questionIs and count of how many time that question has been completed by a user
        watch.stop();
        watch.start("Build a map of questionIs and count of how many time that question has been completed by ALL users");
        for (BlurAnswer ba : completedQuestions) {
            if (modality.equals(ba.getModality())) {  // Count modalities separately
                Integer qId = Integer.parseInt(ba.qId);
                if (completedQuestionIds.containsKey(qId)) {
                    int count = completedQuestionIds.get(qId);
                    completedQuestionIds.put(qId, count + 1);
                }
            }
//            if (!completedQuestionIds.containsKey(qId)) {
//                completedQuestionIds.put(qId, 1);
//            } else {
//                int count = completedQuestionIds.get(qId);
//                completedQuestionIds.put(qId, count + 1);
//            }
        }

        // Remove the questions that we have excluded via the Curate UI.
//        for (Integer excludedQuestionId : blurParams.excludedQuestionIds) {
//            completedQuestionIds.remove(excludedQuestionId);
//        }


        watch.stop();
        watch.start("Remove the questions for which the user making this request has already completed");
        // Remove the questions for which the user making this request has already completed.
        // Also tally up how many questions the Turker has completed total and for the assignment.
        for (BlurAnswer ba : completedQuestions) {
//            if (ba.getModality() != null && ba.getModality().isEmpty() == false) { //FIX THIS BEFORE NEXT BLUR PILOT RUN
            if (ba.workerId.equals(workerId)) {
                Integer qId = Integer.parseInt(ba.qId);
                completedQuestionIds.remove(qId);

                if (modality.equals(ba.getModality())) {  // This allows Turkers to participate in more than one modality
                    blurQuestion.completedTotal += 1;
                    if (ba.getIsCorrect()) {
                        blurQuestion.answersCorrect += 1;
                    } else {
                        blurQuestion.answersWrong += 1;
                    }

                    // Assignment Credit
                    if (ba.assignmentId.equals(assignmentId)) {
                        blurQuestion.completedInAssignment += 1;
                    }
                }
            }
//            }
        }
        // Assignment Credit
        // If the Turker returns a HIT or lets it expire,
        // lets give them credit for the completed questions if they accept a new HIT.
//        long orphanedCompletedCount = blurQuestion.completedTotal % blurParams.questionsPerHit;
//        blurQuestion.completedInAssignment  = Math.max(orphanedCompletedCount, blurQuestion.completedInAssignment);


        watch.stop();
        watch.start("Sort questions by least completion rate");
        // Sort questions by least completion rate
//        Map<Integer, Integer> questionsSortedByCompletionCount = completedQuestionIds.entrySet().stream().sorted(Map.Entry.comparingByValue()).collect(Collectors.toMap(
//            Map.Entry::getKey,
//            Map.Entry::getValue,
//            (oldValue, newValue) -> oldValue, LinkedHashMap::new));

//        questionsSortedByCompletionCount.entrySet().stream().forEach(System.out::println);
//        if (forceQuestionId != 0) {
//            blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(forceQuestionId);
//        } else {
//            // Instead of drawing the first off the stack randomly pick one out of the top 10
//            // This is to prevent multiple users from grabbing a single question, should they all do a request at the same time.
//            Integer bound = Math.min(questionsSortedByCompletionCount.entrySet().size(), 10);
//            Random rand = new Random();
//            Integer randomIndex = rand.nextInt(bound);
////        log.info("randomIndex: " + randomIndex.toString());
//            Integer keyIndex = 0;
//            for (Integer key : questionsSortedByCompletionCount.keySet()) {
////            log.info(keyIndex.toString() + " - " + key);
//                if (keyIndex == randomIndex) {
//                    blurQuestion.annotation = globalExplanationDataset.annotationHashMap.get(key);
//                    break;
//                }
//                keyIndex += 1;
//            }
//        }
//
//        // Look up the correct blur level
//        Optional<BlurLevel> blurlevel =  this.blurLevelRepository.findById(blurQuestion.annotation.question_id.toString());
//        if (blurlevel.isPresent()) {
//            blurQuestion.correctBlurLevel = blurlevel.get().getBlurLevel();
//        }
        watch.stop();
        log.info("\n" + watch.prettyPrint());

        return blurQuestion;
    }

    public void saveBlurGameParams(BlurParams blurParams) {
        this.blurParamsRepository.save(blurParams);
    }

    public BlurParams getBlurGameParams() {
        List<BlurParams> blurParams = this.blurParamsRepository.findAll();
        if (blurParams.size() > 0) {
            return blurParams.get(0);
        } else {
            return new BlurParams();
        }
    }

    public void saveBlurLevels(List<BlurLevel> blurLevels) {
        this.blurLevelRepository.deleteAll();
        this.blurLevelRepository.saveAll(blurLevels);
    }

    public List<BlurLevel> getBlurLevels() {
        return this.blurLevelRepository.findAll();
    }

    public List<String> pluralForms = Arrays.asList(
        "newspapers",
        "rolls",
        "hands",
        "cs",
        "ds",
        "gs",
        "ns",
        "rs",
        "us",
        "vs",
        "ties",
        "walkers",
        "tusks",
        "harts",
        "umbrellas",
        "toys",
        "pictures",
        "roses",
        "tim hortons",
        "cows",
        "pipes",
        "pigeons",
        "sippy cups",
        "wine bottles",
        "life vests",
        "chickens",
        "cubs",
        "cups",
        "cowboy hats",
        "cabinets",
        "reflections",
        "bunk beds",
        "jackets",
        "houses",
        "shorts",
        "party hats",
        "lifeguards",
        "dominos",
        "chocolate chips",
        "tents",
        "diamonds",
        "pancakes",
        "christmas trees",
        "penguins",
        "grapes",
        "statues",
        "dogs",
        "stands",
        "cigarettes",
        "forwards",
        "balls",
        "napkins",
        "outdoors",
        "pumpkins",
        "banks",
        "males",
        "fire trucks",
        "stars",
        "stickers",
        "woods",
        "apples",
        "twins",
        "masks",
        "steps",
        "vans",
        "works",
        "tattoos",
        "tennis balls",
        "ears",
        "indians",
        "eggs",
        "laptops",
        "necks",
        "lizards",
        "airplanes",
        "jalapenos",
        "giraffes",
        "sharks",
        "snowflakes",
        "skateboards",
        "drawers",
        "pencils",
        "eyes",
        "donuts",
        "rolling stones",
        "snowboards",
        "buttons",
        "windows",
        "fans",
        "doubles",
        "suits",
        "monkeys",
        "tortillas",
        "peanuts",
        "fins",
        "ramps",
        "pickles",
        "bus",
        "cds",
        "sunflowers",
        "elephants",
        "forks",
        "feathers",
        "boy scouts",
        "knees",
        "furs",
        "plums",
        "students",
        "heads",
        "walnuts",
        "skyscrapers",
        "seats",
        "veggies",
        "bridges",
        "flowers",
        "monsters",
        "singles",
        "rulers",
        "ups",
        "bus drivers",
        "food trucks",
        "aprons",
        "onions",
        "hangers",
        "braces",
        "wii controllers",
        "snakes",
        "skiers",
        "brownies",
        "magazines",
        "t-shirts",
        "pockets",
        "bow ties",
        "camels",
        "bulls",
        "cell phones",
        "buoys",
        "swans",
        "lamps",
        "walls",
        "urinals",
        "circles",
        "butts",
        "hats",
        "hays",
        "waves",
        "rileys",
        "passengers",
        "triangles",
        "tourists",
        "tires",
        "chains",
        "chairs",
        "bears",
        "squares",
        "toothpicks",
        "chefs",
        "pedestrians",
        "fire hydrants",
        "beets",
        "mirrors",
        "dandelions",
        "waffles",
        "dolphins",
        "lanyards",
        "presidents",
        "baskets",
        "uplands",
        "bells",
        "curtains",
        "suburbs",
        "surfboards",
        "propellers",
        "faces",
        "top hats",
        "guitars",
        "poles",
        "frogs",
        "speakers",
        "no dogs",
        "papers",
        "carrots",
        "bicycles",
        "posts",
        "shells",
        "sheds",
        "clocks",
        "water skis",
        "skateboarders",
        "traffic lights",
        "jars",
        "jets",
        "hornets",
        "streets",
        "shoes",
        "crackers",
        "tissues",
        "clouds",
        "long necks",
        "rubber bands",
        "clowns",
        "sheets",
        "customers",
        "planes",
        "canoes",
        "plants",
        "earrings",
        "nationals",
        "wreaths",
        "farmers",
        "bikers",
        "tiaras",
        "drinks",
        "plates",
        "candles",
        "signs",
        "oven mitts",
        "zebras",
        "tennis rackets",
        "vases",
        "keys",
        "silos",
        "hills",
        "teddy bears",
        "sinks",
        "carpets",
        "wheelchairs",
        "kids",
        "collars",
        "pelicans",
        "sausages",
        "burritos",
        "weeds",
        "balloons",
        "legos",
        "rabbits",
        "flintstones",
        "pilots",
        "tickets",
        "magnets",
        "footprints",
        "tangerines",
        "bikinis",
        "towels",
        "spoons",
        "towers",
        "surfers",
        "necklaces",
        "pillows",
        "legs",
        "leis",
        "mountains",
        "2 hours",
        "soccer players",
        "peppers",
        "coolers",
        "swimsuits",
        "cowboys",
        "muffins",
        "bagels",
        "logs",
        "computers",
        "doors",
        "cutting boards",
        "bananas",
        "bikes",
        "tank tops",
        "apartments",
        "mills",
        "buckets",
        "adults",
        "birds",
        "humans",
        "blankets",
        "name tags",
        "cookies",
        "flying kites",
        "fields",
        "mittens",
        "frisbees",
        "firefighters",
        "residences",
        "oranges",
        "backpacks",
        "booths",
        "animals",
        "suitcases",
        "vegetables",
        "seagulls",
        "ferns",
        "towards",
        "tennis players",
        "sleeves",
        "crafts",
        "olives",
        "desserts",
        "knee pads",
        "palm trees",
        "females",
        "cardinals",
        "chimneys",
        "shingles",
        "news",
        "feeding cows",
        "rings",
        "paper towels",
        "professionals",
        "pearls",
        "stripes",
        "girls",
        "perfumes",
        "mustangs",
        "shirts",
        "whales",
        "eagles",
        "skates",
        "harleys",
        "giants",
        "brothers",
        "zippers",
        "refrigerators",
        "oars",
        "verts",
        "parking meters",
        "cameras",
        "vests",
        "feeding elephants",
        "antiques",
        "coats",
        "bricks",
        "paintings",
        "peacocks",
        "cupcakes",
        "nelsons",
        "coins",
        "cones",
        "indoors",
        "cooks",
        "owls",
        "drums",
        "lines",
        "remotes",
        "lions",
        "wings",
        "blues",
        "pans",
        "paws",
        "wires",
        "pears",
        "pens",
        "pets",
        "doughnuts",
        "pies",
        "fruits",
        "skulls",
        "daffodils",
        "pots",
        "trays",
        "pugs",
        "shadows",
        "lights",
        "pirates",
        "ornaments",
        "helmets",
        "cucumbers",
        "trees",
        "socks",
        "bottles",
        "tails",
        "purses",
        "trains",
        "flip flops",
        "brunettes",
        "smiles",
        "backwards",
        "hearts",
        "horns",
        "astros",
        "rackets",
        "wristbands",
        "microwaves",
        "sailboats",
        "fires",
        "taxis",
        "haircuts",
        "tigers",
        "baseball players",
        "motorcycles",
        "jeans",
        "tuxedos",
        "ski poles",
        "hard hats",
        "uniforms",
        "fingers",
        "hot dogs",
        "bottoms",
        "polar bears",
        "comics",
        "kangaroos",
        "buildings",
        "rams",
        "riding horses",
        "posters",
        "swings",
        "saddles",
        "reds",
        "ducks",
        "on tables",
        "movies",
        "boats",
        "royals",
        "meatballs",
        "gloves",
        "cages",
        "taking pictures",
        "gazebos",
        "cribs",
        "ants",
        "ladders",
        "wii remotes",
        "cakes",
        "toilets",
        "tractors",
        "arms",
        "arts",
        "wetsuits",
        "rugs",
        "crows",
        "canes",
        "books",
        "trucks",
        "jockeys",
        "boots",
        "bracelets",
        "yards",
        "carts",
        "trunks",
        "phones",
        "cards",
        "kilts",
        "kayaks",
        "scooters",
        "diapers",
        "blue jays",
        "bowls",
        "bags",
        "bars",
        "bats",
        "kites",
        "beds",
        "bees",
        "feeding giraffes",
        "lemons",
        "skis",
        "reflectors",
        "angels",
        "polka dots",
        "bows",
        "boys",
        "wheels",
        "stools",
        "friends",
        "mushrooms",
        "yankees",
        "horses",
        "plungers",
        "subs",
        "buns",
        "desks",
        "tulips",
        "goats",
        "stuffed animals",
        "flags",
        "rocks",
        "flats",
        "tags",
        "taos",
        "cabs",
        "cans",
        "cars",
        "cats",
        "stoves",
        "laptops",
        "eggs",
        "straps",
        "flowers",
        "clocks",
        "floats",
        "passengers",
        "us",
        "bagels",
        "giraffes",
        "spoons",
        "blues",
        "on beds",
        "humans",
        "mans",
        "no ones",
        "trains",
        "airplanes",
        "reds",
        "pans",
        "helmets",
        "curtains",
        "cows",
        "heads",
        "bedrooms",
        "plastic bags",
        "papers",
        "jars",
        "mirrors",
        "stencils",
        "kitchens",
        "tractors",
        "20s",
        "skateboards",
        "backpacks",
        "trays",
        "tiles",
        "forks",
        "greens",
        "bowls",
        "homes",
        "beds",
        "tags",
        "childs",
        "springs",
        "signs",
        "windows",
        "apples",
        "parks",
        "balls",
        "aprons",
        "females",
        "gloves",
        "bags",
        "dogs",
        "wii controllers",
        "microwaves",
        "cuts",
        "lots",
        "cars",
        "bricks",
        "tables",
        "cats",
        "buttons",
        "males",
        "frisbees",
        "paws",
        "oranges",
        "flying kites",
        "kites",
        "bikes",
        "stones",
        "razors",
        "rectangles",
        "bats",
        "living rooms",
        "hit balls",
        "shorts",
        "towers",
        "purses",
        "40s",
        "bus drivers",
        "towels",
        "sinks",
        "vans",
        "turkeys",
        "woods",
        "cameras",
        "hands",
        "coasters",
        "chairs",
        "books",
        "vases",
        "hats",
        "stands",
        "walls",
        "ups",
        "booths",
        "chocolates",
        "plains",
        "refrigerators",
        "lights",
        "2010s",
        "bathrooms",
        "plants",
        "rugs",
        "downs",
        "palm trees",
        "restaurants",
        "tennis rackets",
        "beanies",
        "biscuits",
        "phones",
        "wetsuits",
        "50s",
        "elephants",
        "donuts",
        "crosswalks",
        "trees",
        "peppers",
        "carrots",
        "1920s",
        "polar bears",
        "wires",
        "horses",
        "squares",
        "no jackets",
        "lamps",
        "tickets",
        "bears",
        "sunflowers",
        "cabs",
        "bananas",
        "lemons",
        "falls",
        "shadows",
        "girls",
        "hot dogs",
        "khakis",
        "plates",
        "pets",
        "parrots",
        "motorcycles",
        "all stars",
        "30s",
        "boats",
        "power lines",
        "tricks",
        "games",
        "his arms",
        "cranes",
        "rolls",
        "computers",
        "strings",
        "buildings",
        "roses",
        "no letters",
        "circles",
        "pictures",
        "surfboards",
        "desks",
        "masks",
        "birds",
        "apartments",
        "hays",
        "fire hydrants",
        "roads",
        "gs",
        "rams",
        "cupcakes",
        "flags",
        "colors",
        "snowboards",
        "skateboarders",
        "ropes",
        "umbrellas",
        "fruits",
        "fields",
        "on elephants",
        "catch balls",
        "days",
        "cakes",
        "zebras",
        "pots",
        "carpets",
        "fighters",
        "cell phones",
        "cigarettes",
        "saddles",
        "toilets",
        "playing games",
        "tattoos",
        "swords",
        "smartphones",
        "fire trucks",
        "hamburgers",
        "water skis",
        "stop signs",
        "barriers",
        "mountains",
        "news",
        "bridges",
        "handles",
        "kickstands",
        "cans",
        "streets",
        "fans",
        "chimneys",
        "propellers",
        "planes",
        "soccer players",
        "napkins",
        "bottles",
        "trucks",
        "drums",
        "fires",
        "buns",
        "taking pictures",
        "on tables",
        "mangos",
        "crowds",
        "faces",
        "teddy bears",
        "ts",
        "chefs",
        "legs",
        "boys",
        "straws",
        "chickens",
        "twins",
        "cooks",
        "stores",
        "shades",
        "remotes",
        "sweats",
        "works",
        "pockets",
        "pigeons",
        "riders",
        "pickles",
        "pumpkins",
        "triangles",
        "tires",
        "toys",
        "ponytails",
        "seagulls",
        "on poles",
        "jackets",
        "indians",
        "shirts",
        "towards",
        "eagles",
        "televisions",
        "ball boys",
        "drinks",
        "collars",
        "corners",
        "handlebars",
        "dragons",
        "forwards",
        "knees",
        "bottoms",
        "bracelets",
        "suitcases",
        "tennis players",
        "doughnuts",
        "butts",
        "1990s",
        "flamingos",
        "no cars",
        "adults",
        "stuffed animals",
        "bicycles",
        "cs",
        "parking meters",
        "pineapples",
        "baselines",
        "on plates",
        "in hands",
        "ramps",
        "houses",
        "sides",
        "buckets",
        "ferns",
        "carnations",
        "statues",
        "feathers",
        "arts",
        "smiles",
        "bikinis",
        "ankles",
        "cups",
        "cabinets",
        "party hats",
        "rocks",
        "monkeys",
        "cyclists",
        "pillows",
        "boots",
        "guys",
        "skirts",
        "offices",
        "cutting boards",
        "cedars",
        "60s",
        "shingles",
        "laps",
        "scooters",
        "bikers",
        "sculptures",
        "newspapers",
        "in his hands",
        "wrist guards",
        "boogie boards",
        "computer games",
        "logs",
        "rackets",
        "wii remotes",
        "doors",
        "suns",
        "tops",
        "baseball bats",
        "ski suits",
        "mutts",
        "wiimotes",
        "tennis courts",
        "briefcases",
        "players",
        "guitars",
        "ducks",
        "wings",
        "rubber bands",
        "skis",
        "sticks",
        "logos",
        "kettles",
        "wreaths",
        "skates",
        "1980s",
        "bars",
        "balloons",
        "posts",
        "veggies",
        "tails",
        "dolls",
        "patterns",
        "designs",
        "dirt bikes",
        "salads",
        "bells",
        "on chairs",
        "tennis balls",
        "poles",
        "monitors",
        "stripes",
        "hotels",
        "speakers",
        "baskets",
        "marbles",
        "blankets",
        "braids",
        "jets",
        "rafts",
        "shoulders",
        "pretzels",
        "hills",
        "commuters",
        "meters",
        "presents",
        "sails",
        "mints",
        "sailboats",
        "pens",
        "screws",
        "bolts",
        "sits",
        "tow trucks",
        "neckties",
        "tennis racquets",
        "tourists",
        "diamonds",
        "markers",
        "sharks",
        "carts",
        "lizards",
        "terriers",
        "office chairs",
        "ski poles",
        "baseball gloves",
        "cherry blossoms",
        "paintings",
        "cowboys",
        "singles",
        "referees",
        "in man's hands",
        "necklaces",
        "cribs",
        "tarps",
        "wagons",
        "ds",
        "pearls",
        "christmas trees",
        "canes",
        "suits",
        "mugs",
        "bows",
        "stars",
        "pigs",
        "ms",
        "controllers",
        "ladders",
        "burritos",
        "hearts",
        "nets",
        "air conditioners",
        "light bulbs",
        "traffic lights",
        "black ones",
        "ties",
        "food trucks",
        "crumbs",
        "baseball caps",
        "pandas",
        "hawks",
        "urinals",
        "outdoors",
        "pilots",
        "on sides",
        "earrings",
        "arrows",
        "behind trees",
        "sisters",
        "skiers",
        "bandanas",
        "yachts",
        "cds",
        "paper towels",
        "swans",
        "smoothies",
        "lines",
        "bridles",
        "headbands",
        "ss",
        "highways",
        "tents",
        "candles",
        "cages",
        "no birds",
        "stables",
        "beginners",
        "dachshunds",
        "yards",
        "costumes",
        "by windows",
        "tea cups",
        "uss",
        "wheelchairs",
        "stoves",
        "coolers",
        "friends",
        "mushrooms",
        "motorbikes",
        "in bowls",
        "sneakers",
        "crates",
        "pies",
        "websites",
        "water bottles",
        "pears",
        "riding horses",
        "on rocks",
        "no cows",
        "teachers",
        "dandelions",
        "sweaters",
        "shells",
        "mopeds",
        "harleys",
        "wristbands",
        "behind giraffes",
        "no turns",
        "photographs",
        "cleaners",
        "waves",
        "street lights",
        "advertisements",
        "lambs",
        "knobs",
        "on trays",
        "animals",
        "tissues",
        "shapes",
        "desserts",
        "melons",
        "trolleys",
        "wigs",
        "no hats",
        "burgers",
        "pepperoni and olives",
        "no vases",
        "roosters",
        "snowsuits",
        "80s",
        "whales",
        "chocolate chips",
        "furs",
        "spirals",
        "on tracks",
        "pelicans",
        "rs",
        "ipods",
        "reflections",
        "no shoes",
        "dinosaurs",
        "arms",
        "fire extinguishers",
        "horns",
        "pine nuts",
        "in baskets",
        "tim hortons",
        "bulls",
        "crows",
        "orchids",
        "lanyards",
        "words",
        "helicopters",
        "parasails",
        "raincoats",
        "soldiers",
        "stop lights",
        "rails",
        "pancakes",
        "coats",
        "customs",
        "hot plates",
        "movies",
        "polka dots",
        "rings",
        "bras",
        "crackers",
        "stickers",
        "vests",
        "rulers",
        "goats",
        "mats",
        "buoys",
        "bunk beds",
        "ski lifts",
        "pugs",
        "ski outfits",
        "wildebeests",
        "knee pads",
        "eyes",
        "sparrows",
        "spots",
        "barclays",
        "mannequins",
        "saucers",
        "notes",
        "cards",
        "suvs",
        "weeks",
        "tights",
        "game controllers",
        "paddles",
        "penguins",
        "jalapenos",
        "cardinals",
        "residences",
        "uniforms",
        "necks",
        "with your hands",
        "throw frisbees",
        "gnomes",
        "egg rolls",
        "magnets",
        "picnics",
        "owners",
        "splits",
        "owls",
        "tracks",
        "blue jays",
        "decorations",
        "surfers",
        "fins",
        "firefighters",
        "maps",
        "limes",
        "jockeys",
        "90s",
        "cucumbers",
        "cartoons",
        "tortillas",
        "taxis",
        "rides",
        "snowboarders",
        "chains",
        "giraffe and zebras",
        "seats",
        "peacocks",
        "no cats",
        "fingers",
        "recipes",
        "trailers",
        "no books",
        "storefronts",
        "tins",
        "t shirts",
        "toothpicks",
        "wheels",
        "no dogs",
        "onions",
        "indoors",
        "on stools",
        "zs",
        "baseball players",
        "meatballs",
        "cones",
        "nests",
        "tank tops",
        "udders",
        "multi colors",
        "70s",
        "monsters",
        "sausages",
        "tulips",
        "life jackets",
        "highlighters",
        "sippy cups",
        "riding bikes",
        "stools",
        "raisins",
        "gears",
        "clouds",
        "gates",
        "lilacs",
        "professionals",
        "legos",
        "doubles",
        "tours",
        "hexagons",
        "hazmat suits",
        "subs",
        "tail lights",
        "no numbers",
        "apple and bananas",
        "diapers",
        "blouses",
        "lifeguards",
        "playing video games",
        "skulls",
        "lions",
        "sleds",
        "hangers",
        "antennas",
        "fs",
        "holes",
        "extras",
        "bow ties",
        "tablecloths",
        "sheep and dogs",
        "hoodies",
        "rabbits",
        "racks",
        "bees",
        "shoes",
        "antiques",
        "life vests",
        "bombs",
        "comics",
        "ns",
        "kayaks",
        "flintstones",
        "on laptops",
        "cords",
        "pipes",
        "evergreens",
        "shops",
        "street signs",
        "gifts",
        "tiaras",
        "1950s",
        "barges",
        "mothers",
        "bean sprouts",
        "leis",
        "fishing boats",
        "walkers",
        "above sinks",
        "frogs",
        "planters",
        "parachutes",
        "flats",
        "yankees",
        "taking photos",
        "bombers",
        "oven mitts",
        "no horses",
        "no bananas",
        "behind apples",
        "dvds",
        "containers",
        "store names",
        "clovers",
        "on books",
        "catholics",
        "table legs",
        "kings",
        "farmers",
        "gazebos",
        "lightning bolts",
        "camels",
        "name tags",
        "spectators",
        "girls hands",
        "white ones",
        "serving spoons",
        "backwards",
        "daffodils",
        "drawings",
        "skeletons",
        "on racks",
        "lids",
        "zombies",
        "awnings",
        "directions",
        "no windows",
        "months",
        "shopping carts",
        "canoes",
        "moves",
        "microphones",
        "ears",
        "clowns",
        "colonials",
        "drawers",
        "sweatbands",
        "sheets",
        "life preservers",
        "drivers",
        "no rugs",
        "vs",
        "top hats",
        "feeders",
        "tigers",
        "vegetables",
        "rats",
        "pedestrians",
        "storks",
        "tools",
        "native americans",
        "faucets",
        "cookies",
        "no wheels",
        "pirates",
        "barrettes",
        "wine bottles",
        "toes",
        "sheds",
        "croissants",
        "peanuts",
        "covers",
        "race cars",
        "riding motorcycles",
        "hair nets",
        "ladles",
        "crafts",
        "uplands",
        "frames",
        "eggplants",
        "man's hands",
        "snakes",
        "anchors",
        "braces",
        "trunks",
        "dumpsters",
        "biplanes",
        "pads",
        "plungers",
        "explorers",
        "long sleeves",
        "no cakes",
        "doing tricks",
        "posters",
        "harts",
        "waffles",
        "bike tricks",
        "police horses",
        "movers",
        "nationals",
        "wearing numbers",
        "under trees",
        "engines",
        "barrels",
        "angels",
        "figurines",
        "haircuts",
        "workers",
        "certificates",
        "students",
        "no trucks",
        "gazelles",
        "petting animals",
        "siblings",
        "ramekins",
        "photos",
        "prices",
        "no paintings",
        "warnings",
        "no doors",
        "olives",
        "t-shirts",
        "holding rackets",
        "nachos",
        "1930s",
        "hooks",
        "swimsuits",
        "kilts",
        "giants",
        "oars",
        "to take pictures",
        "monster trucks",
        "entrances",
        "pomegranates",
        "on skateboards",
        "1900s",
        "sports",
        "dots",
        "on pans",
        "magazines",
        "zebras and giraffes",
        "sleeves",
        "appetizers",
        "llamas",
        "vehicles",
        "red ones",
        "shoppers",
        "brunettes",
        "racquets",
        "laundry baskets",
        "atvs",
        "presidents",
        "muffins",
        "triples",
        "robins",
        "silos",
        "plugs",
        "rhinos",
        "in corners",
        "no horns",
        "coins",
        "overhead lights",
        "no bears",
        "ceiling lights",
        "orioles",
        "spartans",
        "above tables",
        "behind horses",
        "zippers",
        "feeding giraffes",
        "in his pockets",
        "sleepys",
        "bills",
        "planets",
        "controls",
        "crts",
        "2000s",
        "clydesdales",
        "lanterns",
        "cowboy hats",
        "little girls",
        "clogs",
        "no tables",
        "kids",
        "mustangs",
        "downwards",
        "behind curtains",
        "locomotives",
        "records",
        "angry birds",
        "using computers",
        "vultures",
        "dates",
        "bleachers",
        "equestrians",
        "utensils",
        "street names",
        "cliffs",
        "segways",
        "1940s",
        "crystals",
        "euros",
        "feeding elephants",
        "s",
        "doves",
        "cops",
        "titans",
        "spreadsheets",
        "ants",
        "team colors",
        "fuel tanks",
        "engineers",
        "clothespins",
        "cupboards",
        "coke bottles",
        "swings",
        "slices",
        "paths",
        "no lights",
        "over tables",
        "lives",
        "scales",
        "dollars",
        "numbers",
        "donkeys",
        "hours",
        "walnuts",
        "earbuds",
        "tea lights",
        "banks",
        "crayons",
        "crab cakes",
        "perfumes",
        "files",
        "shoelaces",
        "socks",
        "cigars",
        "customers",
        "mittens",
        "twigs",
        "coffee cups",
        "tuxedos",
        "ponchos",
        "special events",
        "chef hats",
        "tees",
        "grapes",
        "bins",
        "locks",
        "play games",
        "fleas",
        "long necks",
        "cables",
        "little leagues",
        "light fixtures",
        "hard hats",
        "rubber ducks",
        "sandbags",
        "tacos",
        "oreos",
        "teenagers",
        "pencils",
        "names",
        "rolling stones",
        "footprints",
        "almonds",
        "shin guards",
        "croutons",
        "reflectors",
        "no right turns",
        "athletics",
        "brownies",
        "china cabinets",
        "under donuts",
        "slopes",
        "markings",
        "jeans",
        "no tags",
        "beets",
        "taos",
        "behind bikes",
        "yaks",
        "2 hours",
        "plums",
        "mountain bikes",
        "no logos",
        "street lamps",
        "swirls",
        "spikes",
        "verts",
        "coconuts",
        "awards",
        "baseball uniforms",
        "pecans",
        "corks",
        "behind players",
        "vines",
        "packages",
        "tennis outfits",
        "skyscrapers",
        "sales",
        "motorcyclists",
        "no plates",
        "no motorcycles",
        "tusks",
        "repairs",
        "cement blocks",
        "daybeds",
        "on napkins",
        "ornaments",
        "no barrels",
        "stems",
        "home runs",
        "banners",
        "cutting apples",
        "45 degrees",
        "under chairs",
        "row boats",
        "fertilizers",
        "bike handles",
        "bubbles",
        "bandages",
        "seeds",
        "guests",
        "behind trains",
        "stuffed bears",
        "drowns",
        "beans",
        "brothers",
        "jet skis",
        "figs",
        "foul lines",
        "portraits",
        "4 wheelers",
        "platters",
        "scallops",
        "measuring cups",
        "temperature controls",
        "apples and oranges",
        "singers",
        "crocs",
        "brakes",
        "rangers",
        "obstacles",
        "cracks",
        "bell peppers",
        "mammals",
        "food and drinks",
        "walking horses",
        "medals",
        "outwards",
        "streamers",
        "feeding cows",
        "blocks",
        "to stop balls",
        "snowflakes",
        "on boats",
        "under cabinets",
        "bicyclists",
        "eating donuts",
        "peppers onions",
        "sliders",
        "kangaroos",
        "pyramids",
        "beignets",
        "robots",
        "roots",
        "no towels",
        "post its",
        "checkpoints",
        "nelsons",
        "phone calls",
        "earphones",
        "royals",
        "mills",
        "by trees",
        "parakeets",
        "1800s",
        "dominos",
        "paper clips",
        "hot dog buns",
        "choppers",
        "lawyers",
        "tangerines",
        "no boots",
        "battleships",
        "teens",
        "under cats",
        "no bikes",
        "holding kites",
        "newscasters",
        "swimmers",
        "standing on elephants",
        "spotlights",
        "churros",
        "in woman's hands",
        "post it notes",
        "motorcycle and cars",
        "rockets",
        "raising hands",
        "herons",
        "miles",
        "cartons",
        "crepes",
        "hydrangeas",
        "prisoners",
        "no cones",
        "rods",
        "stockings",
        "capris",
        "blowing out candles",
        "suburbs",
        "snowshoes",
        "elbow pads",
        "his",
        "5 days",
        "at his sides",
        "streetlights",
        "jugs",
        "parking spaces",
        "dials",
        "fat cats",
        "treats",
        "aliens",
        "years",
        "tongs",
        "flower pots",
        "brass",
        "candlesticks",
        "bus",
        "pounds",
        "spices",
        "feeding birds",
        "concessions",
        "shears",
        "tv remotes",
        "dolphins",
        "flames",
        "levis",
        "no red letters",
        "knights",
        "no arrows",
        "fish bowls",
        "troughs",
        "ghosts",
        "black spots",
        "dividers",
        "noodles",
        "headlights",
        "dinner plates",
        "kemps",
        "ride motorcycles",
        "transformers",
        "behind zebras",
        "scones",
        "steps",
        "electronics",
        "soda cans",
        "keys",
        "no ribbons",
        "trams",
        "suit jackets",
        "marks",
        "rookies",
        "weeds",
        "restrooms",
        "dr browns",
        "cherubs",
        "flip flops",
        "tea pots",
        "sandals",
        "toy cars",
        "beware of trains",
        "townhouses",
        "ear tags",
        "boy scouts",
        "glass doors",
        "happy dogs",
        "astros",
        "shrubs",
        "hornets",
        "sidelines",
        "condoms",
        "cubs",
        "insects",
        "stingrays",
        "panthers",
        "rileys",
        "petunias",
        "car keys",
        "marlins",
        "braves",
        "apples oranges bananas",
        "in front of girls",
        "white lines",
        "worms",
        "clams",
        "no chains"
    );

    public OneShotAnswer saveOneShotAnswer(OneShotAnswer oneshotAnswer) {
        return this.oneShotAnswerRepository.save(oneshotAnswer);
    }

    public List<OneShotAnswer> getOneShotAnswerResults() {
        return this.oneShotAnswerRepository.findAll();
    }
    public List<OneShotAnswerV2> getOneShotAnswerV2Results() {
        return this.oneShotAnswerV2Repository.findAll();
    }

    public List<OneShotAnswerV3> getOneShotAnswerV3Results() {
        return this.oneShotAnswerV3Repository.findAll();
    }

    public void deleteOneShotGameAnswers(String safeWord) {
        if (safeWord.equals("Nuke oneshot")) {
            this.oneShotAnswerRepository.deleteAll();
        }
    }

    public void deleteOneShotV2GameAnswers(String safeWord) {
        if (safeWord.equals("Nuke oneshot")) {
            this.oneShotAnswerV2Repository.deleteAll();
        }
    }

    public void deleteOneShotV3GameAnswers(String safeWord) {
        if (safeWord.equals("Nuke oneshot")) {
            this.oneShotAnswerV3Repository.deleteAll();
        }
    }

    public void deleteOneShotAnswerById(String id) {
        this.oneShotAnswerRepository.deleteById(id);
    }

    public void deleteOneShotV2AnswerById(String id) {
        this.oneShotAnswerV2Repository.deleteById(id);
    }

    public void deleteOneShotV3AnswerById(String id) {
        this.oneShotAnswerV3Repository.deleteById(id);
    }

    public void deleteOneShotAnswersByWorkerId(String workerId) {
        this.oneShotAnswerRepository.deleteOneShotAnswerByWorkerId(workerId);
    }

    public void deleteOneShotV2AnswersByWorkerId(String workerId) {
        this.oneShotAnswerV2Repository.deleteOneShotAnswerByWorkerId(workerId);
    }

    public void deleteOneShotV3AnswersByWorkerId(String workerId) {
        this.oneShotAnswerV3Repository.deleteOneShotAnswerByWorkerId(workerId);
    }

    public void saveOneShotFeedback(String answerId, String feedback, Boolean collectReward, String likertResponses) {
        try {
            Optional<OneShotAnswer> oneShotAnswer = this.oneShotAnswerRepository.findById(answerId);
            if (oneShotAnswer != null && oneShotAnswer.isPresent()) {
                oneShotAnswer.get().setFeedback(feedback);
                oneShotAnswer.get().setHitReward(collectReward);
                oneShotAnswer.get().setLikert(likertResponses);
                this.oneShotAnswerRepository.save(oneShotAnswer.get());
            } else {
                log.error("Unable to find oneShotAnswer with Id: " + answerId);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }
    public void saveOneShotV2Feedback(String answerId, String feedback, Boolean collectReward, String likertResponses) {
        try {
            Optional<OneShotAnswerV2> oneShotAnswer = this.oneShotAnswerV2Repository.findById(answerId);
            if (oneShotAnswer != null && oneShotAnswer.isPresent()) {
                oneShotAnswer.get().setFeedback(feedback);
                oneShotAnswer.get().setHitReward(collectReward);
                oneShotAnswer.get().setLikert(likertResponses);
                this.oneShotAnswerV2Repository.save(oneShotAnswer.get());
            } else {
                log.error("Unable to find oneShotAnswer with Id: " + answerId);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

    public void saveOneShotV3Feedback(String answerId, String feedback, Boolean collectReward, String likertResponses) {
        try {
            Optional<OneShotAnswerV3> oneShotAnswer = this.oneShotAnswerV3Repository.findById(answerId);
            if (oneShotAnswer != null && oneShotAnswer.isPresent()) {
                oneShotAnswer.get().setFeedback(feedback);
                oneShotAnswer.get().setHitReward(collectReward);
                oneShotAnswer.get().setLikert(likertResponses);
                this.oneShotAnswerV3Repository.save(oneShotAnswer.get());
            } else {
                log.error("Unable to find oneShotAnswer with Id: " + answerId);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }
}
