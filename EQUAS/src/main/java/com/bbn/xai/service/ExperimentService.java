package com.bbn.xai.service;

import java.io.*;
import java.net.Socket;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import com.bbn.xai.EquasApp;
import com.bbn.xai.config.ApplicationProperties;
import com.bbn.xai.domain.EvaluationPhase;
import com.bbn.xai.domain.FolderEntity;
import com.bbn.xai.domain.NlgDescription;
import com.bbn.xai.domain.VqaBundle;
import com.bbn.xai.domain.VqaReply;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

@Service
public class ExperimentService {

    /**
     * Answer to return if failure occurs while transacting with the VQA server.
     */
    private static final String DEFAULT_ANSWER = "(Failure to transact with VQA server)";

    /**
     * Answer to return if failure occurs while transacting with the NLG process.
     */
    private static final String DEFAULT_NLG_RESPONSE = "(Failure to transact with NLG server)";

    private static String heatMapUploadUri = "api/experiment/upload-model-result-files/";
    private final Logger log = LoggerFactory.getLogger(ExperimentService.class);
    @Autowired
    Environment environment;
    @Autowired
    private ApplicationProperties applicationProperties;
    @Autowired
    private UserService userService;
    private List<VqaBundle> questionHistoryHieCoAttenVqa = new ArrayList<>();
    private List<VqaBundle> questionHistoryFaithful = new ArrayList<>();
    private String externalEndpointUri = null;

    public static void main(String[] args) throws UnknownHostException {

        String hostAddress = "http://localhost:8087/";

        for (String arg : args) {
            if (arg.contains("standalone")) {
                hostAddress = "";
            }
        }

        ExperimentService service = new ExperimentService();

        VqaBundle vqaBundle = new VqaBundle("What is the baby holding ?", "testId-3210", "http://crunchymoms.com/wp-content/uploads/2013/11/toothbrush21.jpg");
        service.askQuestionHieCoAtten(vqaBundle, hostAddress, heatMapUploadUri);
        service.generateNaturalLanguage(vqaBundle);

        System.out.println("Q: " + vqaBundle.getQuestion());
        System.out.println("A: " + vqaBundle.getAnswer());
        System.out.println("NL: " + vqaBundle.getNaturalLanguage());

        vqaBundle = new VqaBundle("What color is the toothbrush ?", "testId-3211", "http://crunchymoms.com/wp-content/uploads/2013/11/toothbrush21.jpg");
        service.askQuestionHieCoAtten(vqaBundle, hostAddress, heatMapUploadUri);
        service.generateNaturalLanguage(vqaBundle);

        System.out.println("Q: " + vqaBundle.getQuestion());
        System.out.println("A: " + vqaBundle.getAnswer());
        System.out.println("NL: " + vqaBundle.getNaturalLanguage());
    }

    public String getExternalEndpointUri() {
        if (externalEndpointUri != null) {
            return this.externalEndpointUri;
        }
        try {
            String protocol = "http";
            if (environment.getProperty("server.ssl.key-store") != null) {
                protocol = "https";
            }
            String port = environment.getProperty("server.port");
            String hostAddress = EquasApp.getLocalHostLANAddress();
            this.externalEndpointUri = protocol + "://" + hostAddress + ":" + port + "/";
        } catch (UnknownHostException e) {
            log.error(e.getMessage());
        }
        return this.externalEndpointUri;
    }

    public String getRelativeUri(File file) {
        String relativeUri = applicationProperties.getEvaluation().getWebUriFromLocalPath(file);
        return relativeUri;
    }

    public String getAbsoluteUri(File file) {
        String absoluteUri = getExternalEndpointUri() + getRelativeUri(file);
        return absoluteUri;
    }

    public FolderEntity getAllImageFiles(String datasetName, EvaluationPhase evaluationPhase) throws UnknownHostException {
        return this.getAllImageFiles(datasetName, evaluationPhase, Integer.MAX_VALUE);
    }

    public void renameCocoImageFiles(String datasetName, EvaluationPhase evaluationPhase) throws UnknownHostException {
        String path = applicationProperties.getEvaluation().getImagesPath(datasetName, evaluationPhase);
        File dir = new File(path);
        for (File file : dir.listFiles()) {
            String fileName  = stripCocoPreix(file.getName());
//            fileName = fileName.replace("COCO_train2014_", "");
//            fileName = fileName.replace("COCO_val2014_", "");
//            fileName = fileName.replaceFirst("^0+(?!$)", "");  // Replace padded zeros
            file.renameTo(new File(path + fileName));
        }
    }

