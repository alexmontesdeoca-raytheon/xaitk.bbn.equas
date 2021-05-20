import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { SERVER_API_URL } from '../../app.constants';
import { XAIObj, EvaluationPhase, VqaHistory, VqaBundle, FolderEntity, FolderEntityObj, FileEntityObj, ModelType } from './xai.model';
import { createRequestOption } from '../util/request-util';
import { map } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class XAIService {
    private experimentAPIUrl = SERVER_API_URL + 'api/experiment';
    private resourceUrl = SERVER_API_URL + 'api/users';
    // readonly defaultPhase: EvaluationPhase = EvaluationPhase.validation;
    readonly defaultDataset = 'v2_coco';
    private imageListCache = {};

    constructor(private http: HttpClient) {}

    getImageList(datasetName: string, evaluationPhase: EvaluationPhase, maxResults: number): Promise<FolderEntityObj> {
        const cacheKey = datasetName + '-' + evaluationPhase;
        if (this.imageListCache[cacheKey] !== undefined) {
            return Promise.resolve(this.imageListCache[cacheKey]);
        } else {
            return this.http
                .get<FolderEntity>(`${this.experimentAPIUrl}/image-list/${datasetName}/${EvaluationPhase[evaluationPhase]}/${maxResults}`, {
                    observe: 'response'
                })
                .pipe(
                    map((response: HttpResponse<FolderEntity>) => {
                        try {
                            const tmp = response.body;
                            const folderEntityObj = new FolderEntityObj();
                            folderEntityObj.folderUri = tmp.folderUri;
                            for (let index = 0; index < tmp.files.length; index++) {
                                const filename = tmp.files[index];
                                folderEntityObj.files.push(new FileEntityObj(filename));
                            }
                            this.imageListCache[cacheKey] = folderEntityObj;
                            return this.imageListCache[cacheKey];
                        } catch (error) {
                            console.log(error.message);
                        }
                    })
                )
                .toPromise();
        }
    }

    getVqaHistory(datasetName: string, evaluationPhase: EvaluationPhase, imageName: string, modelType: ModelType): Observable<VqaHistory> {
        return this.http
            .get<VqaHistory>(
                `${this.experimentAPIUrl}/request-vqa-history/${datasetName}/${EvaluationPhase[evaluationPhase]}/${imageName}/${
                    ModelType[modelType]
                }`
            )
            .pipe(map(Response => Object.assign(new VqaHistory(), Response)));
        // https://stackoverflow.com/questions/48121640/how-to-instantiate-typescript-domain-objects-from-json-that-is-returned-from-the
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    }

    getNextVqaHistory(
        datasetName: string,
        evaluationPhase: EvaluationPhase,
        currentImageName: string,
        modelType: ModelType
    ): Observable<VqaHistory> {
        return this.http
            .get<VqaHistory>(
                `${this.experimentAPIUrl}/request-next-vqa-history/${datasetName}/${EvaluationPhase[evaluationPhase]}/${currentImageName}/${
                    ModelType[modelType]
                }`
            )
            .pipe(map(Response => Object.assign(new VqaHistory(), Response)));
    }

    getRandomImage(datasetName: string, evaluationPhase: EvaluationPhase): Observable<any> {
        return this.http.get(`${this.experimentAPIUrl}/random-image/${datasetName}/${EvaluationPhase[evaluationPhase]}`, {
            responseType: 'text' as 'text'
        });
    }

    getRandomVqaHistory(datasetName: string, evaluationPhase: EvaluationPhase, modelType: ModelType): Observable<VqaHistory> {
        return this.http
            .get<VqaHistory>(
                `${this.experimentAPIUrl}/random-vqa-history/${datasetName}/${EvaluationPhase[evaluationPhase]}/${ModelType[modelType]}`
            )
            .pipe(map(Response => Object.assign(new VqaHistory(), Response)));
    }

    submitQuestionHieCoAttenVqa(question: VqaBundle): Observable<HttpResponse<VqaBundle>> {
        return this.http.post<VqaBundle>(`${this.experimentAPIUrl}/submit-question-hiecoattenvqa/`, question, { observe: 'response' });
    }

    submitQuestionFaithfulExplanation(question: VqaBundle): Observable<HttpResponse<VqaBundle>> {
        return this.http.post<VqaBundle>(`${this.experimentAPIUrl}/submit-question-faithful-explanation/`, question, {
            observe: 'response'
        });
    }

    submitQuestionFaithfulExplanationNoSeg(question: VqaBundle): Observable<HttpResponse<VqaBundle>> {
        return this.http.post<VqaBundle>(`${this.experimentAPIUrl}/submit-question-faithful-explanation-no-seg/`, question, {
            observe: 'response'
        });
    }

    create(user: XAIObj): Observable<HttpResponse<XAIObj>> {
        return this.http.post<XAIObj>(this.resourceUrl, user, { observe: 'response' });
    }

    update(user: XAIObj): Observable<HttpResponse<XAIObj>> {
        return this.http.put<XAIObj>(this.resourceUrl, user, { observe: 'response' });
    }

    find(login: string): Observable<HttpResponse<XAIObj>> {
        return this.http.get<XAIObj>(`${this.resourceUrl}/${login}`, { observe: 'response' });
    }

    query(req?: any): Observable<HttpResponse<XAIObj[]>> {
        const options = createRequestOption(req);
        return this.http.get<XAIObj[]>(this.resourceUrl, { params: options, observe: 'response' });
    }

    delete(login: string): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${login}`, { observe: 'response' });
    }

    authorities(): Observable<string[]> {
        return this.http.get<string[]>(SERVER_API_URL + 'api/users/authorities');
    }
}
