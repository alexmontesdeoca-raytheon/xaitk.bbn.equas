import {
    QuestionTableItem,
    TaskLog,
    TaskEntry,
    QuestionTableDialogModel,
    BlurAnswer,
    GlobalExplanationFilter,
    BlurQuestion,
    BlurLevel,
    OneShotAnswer,
    Rankings,
    DemoAspect,
    DemoImage,
    DemoScoreInput,
    DemoScoreResult,
    DemoSave
} from './../../shared/model/global-explanation.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SERVER_API_URL } from 'app/app.constants';
import { createRequestOption, createRequestOption2 } from 'app/shared';
import { IGlobalExplanation } from 'app/shared/model/global-explanation.model';
import { XAIObj, EvaluationPhase, VqaHistory, VqaBundle, FolderEntity } from '../../shared/xai/xai.model';
import { GlobalExplanationDataset, QuestionStat, Annotation } from '../../shared/model/global-explanation.model';
import { map, max } from 'rxjs/operators';
import * as d3 from 'd3';

type EntityResponseType = HttpResponse<IGlobalExplanation>;
type EntityArrayResponseType = HttpResponse<IGlobalExplanation[]>;

@Injectable({ providedIn: 'root' })
export class GlobalExplanationService {
    private resourceUrl = SERVER_API_URL + 'api/global-explanations';
    readonly defaultPhase: EvaluationPhase = EvaluationPhase.training;
    readonly defaultDataset = 'v2_coco';
    private globalExplanationDatasetClientCache = {};

    constructor(private http: HttpClient) {}

    create(globalExplanation: IGlobalExplanation): Observable<EntityResponseType> {
        return this.http.post<IGlobalExplanation>(this.resourceUrl, globalExplanation, { observe: 'response' });
    }

    update(globalExplanation: IGlobalExplanation): Observable<EntityResponseType> {
        return this.http.put<IGlobalExplanation>(this.resourceUrl, globalExplanation, { observe: 'response' });
    }