    public String stripCocoPreix(String imageName) throws UnknownHostException {
        imageName = imageName.replace("COCO_train2014_", "");
        imageName = imageName.replace("COCO_val2014_", "");
        imageName = imageName.replace("COCO_test2014_", "");
        imageName = imageName.replaceFirst("^0+(?!$)", "");  // Replace padded zeros
        return imageName;
    }

    public FolderEntity getAllImageFiles(String datasetName, EvaluationPhase evaluationPhase, int maxResults) throws UnknownHostException {
        FolderEntity result = new FolderEntity();
        String path = applicationProperties.getEvaluation().getImagesPath(datasetName, evaluationPhase);
        File dir = new File(path);
        result.setFolderUri(this.getRelativeUri(dir));
        int maxCount = 0;
        for (File file : dir.listFiles()) {
            maxCount += 1;
            if (maxCount > maxResults) {
                break;
            }
            result.getFiles().add(file.getName());
        }
        return result;
    }

    public File getRandomImageFile(String datasetName, EvaluationPhase evaluationPhase) {
        String path = applicationProperties.getEvaluation().getImagesPath(datasetName, evaluationPhase);
        File dir = new File(path);
        File[] files = dir.listFiles();
        Random rand = new Random();
        File file = files[rand.nextInt(files.length)];
        return file;
    }

    public File getImageFile(String datasetName, EvaluationPhase evaluationPhase, String imageName) {
        String path = applicationProperties.getEvaluation().getImagesPath(datasetName, evaluationPhase);
        File file = new File(path + imageName);
        return file;
    }

    public File getNextImageFile(String datasetName, EvaluationPhase evaluationPhase, String currentImageName) {
        String path = applicationProperties.getEvaluation().getImagesPath(datasetName, evaluationPhase);
        File currentImage = new File(path + currentImageName);
        File dir = new File(path);
        File[] files = dir.listFiles();
        int index = 0;
        for (File f : files) {
            if (f.equals(currentImage)) {
                if (index < files.length - 1) {
                    index += 1;
                } else {
                    index = 0;
                }
                break;
            }
            index += 1;
        }
        File nextImage = files[index];
        return nextImage;
    }

    public String getRandomImageWebUri(String datasetName, EvaluationPhase evaluationPhase) {
        File file = getRandomImageFile(datasetName, evaluationPhase);
        String result = applicationProperties.getEvaluation().getWebUriFromLocalPath(file);
        return result;
    }


