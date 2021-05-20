import { Component, HostListener, OnInit } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { Annotation, AnnotationDialogModel, BlurAnswer } from 'app/shared/model/global-explanation.model';
import { saveAs } from 'file-saver';
import { JhiEventManager } from 'ng-jhipster';
import { MessageService } from 'primeng/api';
import { Account, LoginModalService, Principal } from '../core';
import { XAIService } from '../shared/xai/xai.service';
import { BlurGameStats, BlurGameStatsfilter, BlurLevel } from './../shared/model/global-explanation.model';
import { formatDate } from '@angular/common';
// import { Pipe } from '@angular/core';
// import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
// @Pipe({ name: 'safeStyle' })
// export class SafePipe implements PipeTransform {
//     constructor(protected sanitizer: DomSanitizer) { }

//     transform(htmlString: string): any {
//         return this.sanitizer.bypassSecurityTrustHtml(htmlString);
//     }
// }
@Component({
    selector: 'jhi-blur-game-explore',
    templateUrl: './blur-game-explore.component.html',
    providers: [MessageService],
    styleUrls: ['blur-game.scss']
})
export class BlurGameExploreComponent implements OnInit {
    account: Account;
    modalRef: NgbModalRef;
    loadComplete = false;
    annotationDialogModel = new AnnotationDialogModel();
    showSegmentationMask = true;
    blurGameParams: any;
    blurLevels: BlurLevel[];
    allUniqueAnswers = [];
    filteredAnswers = [];
    filterTimeout: any;
    prevIncludedIds = [];
    showIncluded = true;
    showExcluded = false;
    showModelCorrect = true;
    showModelWrong = true;
    filteredAnnotations: Annotation[] = [];
    selectedAnswer: string;
    selectedAnswerToRemove: string;
    // componentExplanations = require('./fe_preprocessed_component_explanations.json');

    // fullblurGameStats: BlurGameStats;
    blurGameStats: BlurGameStats;
    blurGameStatsfilter = new BlurGameStatsfilter(this.filteredAnnotations);
    displayExcludedWorkers = false;
    selectedModality = '';
    modalityOptions = [
        { label: 'Blur Game - (Pilot)', value: '' },
        { label: 'Blur Game - (Answer)', value: 'answer' },
        { label: 'Blur Game - (Explanation)', value: 'explanation' },
        { label: 'Blur Game - (Component)', value: 'component' },
        { label: 'Blur Game - (Component + Mask)', value: 'component-mask' },

        // { label: 'Blur Game - (Answer + GE)', value: 'answer-ge' },
        // { label: 'Blur Game - (Explanation + GE)', value: 'explanation-ge' },
        // { label: 'Blur Game - (Component + GE)', value: 'component-ge' },
        // { label: 'Blur Game - (Component + Mask + GE)', value: 'component-mask-ge' },

        { label: 'Mental Modeling - (Pilot)', value: 'answer-mm' },
        // { label: 'Mental Modeling - (Explanation)', value: 'explanation-mm' },
        // { label: 'Mental Modeling - (Component)', value: 'component-mm' },
        // { label: 'Mental Modeling - (Component + Mask)', value: 'component-mask-mm' },

        { label: 'Mental Modeling - (Pilot + GE)', value: 'answer-mm-ge' }
        // { label: 'Mental Modeling - (Explanation + GE)', value: 'explanation-mm-ge' },
        // { label: 'Mental Modeling - (Component + GE)', value: 'component-mm-ge' },
        // { label: 'Mental Modeling - (Component + Mask + GE)', value: 'component-mask-mm-ge' },

        // { label: 'Failed: Mental Modeling - (Pilot)', value: 'answer-mm-failedv1' }
    ];

