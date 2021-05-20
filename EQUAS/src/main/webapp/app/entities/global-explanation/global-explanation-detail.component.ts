import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalExplanationService } from './global-explanation.service';
import { Annotation, VqaPlaygroundDialogModel } from 'app/shared/model/global-explanation.model';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { VqaBundle } from 'app/shared/xai/xai.model';
import { v4 as uuid } from 'uuid';
import { MessageService } from 'primeng/api';
import { XAIService } from 'app/shared/xai/xai.service';

@Component({
    selector: 'jhi-global-explanation-detail',
    templateUrl: './global-explanation-detail.component.html',
    providers: [MessageService]
})
export class GlobalExplanationDetailComponent implements OnInit, OnDestroy {
    @Input() questionId = '';
    @Input() autoSearch = false;
    tabIndex = 0;
    selectedAnnotation: Annotation;
    showSegmentationMask = true;
    similarCases: VqaBundle[] = [];
    bulkProgressCount = 0;
    isSearching = false;
    rejectedAlternatives: VqaBundle[] = [];
    answersOfInterest: string[] = [];
    vqaPlaygroundDialogModel = new VqaPlaygroundDialogModel();
    filter = 'all';

    constructor(
        private activatedRoute: ActivatedRoute,
        private globalExplanationService: GlobalExplanationService,
        private xaiService: XAIService,
        public messageService: MessageService
    ) {}

    handleChange(e) {
        this.tabIndex = e.index;
    }

    loadAll() {
        if (this.questionId === '') {
            // Id was NOT piped in via template. Check URL
            this.questionId = this.activatedRoute.snapshot.params['id'] ? this.activatedRoute.snapshot.params['id'] : '';
        }

        if (this.questionId !== '') {
            this.globalExplanationService.getAnnotationById(this.questionId).subscribe(
                (res: HttpResponse<Annotation>) => {
                    this.selectedAnnotation = res.body;
                    this.getSimilarImages(this.selectedAnnotation.imageName);
                },
                (res: HttpErrorResponse) => {}
            );
        }
    }

    ngOnInit() {
        this.loadAll();
    }

    ngOnDestroy() {
        this.isSearching = false;
    }

    getCocoImageUrl(id: string) {
        return 'evaluation_dataset/v2_coco/training/images/' + id + '.jpg';
    }
    getSimilarImages(imageName: string) {
        this.globalExplanationService.getSimilarImages(imageName).then(
            response => {
                this.similarCases = response;
                if (this.autoSearch) {
                    this.tabIndex = 2; // Select rejected alternative tab
                    this.bulkSubmit(this.selectedAnnotation);
                }
            },
            error => {
                this.similarCases.length = 0;
            }
        );
    }
    getAnswerOfIntrestStyle(answer: string) {
        if (this.answersOfInterest.indexOf(answer) !== -1) {
            return 'bold';
        }
        return '';
    }

    async bulkSubmit(vqaBundle: Annotation) {
        const question = vqaBundle.question.trim();
        const answerOfInterest1 = vqaBundle.topN[0].answer;
        const answerOfInterest2 = vqaBundle.topN[1].answer;
        this.answersOfInterest.length = 0;
        this.answersOfInterest.push(answerOfInterest1, answerOfInterest2);
        this.isSearching = true;
        for (let i = this.bulkProgressCount; i < this.similarCases.length; i++) {
            const vqabundle = this.similarCases[i];
            if (!this.isSearching) {
                return;
            } else {
                if (question === '') {
                    this.messageService.add({ severity: 'warn', summary: 'Enter a question', detail: '' });
                    return;
                } else {
                    vqabundle.id = uuid();
                    vqabundle.question = question;
                    vqabundle.imgUri = this.getCocoImageUrl(vqabundle.img);
                    vqabundle.groundTruth = '';
                    await this.xaiService
                        .submitQuestionFaithfulExplanation(vqabundle)
                        .toPromise()
                        .then(response => {
                            this.bulkProgressCount += 1;
                            const index = this.similarCases.indexOf(vqabundle);
                            this.similarCases[index].answer = response.body.answer;
                            this.similarCases[index].explanation = response.body.explanation;
                            this.similarCases[index].topN = response.body.topN;

                            let answerOfInterestScore1 = -999;
                            let answerOfInterestScore2 = -999;
                            const foundAnswerOfInterest1 = response.body.topN.find(an => {
                                if (an.answer === answerOfInterest1) {
                                    answerOfInterestScore1 = an.score;
                                    return true;
                                }
                            });
                            const foundAnswerOfInterest2 = response.body.topN.find(an => {
                                if (an.answer === answerOfInterest2) {
                                    answerOfInterestScore2 = an.score;
                                    return true;
                                }
                            });
                            if (foundAnswerOfInterest1 && foundAnswerOfInterest2) {
                                response.body.topRejectedScoreDelta = Math.abs(answerOfInterestScore1 - answerOfInterestScore2);
                                response.body.topRejectedScore = Math.max(answerOfInterestScore1, answerOfInterestScore2);
                                // Rejected Alternative found
                                if (response.body.topRejectedScore > 0) {
                                    this.rejectedAlternatives.push(response.body);
                                    this.rejectedAlternatives.sort((a, b) => {
                                        if (a.answer && b.answer) {
                                            if (b.topRejectedScoreDelta < a.topRejectedScoreDelta) {
                                                return 1;
                                            } else {
                                                return -1;
                                            }
                                        }
                                        return 0;
                                    });
                                }
                            }
                        });
                }
            }
        }
        this.isSearching = false;
    }
}
