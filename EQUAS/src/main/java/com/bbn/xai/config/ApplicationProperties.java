package com.bbn.xai.config;

import com.bbn.xai.domain.EvaluationPhase;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.io.File;

/**
 * Properties specific to XAI.
 * <p>
 * Properties are configured in the application.yml file.
 * See {@link io.github.jhipster.config.JHipsterProperties} for a good example.
 */
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = false)
public class ApplicationProperties {
    private final Evaluation evaluation = new Evaluation();
    private final ServerProperties faithfulVqaServer = new ServerProperties();
    private final ServerProperties vqaServer = new ServerProperties();
    private final ServerProperties nlgServer = new ServerProperties();

    public Evaluation getEvaluation() {
        return evaluation;
    }

    public ServerProperties getFaithfulVqaServer() {
        return faithfulVqaServer;
    }

    public ServerProperties getVqaServer() {
        return vqaServer;
    }

    public ServerProperties getNlgServer() {
        return nlgServer;
    }

    public static class ServerProperties {
        private String hostAddress = "";
        private int port;

        public String getHostAddress() {
            return hostAddress;
        }

        public void setHostAddress(String hostAddress) {
            this.hostAddress = hostAddress;
        }

        public int getPort() {
            return port;
        }

        public void setPort(int port) {
            this.port = port;
        }
    }

    public static class Evaluation {
        private String datasetRootPath = "";
        private String annotations = "";
        private String images = "";
        private String questions = "";
        private String combinedQuestionsAndAnswersFile = "";
        private String uploads = "";
        private String modelResults = "";

        public String getCombinedQuestionsAndAnswersFile() {
            return combinedQuestionsAndAnswersFile;
        }

        public void setCombinedQuestionsAndAnswersFile(String combinedQuestionsAndAnswersFile) {
            this.combinedQuestionsAndAnswersFile = combinedQuestionsAndAnswersFile;
        }

        public String getDatasetRootPath() {
            return datasetRootPath;
        }

        public void setDatasetRootPath(String datasetRootPath) {
            this.datasetRootPath = datasetRootPath;
        }


        public File getDatasetCanonicalRootFile() {
            try {
                return new File(datasetRootPath).getCanonicalFile();

            } catch (Exception ex) {
            }
            return null;
        }

        public String getDatasetRoot() {
            File datasetRootPath = new File(this.datasetRootPath);
            return datasetRootPath.toPath().getRoot().toString();
        }

        public String getDatasetRootFolderName() {
            File datasetRootPath = new File(this.datasetRootPath);
            return datasetRootPath.getName();
        }

        public String getDatasetUri() {
            return getDatasetRootFolderName() + "/";
        }

        public String getWebUriFromLocalPath(File file) {
            String filePath = "";
            String pathRoot = "";
            try {
                pathRoot = getDatasetCanonicalRootFile().toString();
                filePath = file.getCanonicalPath();
            } catch (Exception ex) {

            }

//            file.getPath().replace(rootDrive, "").replace("\\", "/");
            filePath = filePath.replace(pathRoot, "");
            filePath = getDatasetRootFolderName() + filePath;
            filePath = filePath.replace("\\", "/");
            return filePath;
        }

        public String getAnnotationsPath(String datasetName, EvaluationPhase evaluationPhase) {
            return getDatasetRootPath() + datasetName + "/" + evaluationPhase.name() + getAnnotations();
        }

        public String getImagesPath(String datasetName, EvaluationPhase evaluationPhase) {
            return getDatasetRootPath() + datasetName + "/" + evaluationPhase.name() + getImages();
        }

        public String getQuestionsPath(String datasetName, EvaluationPhase evaluationPhase) {
            return getDatasetRootPath() + datasetName + "/" + evaluationPhase.name() + getQuestions();
        }

        public String getUploadsPath() {
            return getDatasetRootPath() + uploads;
        }

        public String getModelResultsPath() {
            return getDatasetRootPath() + modelResults;
        }


        public String getPhasePath(String datasetName, EvaluationPhase evaluationPhase) {
            return getDatasetRootPath() + datasetName + "/" + evaluationPhase.name();
        }

        public String getAnnotations() {
            return annotations;
        }

        public void setAnnotations(String annotations) {
            this.annotations = annotations;
        }

        public String getImages() {
            return images;
        }

        public void setImages(String images) {
            this.images = images;
        }

        public String getQuestions() {
            return questions;
        }

        public void setQuestions(String questions) {
            this.questions = questions;
        }

        public String getUploads() {
            return uploads;
        }

        public void setUploads(String uploads) {
            this.uploads = uploads;
        }

        public String getModelResults() {
            return modelResults;
        }

        public void setModelResults(String modelResults) {
            this.modelResults = modelResults;
        }


    }
}