    sortOptions = [
        {
            label: 'Highest Average Blur Level',
            value: {
                command: () => {
                    this.sortByTurkerAvgCorrectBlurLevel(1);
                }
            }
        },
        {
            label: 'Lowest Average Blur Level',
            value: {
                command: () => {
                    this.sortByTurkerAvgCorrectBlurLevel(-1);
                }
            }
        },
        {
            label: 'Highest % Correct',
            value: {
                command: () => {
                    this.sortByTurkerPctCorrect(1);
                }
            }
        },
        {
            label: 'Lowest % Correct',
            value: {
                command: () => {
                    this.sortByTurkerPctCorrect(-1);
                }
            }
        },
        {
            label: 'Least # of Turker responses',
            value: {
                command: () => {
                    this.sortByTurkerResponses(-1);
                }
            }
        },
        {
            label: 'Most # of Turker responses',
            value: {
                command: () => {
                    this.sortByTurkerResponses(1);
                }
            }
        },
        {
            label: 'Lowest Model Score',
            value: {
                command: () => {
                    this.sortByModelScore(-1);
                }
            }
        },
        {
            label: 'Highest Model Score',
            value: {
                command: () => {
                    this.sortByModelScore(1);
                }
            }
        },
        {
            label: 'Sort by new',
            value: {
                command: () => {
                    // Reset filter
                    this.filteredAnnotations = this.annotationDialogModel.annotations.filter(
                        a =>
                            (a['included'] === this.showIncluded || a['excluded'] === this.showExcluded) &&
                            ((a.modelAnswer === a.topAnswer && this.showModelCorrect) ||
                                (a.modelAnswer !== a.topAnswer && this.showModelWrong))
                    );
                    this.sortByNew(1);
                }
            }
        }
    ];
    selectedSortOption = this.sortOptions[this.sortOptions.length - 1].value;
    histogramOptions = {
        // title: {
        //     display: true,
        //     text: 'Final Answer by Blur Level'
        // },
        legend: {
            position: 'top'
        },
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '# of answers'
                    }
                }
            ],
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Blur Level'
                    }
                }
            ]
        }
    };

    performanceOverTimeOptions = {
        // title: {
        //     display: true,
        //     text: 'Final Answer by Blur Level'
        // },
        legend: {
            position: 'top'
        },
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: '% Correct'
                    }
                }
            ],
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Trial #'
                    }
                }
            ]
        }
    };

    // Viz
    selectedAnnotation: Annotation;
    displayVizDetails = false;
    vizData = {
        labels: [],
        datasets: []
    };

    vizOptions = {
        // title: {
        //     display: true,
        //     text: 'Final Answer by Blur Level'
        // },
        tooltips: {
            mode: 'index',
            intersect: false
        },
        legend: {
            position: 'top'
        },
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Blur Level'
                    }
                }
            ],
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Question ID'
                    }
                }
            ]
        }
    };

    answerTable = {
        display: false,
        answers: [],
        columns: [
            { field: 'workerId', header: 'Worker Id' },
            // { field: 'assignmentId', header: 'Assignment Id' },
            // { field: 'hitId', header: 'HIT Id' },
            { field: 'ip', header: 'IP Address' },
            { field: 'qId', header: 'Question Id' },
            { field: 'modality', header: 'Modality' },
            { field: 'blurAmount', header: 'Blur Level' },
            { field: 'answer', header: 'Turker Answer' },
            { field: 'groundTruth', header: 'Ground Truth' },
            { field: 'modelAnswer', header: 'Model Answer' },
            { field: 'isCorrect', header: 'Correct' },
            { field: 'userConfidence', header: 'Turker Confidence' },
            { field: 'isFinalAnswer', header: 'isFinalAnswer' },
            { field: 'screenW', header: 'Screen Width' },
            { field: 'screenH', header: 'Screen Height' },
            { field: 'zoom', header: 'Browser Zoom Level' },
            { field: 'requestedOn', header: 'Time Question was Requested' },
            { field: 'dtEnd', header: 'Time Question was Answered' },
            { field: 'timeSpent', header: 'Time spent on this question' },
            { field: 'totalEffortTimeSpent', header: 'Total Effort Time spent on all questions' },
            { field: 'hitReward', header: 'Turker Received HIT reward' },
            { field: 'likert', header: 'Likert' },
            { field: 'oToggles', header: 'Toggle Count' },
            { field: 'feedback', header: 'Feedback' }
        ]
    };

    workerStatsTable = {
        columns: [
            { field: 'workerId', header: 'worker_id' },
            { field: 'assignmentId', header: 'assignment_id' },
            { field: 'ip', header: 'ip' },
            { field: 'startedOn', header: 'started_on' },
            { field: 'screenResolution', header: 'screen_resolution' },
            { field: 'sandbox', header: 'sandbox' },
            { field: 'adHocTextCount', header: 'adhoc_text_count' },
            { field: 'hitRewards', header: 'hit_rewards' },
            { field: 'bonusPayRounded', header: 'bonus' },
            { field: 'completedTotal', header: 'completed_total' },
            { field: 'completedCorrect', header: 'completed_correct' },
            { field: 'completedPercentCorrect', header: 'percent_correct' },
            { field: 'totalEffortTimeSpent', header: 'total_effort_time' },
            { field: 'avgEffortTimePerQuestion', header: 'effort_time_per_question' }
        ]
    };

    @HostListener('window:resize')
    onWindowResize() {
        // Not sure why, but this is needed for getBlurStyle to work correctly
    }

    constructor(
        private principal: Principal,
        private loginModalService: LoginModalService,
        private eventManager: JhiEventManager,
        private xaiService: XAIService,
        public messageService: MessageService,
        private globalExplanationService: GlobalExplanationService
    ) {
        setTimeout(() => {
            // Give the GUI/Spinner time to draw before building dataset
            this.getGlobalExplanationDataset();
        }, 400);
    }

    ngOnInit() {
        this.principal.identity().then(account => {
            this.account = account;
        });

        this.registerAuthenticationSuccess();
    }

    registerAuthenticationSuccess() {
        this.eventManager.subscribe('authenticationSuccess', message => {
            this.principal.identity().then(account => {
                this.account = account;
            });
        });
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    login() {
        this.modalRef = this.loginModalService.open();
    }

    workerStatsExportFilename() {
        return 'equas-worker-stats-' + this.selectedModality + '-' + formatDate(new Date(), 'yyyy-MM-dd', 'en');
    }

    loadBlurGameResults() {
        this.blurGameStats = undefined;
        this.blurGameStatsfilter = new BlurGameStatsfilter(this.filteredAnnotations);
        try {
            this.globalExplanationService.getBlurGameResults().subscribe(blurGameResults => {
                // this.fullblurGameStats = new BlurGameStats(blurGameResults.body, this.blurGameStatsfilter, 'ALL');
                this.blurGameStats = new BlurGameStats(
                    blurGameResults.body,
                    this.blurGameStatsfilter,
                    this.selectedModality,
                    this.blurLevels
                );
                this.updatePairBlurStats();
            });
        } catch (error) {
            console.error(error.message);
        }
    }

    // loadBlurGameResultsByModality() {
    //     this.blurGameStats = undefined;
    //     this.blurGameStatsfilter = newBlurGameStatsfilter(this.filteredAnnotations);
    //     try {
    //         this.globalExplanationService.getBlurGameResultsByModality(this.selectedModality).subscribe(blurGameResults => {
    //             this.blurGameStats = new BlurGameStats(blurGameResults.body, this.blurGameStatsfilter, this.selectedModality);
    //             this.updatePairBlurStats();
    //             this.fullblurGameStats = this.blurGameStats;
    //         });
    //     } catch (error) {
    //         console.error(error.message);
    //     }
    // }

    reBuildBlurGameStats() {
        this.blurGameStats = new BlurGameStats(
            this.blurGameStats.blurGameResults,
            this.blurGameStatsfilter,
            this.selectedModality,
            this.blurLevels
        );
        this.updatePairBlurStats();
        console.log('Top Correct Answers: ' + this.blurGameStats.completedTopCorrectAnswers);
        console.log('Top Wrong Answers: ' + this.blurGameStats.completedTopWrongAnswers);
    }

    updatePairBlurStats() {
        let allPairStats = '';
        for (const a of this.annotationDialogModel.annotations) {
            a.pairBlurStats = this.blurGameStats.getPairBlurStats(a.question_id);
            // allPairStats.push(a.pairBlurStats);
            // allPairStats += a.question_id + '\t' + a.pairBlurStats.pctCorrect() + '\n';
            // allPairStats += a.question_id + '\t' + a.question  + '\t' + a.topAnswer  + '\t' + a.modelAnswer + '\n';
            allPairStats += a.question_id + '\t' + a.pairBlurStats.allBlurLevelCount + '\t' + a.pairBlurStats.correctBlurLevelCount + '\n';
        }
        console.log(allPairStats);
        this.buildViz();
    }

    getGlobalExplanationDataset() {
        this.loadComplete = false;
        this.annotationDialogModel.selectedFilter = this.annotationDialogModel.filterOptions[1].value;
        this.globalExplanationService.getAllUniqueAnswers().subscribe(res => {
            this.allUniqueAnswers = res.body;
            this.filteredAnswers = res.body;
        });
        this.globalExplanationService.getBlurLevels().subscribe(blurLevels => {
            this.blurLevels = blurLevels.body;
        });
        this.globalExplanationService.getBlurGameParams().subscribe(blurGameParams => {
            this.blurGameParams = blurGameParams.body;
            this.globalExplanationService.getBlurGameQuestions().subscribe(response => {
                // this.annotationDialogModel.annotations = response.body.sort((a, b) =>
                //     a.topN[0].score < b.topN[0].score ? 1 : b.topN[0].score < a.topN[0].score ? -1 : 0
                // );
                // this.overrideAnnotationWithNewExplanation(response.body);
                this.annotationDialogModel.annotations = response.body;

                // const includedIds = [];
                for (const a of this.annotationDialogModel.annotations) {
                    if (this.blurGameParams.excludedQuestionIds.includes(a.question_id)) {
                        a['excluded'] = true;
                    } else {
                        a['included'] = true;
                        // includedIds.push(a.question_id);
                    }
                }
                // console.log(JSON.stringify(includedIds));
                this.filterIncluded(); // <- Automatically invokes initial sort
                this.loadBlurGameResults();
                // this.loadBlurGameResultsByModality();
                this.loadComplete = true;
            });
        });
    }
    // overrideAnnotationWithNewExplanation(oldAnnotations: Annotation[]) {
    //     let newCorrect = 0;
    //     let oldCorrect = 0;
    //     for (const oldAnnotation of oldAnnotations) {
    //         oldAnnotation['OLDmodelAnswer'] = oldAnnotation.modelAnswer;
    //         oldAnnotation['OLDexplanationHtml'] = oldAnnotation.explanationHtml;
    //         const newComponentExplanation = this.componentExplanations[oldAnnotation.question_id];
    //         if (newComponentExplanation) {
    //             if (oldAnnotation.modelAnswer === oldAnnotation.topAnswer) {
    //                 oldCorrect += 1;
    //             }
    //             if (newComponentExplanation.answer === oldAnnotation.topAnswer) {
    //                 newCorrect += 1;
    //             }
    //             if (oldAnnotation.topAnswer !== newComponentExplanation.top_turker_answer) {
    //                 console.log(
    //                     'Groundtruth differs for qid: (' +
    //                         oldAnnotation.question_id +
    //                         ')  ' +
    //                         oldAnnotation.topAnswer +
    //                         ' vs. ' +
    //                         newComponentExplanation.top_turker_answer
    //                 );
    //             }
    //             if (oldAnnotation.modelAnswer !== newComponentExplanation.answer) {
    //                 console.log(
    //                     'Model answer differs for qid: (' +
    //                         oldAnnotation.question_id +
    //                         ')  old/new ' +
    //                         oldAnnotation.modelAnswer +
    //                         ' vs. ' +
    //                         newComponentExplanation.answer +
    //                         '  GroundTruth:' +
    //                         oldAnnotation.topAnswer
    //                 );
    //             }
    //             oldAnnotation.modelAnswer = newComponentExplanation.answer;
    //             oldAnnotation.explanationHtml = newComponentExplanation.explanationHtml;
    //             oldAnnotation.topN = newComponentExplanation.top_n;
    //             // oldAnnotation.topAnswer = newComponentExplanation.top_turker_answer;
    //         }
    //     }
    //     console.log('Old Correct: ' + oldCorrect + ' vs. ' + 'New Correct: ' + newCorrect);
    // }
    sortByTurkerPctCorrect(direction: number) {
        this.filteredAnnotations.sort((a, b) => {
            const q1: number = a.pairBlurStats.pctCorrect();
            const q2: number = b.pairBlurStats.pctCorrect();
            if (q1 < q2) {
                return direction;
            } else if (q1 > q2) {
                return -direction;
            }
            return 0;
        });
    }
    sortByTurkerAvgCorrectBlurLevel(direction: number) {
        this.filteredAnnotations.sort((a, b) => {
            const q1: number = a.pairBlurStats.avgCorrectBlurLevel();
            const q2: number = b.pairBlurStats.avgCorrectBlurLevel();
            if (q1 < q2) {
                return direction;
            } else if (q1 > q2) {
                return -direction;
            }
            return 0;
        });
    }
    sortByTurkerResponses(direction: number) {
        this.filteredAnnotations.sort((a, b) => {
            const q1: BlurAnswer[] = this.blurGameStats.getFinalAnswersByQid(a.question_id);
            const q2: BlurAnswer[] = this.blurGameStats.getFinalAnswersByQid(b.question_id);
            if (q1.length < q2.length) {
                return direction;
            } else if (q1.length > q2.length) {
                return -direction;
            }
            return 0;
        });
    }
    sortByModelScore(direction: number) {
        this.filteredAnnotations.sort((a, b) =>
            a.topN[0].score < b.topN[0].score ? direction : b.topN[0].score < a.topN[0].score ? -direction : 0
        );
    }

    sortByNew(direction: number) {
        if (this.prevIncludedIds.length === 0) {
            for (const a of this.filteredAnnotations) {
                if (!this.blurGameParams.excludedQuestionIds.includes(a.question_id)) {
                    if (!this.prevIncludedIds.includes(a.question_id)) {
                        this.prevIncludedIds.push(a.question_id);
                    }
                }
            }
        } else {
            for (const a of this.filteredAnnotations) {
                if (!this.blurGameParams.excludedQuestionIds.includes(a.question_id)) {
                    if (!this.prevIncludedIds.includes(a.question_id)) {
                        this.prevIncludedIds.splice(0, 0, a.question_id);
                    }
                }
            }
        }

        this.filteredAnnotations.sort((a, b) => {
            return this.prevIncludedIds.indexOf(a.question_id) - this.prevIncludedIds.indexOf(b.question_id);
        });
        console.log(JSON.stringify(this.prevIncludedIds));
    }

    isExcluded(questionId: number) {
        return this.blurGameParams.excludedQuestionIds.includes(questionId);
    }

    includeQuestionId(questionId: number) {
        this.blurGameParams.excludedQuestionIds = this.blurGameParams.excludedQuestionIds.filter(id => id !== questionId);
        this.saveParams();
    }

    excludeQuestionId(questionId: number) {
        if (!this.blurGameParams.excludedQuestionIds.includes(questionId)) {
            this.blurGameParams.excludedQuestionIds.push(questionId);
            this.saveParams();
        }
    }

    saveParams() {
        this.globalExplanationService.saveBlurGameParams(this.blurGameParams).subscribe(response => {});
    }
    saveParamsAndRefresh() {
        this.globalExplanationService.saveBlurGameParams(this.blurGameParams).subscribe(response => {
            this.getGlobalExplanationDataset();
        });
    }

    filterAnswers(event) {
        this.filteredAnswers = [];
        for (const answerOption of this.allUniqueAnswers) {
            if (this.filteredAnswers.length >= 75) {
                break; // Limit the size of the dropdown list
            }
            if (answerOption.toLowerCase().indexOf(event.query.toLowerCase()) === 0) {
                this.filteredAnswers.push(answerOption);
            }
        }
    }

    filterIncluded() {
        this.filteredAnnotations = this.annotationDialogModel.annotations.filter(
            a =>
                (a['included'] === this.showIncluded || a['excluded'] === this.showExcluded) &&
                ((a.modelAnswer === a.topAnswer && this.showModelCorrect) || (a.modelAnswer !== a.topAnswer && this.showModelWrong))
        );
        this.selectedSortOption.command(); // Re-apply selected sort
    }

    displayAnswerTableForWorker(workerId) {
        this.answerTable.answers = this.blurGameStats.allAnswersByWorkerId[workerId];
        this.answerTable.display = true;
    }

    displayAnswerTableByQid(qId) {
        this.answerTable.answers = this.blurGameStats.allAnswersByQid[qId];
        this.answerTable.display = true;
    }

    displayFinalAnswerTableByQid(qId) {
        this.answerTable.answers = this.blurGameStats.finalAnswersByQid[qId];
        this.answerTable.display = true;
    }

    displayAnswerTableForWorkerByQid(qId, workerId) {
        this.answerTable.answers = this.blurGameStats.allAnswersByQidWorkerId[qId + workerId];
        this.answerTable.display = true;
    }

    displayAnswerTableForFinalAnswers() {
        this.answerTable.answers = [];
        const keys = Object.keys(this.blurGameStats.finalAnswersByQid);
        for (const qId of keys) {
            Array.prototype.push.apply(this.answerTable.answers, this.blurGameStats.finalAnswersByQid[qId]);
        }
        this.answerTable.display = true;
    }
    displayAnswerTableForAllGuesses() {
        this.answerTable.answers = [];
        const keys = Object.keys(this.blurGameStats.allAnswersByQid);
        for (const qId of keys) {
            Array.prototype.push.apply(this.answerTable.answers, this.blurGameStats.allAnswersByQid[qId]);
        }
        this.answerTable.display = true;
    }
    excludeWorker(workerId: string) {
        if (!this.blurGameStatsfilter.excludedWorkerIds.includes(workerId)) {
            this.blurGameStatsfilter.excludedWorkerIds.push(workerId);
            this.reBuildBlurGameStats();
        }
    }
    public filterWorkers() {
        for (const worker of this.blurGameStats.workerStats) {
            if (
                worker.completedTotal < this.blurGameStatsfilter.minCompletedQuestions ||
                worker.avgGuessesPerQuestion < this.blurGameStatsfilter.minAvgGuessesPerQuestion ||
                worker.avgEffortTimePerQuestion < this.blurGameStatsfilter.avgEffortTimePerQuestion ||
                worker.completedPercentCorrect < this.blurGameStatsfilter.minPercentCorrect / 100
            ) {
                if (!this.blurGameStatsfilter.excludedWorkerIds.includes(worker.workerId)) {
                    this.blurGameStatsfilter.excludedWorkerIds.push(worker.workerId);
                }
            }
        }
    }
    applyFilter() {
        this.blurGameStats.filter.excludedWorkerIds = [];
        this.reBuildBlurGameStats();
        this.filterWorkers();
        this.reBuildBlurGameStats();

        console.log(JSON.stringify(this.blurGameStatsfilter));
    }
    clearFilter() {
        this.blurGameStatsfilter = new BlurGameStatsfilter(this.filteredAnnotations);
        this.reBuildBlurGameStats();
    }
    sortChanged(event) {
        this.selectedSortOption.command();
    }

    saveBlurLevels(useAvgFirstCorrectGuessBlurLevel: boolean, useMedian: boolean) {
        const blurLevels: BlurLevel[] = [];
        let fixThese = '';
        for (const a of this.annotationDialogModel.annotations) {
            if (a['included']) {
                const newBlurLevel = new BlurLevel();
                newBlurLevel.qId = a.question_id;
                if (useAvgFirstCorrectGuessBlurLevel || a.topAnswer === 'yes' || a.topAnswer === 'no') {
                    if (useMedian) {
                        newBlurLevel.blurLevel = Math.ceil(a.pairBlurStats.medianFirstCorrectGuessBlurLevel());
                    } else {
                        newBlurLevel.blurLevel = Math.ceil(a.pairBlurStats.avgFirstCorrectGuessBlurLevel());
                    }
                } else {
                    if (useMedian) {
                        newBlurLevel.blurLevel = Math.ceil(a.pairBlurStats.medianCorrectGuessBlurLevel());
                    } else {
                        newBlurLevel.blurLevel = Math.ceil(a.pairBlurStats.avgCorrectBlurLevel());
                    }
                }
                console.log(newBlurLevel.qId + '\t' + newBlurLevel.blurLevel);
                if (newBlurLevel.blurLevel <= 30) {
                    fixThese += a.question_id + ', ';
                }
                blurLevels.push(newBlurLevel);
            }
        }
        if (fixThese) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning! These questions have a blur level that falls below the designated threshold.',
                detail: fixThese
            });
        }
        this.globalExplanationService.saveBlurLevels(blurLevels).subscribe(response => {
            const condition = useAvgFirstCorrectGuessBlurLevel ? 'FIRST' : 'FINAL';
            const median = useMedian ? 'MEDIAN' : 'AVERAGE';
            this.messageService.add({
                severity: 'success',
                summary: 'Blur Levels Saved',
                detail: median + ' correct ' + condition + ' guess'
            });
        });
    }

    json2Csv(jsonArray: any[]) {
        const items = jsonArray;
        const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
        const header = Object.keys(items[0]);
        const csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
        csv.unshift(header.join(','));
        const csvOutput = csv.join('\r\n');
        return csvOutput;
    }

    exportStats() {
        const results = [];
        for (const a of this.annotationDialogModel.annotations) {
            if (a['included']) {
                results.push({
                    qId: a.question_id,
                    avgCorrectBlurLevel: a.pairBlurStats.avgCorrectBlurLevel(),
                    avgFirstCorrectGuessBlurLevel: a.pairBlurStats.avgFirstCorrectGuessBlurLevel(),
                    avgAllBlurLevel: a.pairBlurStats.avgAllBlurLevel(),
                    pctCorrect: a.pairBlurStats.pctCorrect(),
                    isYesNo: this.isYesNo(a.topAnswer)
                });
            }
        }
        // const newWindow = window.open('', 'json_output', 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no');
        // newWindow.document.write('<html><body><pre>' + this.json2Csv(results) + '</pre></body></html>');
        // newWindow.document.write('<html><body><pre>' + JSON.stringify(results, null, 2) + '</pre></body></html>');
        saveAs(new Blob([this.json2Csv(results)], { type: 'text' }), 'image-question-blur-stats.csv');
    }

    buildViz() {
        const tempVizData = {
            labels: [],
            datasets: [
                {
                    label: 'Median Blur Level (Correct first guess)',
                    fill: '+1', // https://www.chartjs.org/samples/latest/charts/area/line-datasets.html
                    // backgroundColor: 'rgb(54, 162, 235, .5)',
                    borderColor: 'rgb(54, 162, 235)',
                    // showLine: false,
                    data: []
                },
                {
                    label: 'Median Blur Level (Correct final answers)',
                    fill: false,
                    borderColor: '#7CB342',
                    // showLine: false,
                    data: []
                },
                {
                    label: 'Blur Delta',
                    fill: true,
                    borderColor: 'purple',
                    // showLine: false,
                    data: []
                },
                {
                    label: '% Correct',
                    fill: false,
                    borderColor: 'orange',
                    // showLine: false,
                    data: []
                }
                // {
                //     label: 'Is Yes/No',
                //     fill: false,
                //     borderColor: 'red',
                //     // showLine: false,
                //     data: []
                // }
            ]
        };
        const results = [];
        for (const a of this.annotationDialogModel.annotations) {
            if (a['included']) {
                results.push({
                    qId: a.question_id,
                    avgCorrectBlurLevel: Math.round(a.pairBlurStats.avgCorrectBlurLevel()),
                    medianCorrectGuessBlurLevel: Math.round(a.pairBlurStats.medianCorrectGuessBlurLevel()),
                    avgFirstCorrectGuessBlurLevel: Math.round(a.pairBlurStats.avgFirstCorrectGuessBlurLevel()),
                    medianFirstCorrectGuessBlurLevel: Math.round(a.pairBlurStats.medianFirstCorrectGuessBlurLevel()),
                    avgAllBlurLevel: Math.round(a.pairBlurStats.avgAllBlurLevel()),
                    pctCorrect: Math.round(a.pairBlurStats.pctCorrect() * 100),
                    blurDeltaAverage: Math.abs(Math.round(a.pairBlurStats.blurDeltaAverage())),
                    blurDeltaMedian: Math.abs(Math.round(a.pairBlurStats.blurDeltaMedian())),
                    isYesNo: this.isYesNo(a.topAnswer)
                });
            }
        }
        // // sort by yes/no answers
        // results.sort((a, b) => {
        //     if (a.isYesNo && !b.isYesNo) {
        //         return -1;
        //     } else if (!a.isYesNo && b.isYesNo) {
        //         return 1;
        //     }
        //     return 0;
        // });
        // sort by percent correct
        results.sort((a, b) => {
            if (a.pctCorrect < b.pctCorrect) {
                return 1;
            } else if (a.pctCorrect > b.pctCorrect) {
                return -1;
            }
            return 0;
        });

        // // sort by avgCorrectBlurLevel
        //  results.sort((a, b) => {
        //     if (a.avgCorrectBlurLevel < b.avgCorrectBlurLevel) {
        //         return 1;
        //     } else if (a.avgCorrectBlurLevel > b.avgCorrectBlurLevel) {
        //         return -1;
        //     }
        //     return 0;
        // });

        //  // sort by delta
        //  results.sort((a, b) => {
        //     if (a.blurDelta < b.blurDelta) {
        //         return 1;
        //     } else if (a.blurDelta > b.blurDelta) {
        //         return -1;
        //     }
        //     return 0;
        // });

        for (const q of results) {
            tempVizData.labels.push(q.qId);
            // tempVizData.datasets[0].data.push(q.avgFirstCorrectGuessBlurLevel);
            tempVizData.datasets[0].data.push(q.medianFirstCorrectGuessBlurLevel);
            // tempVizData.datasets[1].data.push(q.avgCorrectBlurLevel);
            tempVizData.datasets[1].data.push(q.medianCorrectGuessBlurLevel);
            // tempVizData.datasets[2].data.push(q.blurDeltaAverage);
            tempVizData.datasets[2].data.push(q.blurDeltaMedian);
            tempVizData.datasets[3].data.push(q.pctCorrect);
            // if (q.isYesNo) {
            //     tempVizData.datasets[4].data.push(100);
            // } else {
            //     tempVizData.datasets[4].data.push(0);
            // }
        }
        this.vizData = tempVizData;
    }
    isYesNo(answer: string) {
        if (answer === 'yes' || answer === 'no') {
            return true;
        }
        return false;
    }
    selectVizData(event) {
        this.selectedAnnotation = undefined;
        const selectedQid = this.vizData.labels[event.element._index];
        console.log(selectedQid);
        this.selectedAnnotation = this.annotationDialogModel.annotations.find(annotation => annotation.question_id === selectedQid);
        if (this.selectedAnnotation) {
            this.displayVizDetails = true;
        } else {
            console.log('Unable to find qId: ' + selectedQid);
        }
    }

    getRgb(component) {
        return 'rgb(' + component.rgb[0] + ',' + component.rgb[1] + ',' + component.rgb[2] + ')';
    }

    isNoModality() {
        return this.selectedModality === '';
    }
    isAnswerModality() {
        return this.selectedModality === 'answer';
    }

    isExplanationModality() {
        return this.selectedModality === 'explanation';
    }

    isComponentModality() {
        return this.selectedModality === 'component';
    }

    isComponentMaskModality() {
        return this.selectedModality === 'component-mask';
    }

    getColorForAdHocFilter(count: number): string {
        if (count > 0) {
            return '#FF3C38';
        }
        return '';
    }
    getFirstLikertAnswer(likertResponse: string) {
        if (likertResponse !== undefined && likertResponse !== null) {
            const questions = likertResponse.split('_');
            if (questions.length > 0) {
                const satisfaction = questions[0].split('-');
                if (satisfaction.length > 1) {
                    return satisfaction[1];
                }
            }
        }
        return 'n/a';
    }
}
