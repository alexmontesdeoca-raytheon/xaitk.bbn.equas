package com.bbn.xai.web.rest;

import com.bbn.xai.config.ApplicationProperties;
import com.bbn.xai.config.Constants;
import com.bbn.xai.domain.*;
import com.bbn.xai.service.ExperimentService;
import com.bbn.xai.service.UserService;
import com.bbn.xai.web.rest.util.HeaderUtil;
import com.codahale.metrics.annotation.Timed;
import com.google.common.io.Files;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/experiment/")
public class ExperimentResource {

    private final Logger log = LoggerFactory.getLogger(ExperimentResource.class);
    @Autowired
    private ExperimentService experimentService;
    @Autowired
    private ApplicationProperties applicationProperties;
    @Autowired
    private UserService userService;

    private List<String> validFileTypes = Arrays.asList("jpg", "jpeg", "png");

    @ApiOperation("Rename COCO images.  Strip Prefix and padded zeros from filname")
    @GetMapping("image-list/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity renameCocoImageFiles(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase) throws IOException {
        this.experimentService.renameCocoImageFiles(datasetName, evaluationPhase);
        return new ResponseEntity<>("Rename Complete", HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request a list of images")
    @GetMapping("image-list/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{maxResults:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<FolderEntity> getImageList(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable int maxResults) throws IOException {
        FolderEntity result = this.experimentService.getAllImageFiles(datasetName, evaluationPhase, maxResults);
        return new ResponseEntity<FolderEntity>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }


    @ApiOperation("Request a random Image")
    @GetMapping("random-image/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<String> getRandomImage(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase) {
        String result = this.experimentService.getRandomImageWebUri(datasetName, evaluationPhase);
        return new ResponseEntity<>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request a random VQA history")
    @GetMapping("random-vqa-history/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{modelType:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<VqaHistory> getRandomVqaHistory(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable ModelType modelType) throws IOException {
        File imageFile = this.experimentService.getRandomImageFile(datasetName, evaluationPhase);
        String relativeUri = this.experimentService.getRelativeUri(imageFile);
        List<VqaBundle> questionHistory = new ArrayList<>();
        if (modelType == ModelType.faithful) {
            questionHistory = this.experimentService.getQuestionHistoryFaithful(relativeUri, userService.getUserWithAuthorities().get().getId());
        } else if (modelType == ModelType.hiecoattenvqa) {
            questionHistory = this.experimentService.getQuestionHistoryHieCoAttenVqa(relativeUri, userService.getUserWithAuthorities().get().getId());
        }
        List<VqaBundle> annotations = this.experimentService.getVqaHistory(datasetName, evaluationPhase, imageFile.getName());
        VqaHistory result = new VqaHistory(this.experimentService.getExternalEndpointUri(), relativeUri, questionHistory, annotations);
        return new ResponseEntity<VqaHistory>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request VQA history for a specific image")
    @GetMapping("request-vqa-history/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{imageName:" + Constants.FILE_REGEX + "}/{modelType:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<VqaHistory> getVqaHistory(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable String imageName, @PathVariable ModelType modelType) throws IOException {
        File imageFile = this.experimentService.getImageFile(datasetName, evaluationPhase, imageName);
        String relativeUri = this.experimentService.getRelativeUri(imageFile);
        List<VqaBundle> questionHistory = new ArrayList<>();
        if (modelType == ModelType.faithful) {
            questionHistory = this.experimentService.getQuestionHistoryFaithful(relativeUri, userService.getUserWithAuthorities().get().getId());
        } else if (modelType == ModelType.hiecoattenvqa) {
            questionHistory = this.experimentService.getQuestionHistoryHieCoAttenVqa(relativeUri, userService.getUserWithAuthorities().get().getId());
        }
        List<VqaBundle> annotations = this.experimentService.getVqaHistory(datasetName, evaluationPhase, imageFile.getName());
        VqaHistory result = new VqaHistory(this.experimentService.getExternalEndpointUri(), relativeUri, questionHistory, annotations);
        return new ResponseEntity<VqaHistory>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Request next VQA history")
    @GetMapping("request-next-vqa-history/{datasetName:" + Constants.FILE_REGEX + "}/{evaluationPhase:" + Constants.FILE_REGEX + "}/{currentImageName:" + Constants.FILE_REGEX + "}/{modelType:" + Constants.FILE_REGEX + "}")
    @Timed
    public ResponseEntity<VqaHistory> getNextVqaHistory(@PathVariable String datasetName, @PathVariable EvaluationPhase evaluationPhase, @PathVariable String currentImageName, @PathVariable ModelType modelType) throws IOException {
        File imageFile = this.experimentService.getNextImageFile(datasetName, evaluationPhase, currentImageName);
        String relativeUri = this.experimentService.getRelativeUri(imageFile);
        List<VqaBundle> questionHistory = new ArrayList<>();
        if (modelType == ModelType.faithful) {
            questionHistory = this.experimentService.getQuestionHistoryFaithful(relativeUri, userService.getUserWithAuthorities().get().getId());
        } else if (modelType == ModelType.hiecoattenvqa) {
            questionHistory = this.experimentService.getQuestionHistoryHieCoAttenVqa(relativeUri, userService.getUserWithAuthorities().get().getId());
        }
        List<VqaBundle> annotations = this.experimentService.getVqaHistory(datasetName, evaluationPhase, imageFile.getName());
        VqaHistory result = new VqaHistory(this.experimentService.getExternalEndpointUri(), relativeUri, questionHistory, annotations);
        return new ResponseEntity<VqaHistory>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit a question to HieCoAtten VQA")
    @PostMapping(path = "submit-question-hiecoattenvqa")
    @Timed
    public ResponseEntity<VqaBundle> submitQuestionHieCoAttenVqa(@RequestBody VqaBundle question) throws IOException {
        question.setTimeAsked(LocalDateTime.now());
        VqaBundle result = this.experimentService.submitQuestionHieCoAttenVqa(question, true, false);
        return new ResponseEntity<VqaBundle>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit a question to Faithful Explanation VQA")
    @PostMapping(path = "submit-question-faithful-explanation")
    @Timed
    public ResponseEntity<VqaBundle> submitQuestionFaithfulExplanation(@RequestBody VqaBundle question) throws IOException {
        question.setTimeAsked(LocalDateTime.now());
        VqaBundle result = this.experimentService.submitQuestionFaithfulExplanation(question, false, false);
        return new ResponseEntity<VqaBundle>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit a question to Faithful Explanation VQA")
    @PostMapping(path = "submit-question-faithful-explanation-no-seg")
    @Timed
    public ResponseEntity<VqaBundle> submitQuestionFaithfulExplanationNoSeg(@RequestBody VqaBundle question) throws IOException {
        question.setTimeAsked(LocalDateTime.now());
        VqaBundle result = this.experimentService.submitQuestionFaithfulExplanation(question, false, true);
        return new ResponseEntity<VqaBundle>(result, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit a Guess Which question (Faithful Explanation VQA)")
    @PostMapping(path = "submit-question-guess-which")
    @Timed
    public ResponseEntity<VqaBundleMin> submitQuestionGuessWhich(@RequestBody VqaBundleMin question) throws IOException {
        VqaBundle fullBundle = new VqaBundle(question.getQuestion(), question.getId(), question.getImg());
        VqaBundle result = this.experimentService.submitQuestionFaithfulExplanation(fullBundle, false, true);
        question.setAnswer(result.getAnswer());
        question.setExplanation(result.getExplanation());
        return new ResponseEntity<VqaBundleMin>(question, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Submit a question to (Faithful Explanation VQA)")
    @PostMapping(path = "submit-question-faithful-components")
    @Timed
    public ResponseEntity<VqaBundleMinComponents> submitQuestionFaithComponents(@RequestBody VqaBundleMinComponents question) throws IOException {
        VqaBundle fullBundle = new VqaBundle(question.getQuestion(), question.getId(), question.getImg());
        VqaBundle result = this.experimentService.submitQuestionFaithfulExplanation(fullBundle, false, false);
        question.setAnswer(result.getAnswer());
        question.setExplanation(result.getExplanation());
        question.setComponentExplanation(result.getComponentExplanation());
        return new ResponseEntity<VqaBundleMinComponents>(question, HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Returns complete question history for HieCoAttenVqa")
    @GetMapping("question-history-hiecoattenvqa")
    @Timed
    public ResponseEntity<List<VqaBundle>> getQuestionHistoryHieCoAttenVqa() throws IOException {
        return new ResponseEntity<List<VqaBundle>>(this.experimentService.getQuestionHistoryHieCoAttenVqa(), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Returns complete question history for Faithful Explanations")
    @GetMapping("question-history-faithful-explanations/")
    @Timed
    public ResponseEntity<List<VqaBundle>> getQuestionHistoryFaithful() throws IOException {
        return new ResponseEntity<List<VqaBundle>>(this.experimentService.getQuestionHistoryFaithful(), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Upload a new image")
    @PostMapping("upload-image/")
    public String uploadImage(@RequestParam("file") MultipartFile file, RedirectAttributes redirectAttributes) throws IOException {
        String uploadsPath = this.applicationProperties.getEvaluation().getUploadsPath();
        String imageId = UUID.randomUUID().toString();
        File outputFile = new File(uploadsPath + imageId + "/" + file.getOriginalFilename()).getCanonicalFile();
        outputFile.getParentFile().mkdirs();
        file.transferTo(outputFile);
        redirectAttributes.addFlashAttribute("message", "You successfully uploaded " + file.getOriginalFilename() + "!");
        return this.experimentService.getAbsoluteUri(outputFile);
    }

    @ApiOperation("Upload single model result file. (Heatmap, Grad-CAM, Guided Backprop etc.)")
    @PostMapping("upload-model-result-file/{questionId:" + Constants.QUESTION_ID + "}")
    public ResponseEntity<String> uploadModelResultFile(@RequestParam("file") MultipartFile file, @PathVariable String questionId, RedirectAttributes redirectAttributes) throws IOException {
        String modelResultsPath = this.applicationProperties.getEvaluation().getModelResultsPath();
        if (!validFileTypes.contains(Files.getFileExtension(file.getOriginalFilename().toLowerCase()))) { //Validate file types to prevent unrestricted file upload
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only jpg/png file types are supported");
        }
        File outputFolder = new File(modelResultsPath + questionId + "/").getCanonicalFile();
        outputFolder.mkdirs();
        File outputFile = new File(outputFolder, file.getOriginalFilename());
        outputFile.delete();
        file.transferTo(outputFile);
        redirectAttributes.addFlashAttribute("message", "You successfully uploaded " + file.getOriginalFilename() + "!");
        return new ResponseEntity<String>(this.experimentService.getAbsoluteUri(outputFile), HeaderUtil.createHeader(), HttpStatus.OK);
    }

    @ApiOperation("Upload multiple model result files. (Heatmap, Grad-CAM, Guided Backprop etc.)")
    @PostMapping("upload-model-result-files/{questionId:" + Constants.QUESTION_ID + "}")
    public ResponseEntity uploadModelResultFiles(@RequestParam("files") List<MultipartFile> files, @PathVariable String questionId, RedirectAttributes redirectAttributes) throws IOException {
        String modelResultsPath = this.applicationProperties.getEvaluation().getModelResultsPath();
        List<String> uriResults = new ArrayList<>();
        List<String> fileNames = new ArrayList<>();
        if (null != files && files.size() > 0) {
            for (MultipartFile multipartFile : files) { //Validate file types to prevent unrestricted file upload
                if (!validFileTypes.contains(Files.getFileExtension(multipartFile.getOriginalFilename().toLowerCase()))) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Only jpg/png file types are supported");
                }
            }

            File outputFolder = new File(modelResultsPath + questionId + "/").getCanonicalFile();
            outputFolder.mkdirs();

            for (MultipartFile multipartFile : files) {

//                String fileName = "vqa_gcam_hm.png";// multipartFile.getOriginalFilename();
                String fileName = multipartFile.getOriginalFilename();
                fileNames.add(fileName);
                File outputFile = new File(outputFolder, fileName);
                outputFile.delete();
                multipartFile.transferTo(outputFile);
                uriResults.add(this.experimentService.getAbsoluteUri(outputFile));
            }
        }
        redirectAttributes.addFlashAttribute("message", "You successfully uploaded files (" + String.join(", ", fileNames) + ")!");
        return new ResponseEntity<List<String>>(uriResults, HeaderUtil.createHeader(), HttpStatus.OK);
    }

}