    find(id: string): Observable<EntityResponseType> {
        return this.http.get<IGlobalExplanation>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IGlobalExplanation[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(id: string): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: 'response' });
    }

    getQuestionCSV(datasetName: string, evaluationPhase: EvaluationPhase, filter: string, filterParams?: GlobalExplanationFilter): any {
        return this.http.get(`${this.resourceUrl}/annotation-csv/${datasetName}/${EvaluationPhase[evaluationPhase]}/${filter}/`, {
            params: createRequestOption2(filterParams),
            responseType: 'text',
            observe: 'response'
        });
    }

    getNAnnotations(maxResults: number, filterParams: GlobalExplanationFilter): Observable<HttpResponse<Annotation[]>> {
        return this.http.get<Annotation[]>(`${this.resourceUrl}/n-annotations/${maxResults}/`, {
            params: createRequestOption2(filterParams),
            observe: 'response'
        });
    }

    getAnnotationsForQuestion(
        question: string,
        filter: string,
        filterParams: GlobalExplanationFilter
    ): Observable<HttpResponse<Annotation[]>> {
        return this.http.post<Annotation[]>(`${this.resourceUrl}/annotations-for-question/${filter}/`, question, {
            params: createRequestOption2(filterParams),
            observe: 'response'
        });
    }

    getAnnotationById(questionId: string): Observable<HttpResponse<Annotation>> {
        return this.http.get<Annotation>(`${this.resourceUrl}/annotation/${questionId}/`, {
            observe: 'response'
        });
    }

    getAnnotationsForAnswer(answer: string, filter: string, filterParams: GlobalExplanationFilter): Observable<HttpResponse<Annotation[]>> {
        return this.http.post<Annotation[]>(`${this.resourceUrl}/annotations-for-answer/${filter}/`, answer, {
            params: createRequestOption2(filterParams),
            observe: 'response'
        });
    }

    getAnnotationsForModelAnswer(
        answer: string,
        filter: string,
        filterParams: GlobalExplanationFilter
    ): Observable<HttpResponse<Annotation[]>> {
        return this.http.post<Annotation[]>(`${this.resourceUrl}/annotations-for-model-answer/${filter}/`, answer, {
            params: createRequestOption2(filterParams),
            observe: 'response'
        });
    }

    getSimilarImages(imageName: string): Promise<VqaBundle[]> {
        return this.http
            .get<number[]>(`${this.resourceUrl}/similar-images/${imageName}`, {
                observe: 'response'
            })
            .pipe(
                map((response: HttpResponse<number[]>) => {
                    try {
                        const tmp = response.body;
                        const result: VqaBundle[] = [];
                        for (let index = 0; index < tmp.length; index++) {
                            const filename = tmp[index];
                            const newBundle = new VqaBundle();
                            newBundle.img = filename.toString();
                            result.push(newBundle);
                        }
                        return result;
                    } catch (error) {
                        console.log(error.message);
                    }
                })
            )
            .toPromise();
    }

    getGlobalExplanationDataset(
        datasetName: string,
        evaluationPhase: EvaluationPhase,
        filter: string,
        filterParams: GlobalExplanationFilter
    ): Promise<GlobalExplanationDataset> {
        // tslint:disable-next-line:max-line-length
        const gekey = datasetName + '-' + evaluationPhase + '-' + filter;
        if (this.globalExplanationDatasetClientCache[gekey] !== undefined) {
            return Promise.resolve(this.globalExplanationDatasetClientCache[gekey]);
        } else {
            const roundTripTask = new TaskEntry('Client + Server Round Trip (Cached on client after first call)');
            return this.http
                .get<GlobalExplanationDataset>(
                    `${this.resourceUrl}/global-explanation-dataset/${datasetName}/${EvaluationPhase[evaluationPhase]}/${filter}/`,
                    {
                        params: createRequestOption2(filterParams),
                        observe: 'response'
                    }
                )
                .pipe(
                    map(
                        (response: HttpResponse<GlobalExplanationDataset>) => {
                            try {
                                let globalExplanationDataset: GlobalExplanationDataset;
                                globalExplanationDataset = response.body;
                                globalExplanationDataset.questionTableModel = new QuestionTableDialogModel();
                                globalExplanationDataset.answerTable = [];
                                globalExplanationDataset.modelAnswerTable = [];

                                globalExplanationDataset.log = Object.assign(new TaskLog(), globalExplanationDataset.log); // Convert Json to TaskLog Object
                                globalExplanationDataset.log.startTask('Client - Build Word Hierarchy');
                                globalExplanationDataset.questionCsvArray = d3.csv.parseRows(globalExplanationDataset.questionCsv);

                                globalExplanationDataset.log.startTask('Client - Compute Top Answers');
                                for (let index = 0; index < globalExplanationDataset.questionCsvArray.length; index++) {
                                    const line = globalExplanationDataset.questionCsvArray[index];
                                    const newQuestion = new QuestionTableItem(line[0], Number(line[1]), Number(line[2]));
                                    globalExplanationDataset.questionTableModel.dataset.push(newQuestion);
                                }

                                // Model Answers
                                for (const keyAnswer in globalExplanationDataset.modelAnswers) {
                                    if (globalExplanationDataset.modelAnswers.hasOwnProperty(keyAnswer)) {
                                        const answerMap = globalExplanationDataset.modelAnswers[keyAnswer];

                                        const a = {
                                            answer: keyAnswer,
                                            count: 0, // # of questions with this answer
                                            imageCount: 0, // # of images with this answer
                                            questions: [] // Questions that have this answer
                                        };
                                        globalExplanationDataset.modelAnswerTable.push(a);

                                        for (const keyQuestionIndex in answerMap) {
                                            if (answerMap.hasOwnProperty(keyQuestionIndex)) {
                                                const answerFrequency = answerMap[keyQuestionIndex];
                                                a.count += 1;
                                                a.imageCount += answerFrequency;
                                                const theQuestion = globalExplanationDataset.questionTableModel.dataset[keyQuestionIndex];
                                                theQuestion.modelTotalAnswerCount += answerFrequency;
                                                a.questions.push(theQuestion);
                                                const afm = theQuestion.modelAnswerFreqMap[a.answer];
                                                if (afm === undefined) {
                                                    theQuestion.modelAnswerFreqMap[a.answer] = answerFrequency;
                                                } else {
                                                    theQuestion.modelAnswerFreqMap[a.answer] += answerFrequency;
                                                }
                                            }
                                        }
                                    }
                                }
                                // Compute top answers per question
                                // convert answer/frequency map to a regular array
                                for (let index = 0; index < globalExplanationDataset.questionTableModel.dataset.length; index++) {
                                    const question = globalExplanationDataset.questionTableModel.dataset[index];
                                    for (const key in question.modelAnswerFreqMap) {
                                        if (question.modelAnswerFreqMap.hasOwnProperty(key)) {
                                            const frequency = question.modelAnswerFreqMap[key];
                                            question.modelAnswers.push({
                                                answer: key,
                                                count: frequency
                                            });
                                        }
                                    }
                                    // Sort answers by frequency
                                    question.modelAnswers.sort((a, b) => {
                                        return b.count - a.count;
                                    });
                                }
                                // End - Model Answers
                                // Turker Answers
                                for (const keyAnswer in globalExplanationDataset.answers) {
                                    if (globalExplanationDataset.answers.hasOwnProperty(keyAnswer)) {
                                        const answerMap = globalExplanationDataset.answers[keyAnswer];

                                        const a = {
                                            answer: keyAnswer,
                                            count: 0, // # of questions with this answer
                                            imageCount: 0, // # of images with this answer
                                            questions: [] // Questions that have this answer
                                        };
                                        globalExplanationDataset.answerTable.push(a);

                                        for (const keyQuestionIndex in answerMap) {
                                            if (answerMap.hasOwnProperty(keyQuestionIndex)) {
                                                const answerFrequency = answerMap[keyQuestionIndex];
                                                a.count += 1;
                                                a.imageCount += answerFrequency;
                                                const theQuestion = globalExplanationDataset.questionTableModel.dataset[keyQuestionIndex];
                                                theQuestion.totalAnswerCount += answerFrequency;
                                                a.questions.push(theQuestion);
                                                // theQuestion.answers.push(a);
                                                const afm = theQuestion.answerFreqMap[a.answer];
                                                if (afm === undefined) {
                                                    theQuestion.answerFreqMap[a.answer] = answerFrequency;
                                                } else {
                                                    theQuestion.answerFreqMap[a.answer] += answerFrequency;
                                                }
                                            }
                                        }
                                    }
                                }

                                // Compute top answers per question
                                // convert answer/frequency map to a regular array
                                for (let index = 0; index < globalExplanationDataset.questionTableModel.dataset.length; index++) {
                                    const question = globalExplanationDataset.questionTableModel.dataset[index];
                                    for (const key in question.answerFreqMap) {
                                        if (question.answerFreqMap.hasOwnProperty(key)) {
                                            const frequency = question.answerFreqMap[key];
                                            question.answers.push({
                                                answer: key,
                                                count: frequency
                                            });
                                        }
                                    }

                                    globalExplanationDataset.questionTableModel.countFilterMax = Math.max(
                                        globalExplanationDataset.questionTableModel.countFilterMax,
                                        question.count
                                    );
                                    globalExplanationDataset.questionTableModel.uniqueTurkerAnswerCountMax = Math.max(
                                        globalExplanationDataset.questionTableModel.uniqueTurkerAnswerCountMax,
                                        question.uniqueTurkerAnswerCount
                                    );
                                    // Sort answers by frequency
                                    question.answers.sort((a, b) => {
                                        return b.count - a.count;
                                    });
                                }
                                // END - Turker Answers
                                globalExplanationDataset.log.startTask('Client - Sort Questions/Answers by Frequency');

                                // Sort everything
                                globalExplanationDataset.modelAnswerTable.sort((a, b) => {
                                    return b.imageCount - a.imageCount;
                                });
                                globalExplanationDataset.answerTable.sort((a, b) => {
                                    return b.imageCount - a.imageCount;
                                });
                                globalExplanationDataset.questionTableModel.dataset.sort((a, b) => {
                                    return b.count - a.count;
                                });
                                roundTripTask.endTask();
                                globalExplanationDataset.log.items.push(roundTripTask);
                                // this.loadComplete = true;
                                // this.globalExplanationDatasetClientCache[gekey] = globalExplanationDataset;
                                return globalExplanationDataset;
                            } catch (error) {
                                console.log(error.message);
                            }
                        },
                        error => {
                            console.log(error.message);
                        }
                    )
                )
                .toPromise();
        }
    }

    getBlurGameParams(): Observable<HttpResponse<any>> {
        return this.http.get<any>(`${this.resourceUrl}/blur-game-params`, { observe: 'response' });
    }
    saveBlurGameParams(blurParams: any): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/save-blur-game-params/`, blurParams, { observe: 'response' });
    }
    getBlurGameQuestions(): Observable<HttpResponse<Annotation[]>> {
        return this.http.get<Annotation[]>(`${this.resourceUrl}/blur-game-questions`, { observe: 'response' });
    }
    getAllUniqueAnswers(): Observable<HttpResponse<string[]>> {
        return this.http.get<string[]>(`${this.resourceUrl}/all-unique-answers`, { observe: 'response' });
    }
    getBlurGameQuestionsForTopUniqueAnswers(): Observable<HttpResponse<Annotation[]>> {
        return this.http.get<Annotation[]>(`${this.resourceUrl}/blur-game-top-questions`, { observe: 'response' });
    }

    // getBlurGameQuestion(question: string, annotationIndex: number): Observable<HttpResponse<Annotation>> {
    //     return this.http.post<Annotation>(`${this.resourceUrl}/blur-game-question/${annotationIndex}/`, question, { observe: 'response' });
    // }

    hasWorkerAlreadyParticipatedInAnotherModality(workerId: string, modality: string): Observable<HttpResponse<boolean>> {
        return this.http.get<boolean>(`${this.resourceUrl}/worker-already-participated/${workerId}/${modality}`, {
            observe: 'response'
        });
    }

    getNextBlurGameQuestion(
        workerId: string,
        assignmentId: string,
        forceQuestionId: number,
        modality: string
    ): Observable<HttpResponse<BlurQuestion>> {
        return this.http.get<BlurQuestion>(
            `${this.resourceUrl}/blur-game-next-question/${workerId}/${assignmentId}/${forceQuestionId}/${modality}`,
            {
                observe: 'response'
            }
        );
    }

    getNextOneShotGameQuestion(
        workerId: string,
        assignmentId: string,
        forceQuestionId: number,
        modality: string,
        category: string,
        trial: number
    ): Observable<HttpResponse<BlurQuestion>> {
        return this.http.get<BlurQuestion>(
            `${this.resourceUrl}/one-shot-next-question/${workerId}/${assignmentId}/${forceQuestionId}/${modality}/${category}/${trial}`,
            {
                observe: 'response'
            }
        );
    }

    getNextOneShotV2GameQuestion(
        workerId: string,
        assignmentId: string,
        forceQuestionId: number,
        modality: string
    ): Observable<HttpResponse<BlurQuestion>> {
        return this.http.get<BlurQuestion>(
            `${this.resourceUrl}/one-shot-v2-next-question/${workerId}/${assignmentId}/${forceQuestionId}/${modality}`,
            {
                observe: 'response'
            }
        );
    }

    getNextOneShotV3GameQuestion(
        workerId: string,
        assignmentId: string,
        forceQuestionId: number,
        modality: string
    ): Observable<HttpResponse<BlurQuestion>> {
        return this.http.get<BlurQuestion>(
            `${this.resourceUrl}/one-shot-v3-next-question/${workerId}/${assignmentId}/${forceQuestionId}/${modality}`,
            {
                observe: 'response'
            }
        );
    }
    // getRanking(imageName: string): Observable<HttpResponse<Rankings>> {
    //     return this.http.get<Rankings>(`/evaluation_dataset/one_shot/${imageName}/units.json`, {
    //         observe: 'response'
    //     });
    // }

    getDemoFeatures(imageName: string): Observable<HttpResponse<Rankings>> {
        return this.http.get<Rankings>(`/evaluation_dataset/demo/features/features.json`, {
            observe: 'response'
        });
    }

    getRanking(imageName: string): Observable<HttpResponse<Rankings>> {
        return this.http.get<Rankings>(`/equasutilsservice/one_shot/class_features/${imageName}`, {
            observe: 'response'
        });
    }

    getRankingv3(imageName: string): Observable<HttpResponse<Rankings>> {
        return this.http.get<Rankings>(`/equasutilsservice/one_shot/class_features_v3/${imageName}`, {
            observe: 'response'
        });
    }

    sumbitRanking(class_name: string, ranking: any): Observable<HttpResponse<any>> {
        return this.http.post<any>(`/equasutilsservice/one_shot/class_scores/${class_name}`, ranking, { observe: 'response' });
    }

    sumbitRankingv3(class_name: string, ranking: any): Observable<HttpResponse<any>> {
        return this.http.post<any>(`/equasutilsservice/one_shot/class_scores_v3/${class_name}`, ranking, { observe: 'response' });
    }

    saveBlurGameAnswer(blurAnswer: BlurAnswer): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/blur-game-answer/`, blurAnswer, { observe: 'response' });
    }

    saveBlurGameFeedback(
        blurAnswerId: string,
        feedback: string,
        collectReward: boolean,
        likertResponses: string
    ): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/blur-game-feedback/${blurAnswerId}/${collectReward}/${likertResponses}`, feedback, {
            observe: 'response'
        });
    }

    getBlurGameResults(): Observable<HttpResponse<BlurAnswer[]>> {
        return this.http.get<BlurAnswer[]>(`${this.resourceUrl}/blur-game-results/`, {
            observe: 'response'
        });
    }

    getBlurGameResultsByModality(modality: string): Observable<HttpResponse<BlurAnswer[]>> {
        return this.http.get<BlurAnswer[]>(`${this.resourceUrl}/blur-game-results-by-modality/${modality}`, {
            observe: 'response'
        });
    }

    getBlurGameResultsFinalAnswers(): Observable<HttpResponse<BlurAnswer[]>> {
        return this.http.get<BlurAnswer[]>(`${this.resourceUrl}/blur-game-results-final-answers/`, {
            observe: 'response'
        });
    }

    getBlurLevels(): Observable<HttpResponse<any>> {
        return this.http.get<any>(`${this.resourceUrl}/blur-levels`, { observe: 'response' });
    }

    saveBlurLevels(blurLevels: BlurLevel[]): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/save-blur-levels/`, blurLevels, { observe: 'response' });
    }

    deleteWorkerById(workerId: string): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/delete-blur-game-answers-by-worker-id/${workerId}`, { observe: 'response' });
    }

    deleteOneShotAnswersByWorkerId(workerId: string): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/delete-one-shot-answers-by-worker-id/${workerId}`, { observe: 'response' });
    }

    deleteOneShotV2AnswersByWorkerId(workerId: string): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/delete-one-shot-v2-answers-by-worker-id/${workerId}`, { observe: 'response' });
    }

    deleteOneShotV3AnswersByWorkerId(workerId: string): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/delete-one-shot-v3-answers-by-worker-id/${workerId}`, { observe: 'response' });
    }

    saveOneShot(oneShotAnswer: OneShotAnswer): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/one-shot-answer/`, oneShotAnswer, { observe: 'response' });
    }

    saveOneShotFeedback(
        answerId: string,
        feedback: string,
        collectReward: boolean,
        likertResponses: string
    ): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/one-shot-feedback/${answerId}/${collectReward}/${likertResponses}`, feedback, {
            observe: 'response'
        });
    }

    saveOneShotV2Feedback(
        answerId: string,
        feedback: string,
        collectReward: boolean,
        likertResponses: string
    ): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/one-shot-v2-feedback/${answerId}/${collectReward}/${likertResponses}`, feedback, {
            observe: 'response'
        });
    }

    saveOneShotV3Feedback(
        answerId: string,
        feedback: string,
        collectReward: boolean,
        likertResponses: string
    ): Observable<HttpResponse<any>> {
        return this.http.post<any>(`${this.resourceUrl}/one-shot-v3-feedback/${answerId}/${collectReward}/${likertResponses}`, feedback, {
            observe: 'response'
        });
    }

    demoUploadHeatmap(heatmapFile: Blob): Observable<HttpResponse<any>> {
        const formData: FormData = new FormData();
        formData.append('heatmap', heatmapFile);
        return this.http.post<any>(`/equasutilsservice/one_shot/demo_upload_heatmap`, formData, { observe: 'response' });
    }

    demoTest2(): Observable<HttpResponse<any>> {
        return this.http.post<any>(`/equasutilsservice/one_shot/class_features_demo_test2`, { observe: 'response' });
    }

    class_features_demo(demoAspect: DemoAspect, maxResults: number): Observable<HttpResponse<DemoImage[]>> {
        demoAspect.max_results = maxResults;
        return this.http.post<any>(`/equasutilsservice/one_shot/class_features_demo`, demoAspect, { observe: 'response' });
    }

    class_scores_demo_test(): Observable<HttpResponse<DemoScoreResult>> {
        return this.http.post<any>(`/equasutilsservice/one_shot/class_scores_demo_test`, { observe: 'response' });
    }

    class_scores_demo(annotations: DemoScoreInput): Observable<HttpResponse<DemoScoreResult>> {
        return this.http.post<any>(`/equasutilsservice/one_shot/class_scores_demo`, annotations, { observe: 'response' });
    }

    save_demo_state(aspects: DemoAspect[], sessionId: string, name: string): Observable<HttpResponse<DemoImage[]>> {
        const demosave = new DemoSave();
        demosave.name = name;
        demosave.aspects = aspects;
        demosave.sessionId = sessionId;
        demosave.timestamp = Date.now();
        return this.http.post<any>(`/equasutilsservice/one_shot/one_shot_demo_save`, demosave, { observe: 'response' });
    }

    my_one_shot_demo_saves(sessionId: string): Observable<HttpResponse<any>> {
        return this.http.get<any>(`/equasutilsservice/one_shot/my_one_shot_demo_saves/${sessionId}`, {
            observe: 'response'
        });
    }
    get_one_shot_demo_save(id: string): Observable<HttpResponse<DemoSave>> {
        return this.http.get<DemoSave>(`/equasutilsservice/one_shot/get_one_shot_demo_save/${id}`, {
            observe: 'response'
        });
    }

    recover_images_by_class(query_str: string): Observable<HttpResponse<any[]>> {
        return this.http.get<any[]>(`/equasutilsservice/one_shot/recover_images_by_class/${query_str}`, {
            observe: 'response'
        });
    }
}