    public List<VqaBundle> getVqaHistory(String datasetName, EvaluationPhase evaluationPhase, String imageName) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        String combinedQuestionsAndAnswersFile = applicationProperties.getEvaluation().getCombinedQuestionsAndAnswersFile();
        if (evaluationPhase == EvaluationPhase.training) {
            List<VqaBundle> entireVqaHistory = Arrays.asList(mapper.readValue(new File(applicationProperties.getEvaluation().getPhasePath(datasetName, evaluationPhase) + "/" + combinedQuestionsAndAnswersFile), VqaBundle[].class));
            List<VqaBundle> filteredResult = entireVqaHistory.stream().filter(v -> v.getImg().equalsIgnoreCase(imageName)).collect(Collectors.toList());
            return filteredResult;
        } else {
            //TODO : Implement for Validation/Testing sets
            return new ArrayList<>();
        }
    }

    public VqaBundle submitQuestionHieCoAttenVqa(VqaBundle questionAnswerBundle, boolean addToHistory, boolean skipSegmentation) {
    	if (addToHistory) {
            questionAnswerBundle.setUserId(userService.getUserWithAuthorities().get().getId());
            questionHistoryHieCoAttenVqa.add(questionAnswerBundle);
        }
        this.askQuestionHieCoAtten(questionAnswerBundle, this.getExternalEndpointUri(), heatMapUploadUri);
        return questionAnswerBundle;
    }

    public VqaBundle submitQuestionFaithfulExplanation(VqaBundle questionAnswerBundle, boolean addToHistory, boolean skipSegmentation) {
        if (addToHistory) {
            questionAnswerBundle.setUserId(userService.getUserWithAuthorities().get().getId());
            questionHistoryFaithful.add(questionAnswerBundle);
        }
        this.askQuestionFaithful(questionAnswerBundle, this.getExternalEndpointUri(), heatMapUploadUri, skipSegmentation);
        return questionAnswerBundle;
    }

    public List<VqaBundle> getQuestionHistoryHieCoAttenVqa(String imageUri, String userId) {
        return this.questionHistoryHieCoAttenVqa.stream()
            .filter(v -> v.getImgUri().equalsIgnoreCase(imageUri) && v.getUserId().equals(userId))
//            .sorted(Comparator.comparing(VqaBundle::getTimeAsked)
            .sorted(Comparator.comparing(VqaBundle::getTimeAsked, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());
    }

    public List<VqaBundle> getQuestionHistoryHieCoAttenVqa() {
        return this.questionHistoryHieCoAttenVqa;
    }

    public List<VqaBundle> getQuestionHistoryFaithful(String imageUri, String userId) {
        return this.questionHistoryFaithful.stream()
            .filter(v -> v.getImgUri().equalsIgnoreCase(imageUri) && v.getUserId().equals(userId))
//            .sorted(Comparator.comparing(VqaBundle::getTimeAsked)
            .sorted(Comparator.comparing(VqaBundle::getTimeAsked, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());
    }

    public List<VqaBundle> getQuestionHistoryFaithful() {
        return this.questionHistoryFaithful;
    }

    /**
     * Ask the independent VQA process a question.
     *
     * @param vqaBundle The bundle containing the question to ask.  The answer will be returned in the same bundle.
     */
    public void askQuestionHieCoAtten(VqaBundle vqaBundle, String externalEndpointUri, String heatMapUploadUri) {

        // TODO is this maybe the right place to start the actual VQA process?

        Socket socket = null;
        BufferedReader socketReader = null;
        PrintWriter socketWriter = null;

        try {
            String host = "128.89.77.64";
            int port = 8088;
            if (applicationProperties != null) {
                host = this.applicationProperties.getVqaServer().getHostAddress();
                port = this.applicationProperties.getVqaServer().getPort();
            }

            socket = new Socket(host, port);
            socketWriter = new PrintWriter(socket.getOutputStream());
            socketReader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        } catch (IOException e) {
            log.error("Exception while attempting to initialize socket connection with VQA process:");
            e.printStackTrace();
        }

        if (socketReader != null) {
            log.info("Established socket connection with VQA process.");
        }

        String replyStr = DEFAULT_ANSWER;

        if (socketReader != null) {
            try {
                socketWriter.write(vqaBundle.getQuestion() + System.lineSeparator());
                socketWriter.write(vqaBundle.getForceAnswer() + System.lineSeparator());
                socketWriter.write(vqaBundle.getId() + System.lineSeparator());
                socketWriter.write(externalEndpointUri + vqaBundle.getImgUri() + System.lineSeparator());
                socketWriter.write(externalEndpointUri + heatMapUploadUri + System.lineSeparator());
                socketWriter.flush();
                log.info("Sent '" + vqaBundle.getQuestion() + "' to VQA server");

                replyStr = socketReader.readLine();
                log.info("Got reply: " + replyStr);

                socket.close();
            } catch (IOException e) {
                log.error("Failure transacting with VQA process:");
                e.printStackTrace();
            }
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            VqaReply vqaReply = mapper.readValue(replyStr, VqaReply.class);
            vqaBundle.setAnswer(vqaReply.getAnswer());
            vqaBundle.setReply(vqaReply);
            vqaBundle.setTimeAnswered(LocalDateTime.now());

        } catch (IOException e) {
            log.error("Failure reading VQA answer:");
            e.printStackTrace();
        }
    }

    public void askQuestionFaithful(VqaBundle vqaBundle, String externalEndpointUri, String heatMapUploadUri, boolean skipSegmentation) {

        Socket socket = null;
        BufferedReader socketReader = null;
        PrintWriter socketWriter = null;

        try {
            String host = "128.89.77.64";
            int port = 8290;
            if (applicationProperties != null) {
                host = this.applicationProperties.getFaithfulVqaServer().getHostAddress();
                port = this.applicationProperties.getFaithfulVqaServer().getPort();
            }

            socket = new Socket(host, port);
            socketWriter = new PrintWriter(socket.getOutputStream());
            socketReader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        } catch (IOException e) {
            log.error("Exception while attempting to initialize socket connection with VQA process:");
            e.printStackTrace();
        }

        if (socketReader != null) {
            log.info("Established socket connection with VQA process.");
        }

        String replyStr = DEFAULT_ANSWER;

        if (socketReader != null) {
            try {
                socketWriter.write(vqaBundle.getQuestion() + System.lineSeparator());
//                socketWriter.write(vqaBundle.getForceAnswer() + System.lineSeparator());
                socketWriter.write(vqaBundle.getId() + System.lineSeparator());
                socketWriter.write(externalEndpointUri + stripCocoPreix(vqaBundle.getImgUri()) + System.lineSeparator());
                socketWriter.write(externalEndpointUri + heatMapUploadUri + System.lineSeparator());
                socketWriter.write(skipSegmentation + System.lineSeparator());
                socketWriter.flush();
                log.info("Sent '" + vqaBundle.getQuestion() + "' to VQA server");

                replyStr = socketReader.readLine();
                log.info("Got reply: " + replyStr);

                socket.close();
            } catch (IOException e) {
                log.error("Failure transacting with VQA process:");
                e.printStackTrace();
            }
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            VqaReply.FaithfulResponse vqaReply = mapper.readValue(replyStr, VqaReply.FaithfulResponse.class);
              vqaBundle.setAnswer(vqaReply.answer);
              vqaBundle.setExplanation(vqaReply.explanation);
              vqaBundle.setExplanationHtml(vqaReply.explanationHtml);
//              vqaBundle.setComponentExplanationHtml(vqaReply.componentExplanationHtml);
              vqaBundle.setComponentExplanation(vqaReply.componentExplanation);
              vqaBundle.setTopN(vqaReply.topN);
//            vqaBundle.setAnswer(vqaReply.getAnswer());
//            vqaBundle.setNaturalLanguage(naturalLanguage);
//            vqaBundle.setReply(vqaReply);
            vqaBundle.setTimeAnswered(LocalDateTime.now());

        } catch (Exception e) {
            log.error("Failure reading VQA answer:");
            e.printStackTrace();
        }
    }

	public void generateNaturalLanguage(VqaBundle vqaBundle) {

		Socket socket = null;
		BufferedReader socketReader = null;
		PrintWriter socketWriter = null;

		try {
			String host = "localhost";
			int port = 8089;
			if (applicationProperties != null) {
				host = this.applicationProperties.getNlgServer().getHostAddress();
				port = this.applicationProperties.getNlgServer().getPort();
				System.out.println("NLG server is " + host + ":" + port);
			}

			socket = new Socket(host, port);
			socketWriter = new PrintWriter(socket.getOutputStream());
			socketReader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		} catch (IOException e) {
			log.error("Exception while attempting to initialize socket connection with NLG process:");
			e.printStackTrace();
		}

		if (socketReader != null) {

			log.info("Established socket connection with NLG process.");

			String replyStr = DEFAULT_NLG_RESPONSE;
			try {
				ObjectMapper mapper = new ObjectMapper();
				ObjectWriter vqaReplySerializer = mapper.writerFor(VqaReply.class);
				String vqaReplyJson = vqaReplySerializer.writeValueAsString(vqaBundle.getReply());

				socketWriter.write(vqaReplyJson + System.lineSeparator());
				socketWriter.flush();
				log.info("Sent VQA reply to NLG server");

				replyStr = socketReader.readLine();
				log.info("Got NLG reply: " + replyStr);

				try {
					NlgDescription naturalLanguage = mapper.readValue(replyStr, NlgDescription.class);
					vqaBundle.setNaturalLanguage(naturalLanguage);

				} catch (IOException e) {
					log.error("Failure parsing NLG answer:");
					e.printStackTrace();
				}

				socket.close();
			} catch (IOException e) {
				log.error("Failure transacting with NLG server:");
				e.printStackTrace();
			}
		}
	}

    public void close() {
        // Empty for now
    }

}
