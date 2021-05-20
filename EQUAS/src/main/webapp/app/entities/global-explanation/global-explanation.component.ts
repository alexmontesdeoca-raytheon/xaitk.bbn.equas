import {
    QuestionStat,
    Annotation,
    QuestionTableItem,
    QuestionTableDialogModel,
    AnnotationDialogModel,
    TaskLog,
    TaskEntry,
    VqaPlaygroundDialogModel,
    GlobalExplanationFilter
} from './../../shared/model/global-explanation.model';
import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';

import { IGlobalExplanation, GlobalExplanationDataset } from '../../shared/model/global-explanation.model';
import { Principal } from 'app/core';
import { GlobalExplanationService } from './global-explanation.service';

import { JSONP_ERR_WRONG_RESPONSE_TYPE } from '@angular/common/http/src/jsonp';
import { SunburstGraph } from '../../shared/xai/xai.sunburst.graph';
import { TreeNode, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { AnswerScore } from 'app/shared/xai/xai.model';
import { Router, ActivatedRoute, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import * as d3 from 'd3';

// declare var d3: any;
@Component({
    selector: 'jhi-global-explanation',
    templateUrl: './global-explanation.component.html',
    providers: [MessageService]
})
export class GlobalExplanationComponent implements OnInit, OnDestroy {
    @Input() focusOnQuestion: string;
    @Input() focusOnAnswer: string;
    @Input() activeTabIndex: number;
    routeData: any;
    subscription: Subscription;
    filter = 'all';
    filterParams = new GlobalExplanationFilter();
    topNresults = 500;

    globalExplanations: IGlobalExplanation[];
    currentAccount: any;
    eventSubscriber: Subscription;
    sunburstGraph: SunburstGraph;
    showSegmentationMask = true;

    showTopAnswersGraph = false;
    topAnswerChartData: any;
    topAnswerChartWidth = 2000;
    topAnswerChartOptions: any;

    chartPieAnswers: any;
    chartPieConsensus: any;
    chartConsensusVsTop5: any;

    // Viz
    leafNodeText = '.';
    totalNumberOfQuestions;
    annotationCSV: any;
    answerFilterText = '';
    answerFilterMatchMode = 'contains'; // Filtering matchmode is not implemented on the dataview control
    matchModeOptions = [
        { label: 'Starts with', value: 'startsWith' },
        { label: 'Contains', value: 'contains' },
        { label: 'Equals', value: 'equals' },
        { label: 'Ends With', value: 'endsWith' }
    ];

    globalExplanationDataset = new GlobalExplanationDataset();

    @ViewChild('topQuestionsTable') topQuestionsTable: Table;
    @ViewChild('topAnswersTable') topAnswersTable: Table;
    @ViewChild('topModelAnswersTable') topModelAnswersTable: Table;
    questionFilterTimeout: any;

    vqaPlaygroundDialogModel = new VqaPlaygroundDialogModel();
    questionTableDialogModel = new QuestionTableDialogModel();
    annotationDialogModel = new AnnotationDialogModel();

    // questionTableFiltered = [];
    // questionDetail: QuestionStat;
    showWaitSpinner = false;
    showRightSidebar = false;
    showTopQuestions = false;
    // showTopQuestionsGrid = false;
    showTopAnswersGrid = false;
    loadComplete = false;
    isSunburstInitialized = false;
    showTreeView = false;

    questionTableExportFilename = 'EQUAS Global Explanation - Questions';
    questionTableCols = [
        // Column collection is required for export to CSV
        { field: 'question', header: 'Question' },
        { field: 'count', header: '# of images with this question' },
        { field: 'totalAnswerCount', header: 'Answers Total' },
        { field: 'uniqueTurkerAnswerCount', header: 'Unique Turker Answers' },
        { field: 'uniqueModelAnswerCount', header: 'Unique Model Answers' },
        { field: 'correctCount', header: '# Correct' },
        { field: 'correctCountPercent', header: '% Correct' },

        { field: 'topTurkerAnswer1', header: '#1 by Turkers' },
        { field: 'topTurkerAnswer1Count', header: '#1 by Turker Count' },
        { field: 'topModelAnswer1', header: '#1 by Model' },
        { field: 'topModelAnswer1Count', header: '#1 by Model Count' },

        { field: 'topTurkerAnswer2', header: '#2 by Turkers' },
        { field: 'topTurkerAnswer2Count', header: '#2 by Turker Count' },
        { field: 'topModelAnswer2', header: '#2 by Model' },
        { field: 'topModelAnswer2Count', header: '#2 by Model Count' },

        { field: 'topTurkerAnswer3', header: '#3 by Turkers' },
        { field: 'topTurkerAnswer3Count', header: '#3 by Turker Count' },
        { field: 'topModelAnswer3', header: '#3 by Model' },
        { field: 'topModelAnswer3Count', header: '#3 by Model Count' },

        { field: 'topTurkerAnswer4', header: '#4 by Turkers' },
        { field: 'topTurkerAnswer4Count', header: '#4 by Turker Count' },
        { field: 'topModelAnswer4', header: '#4 by Model' },
        { field: 'topModelAnswer4Count', header: '#4 by Model Count' },

        { field: 'topTurkerAnswer5', header: '#5 by Turkers' },
        { field: 'topTurkerAnswer5Count', header: '#5 by Turker Count' },
        { field: 'topModelAnswer5', header: '#5 by Model' },
        { field: 'topModelAnswer5Count', header: '#5 by Model Count' }
    ];

    answercols = [
        { field: 'answer', header: 'Answer' },
        { field: 'imageCount', header: '# of questions with this answer' },
        { field: 'count', header: '# of unique questions with this answer' }
    ];

    // Autocomplete
    filteredQuestions: any[];

    constructor(
        private activateRoute: ActivatedRoute,
        private globalExplanationService: GlobalExplanationService,
        private jhiAlertService: JhiAlertService,
        private eventManager: JhiEventManager,
        private principal: Principal,
        private messageService: MessageService,
        public route: ActivatedRoute,
        private router: Router
    ) {
        // this.routeData = this.activatedRoute.data.subscribe(data => {
        //     data.
        // });

        this.resetCharts();
        this.activateRoute.params.subscribe(params => {
            const paramfilter = params['filter'];
            if (paramfilter !== undefined) {
                this.filter = paramfilter;
            }
            setTimeout(() => {
                // Give the GUI/Spinner time to draw before building dataset
                this.getGlobalExplanationDataset();
            }, 400);
        });
    }

    loadAll() {
        console.log('Global Explanation - Load All');
    }

    getColor(value) {
        // https://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage
        // value from 0 to 1
        const hue = (value * 120).toString(10);
        return ['hsl(', hue, ',80%,50%)'].join('');
    }
    resetTables() {
        this.topQuestionsTable.reset();
        this.topAnswersTable.reset();
        this.topModelAnswersTable.reset();
    }
    resetCharts() {
        // this.isSunburstInitialized = false;
        this.topAnswerChartOptions = {
            title: {
                display: false,
                text: '',
                fontSize: 16
            },
            legend: {
                display: true,
                position: 'left',
                labels: {
                    // This more specific font property overrides the global property
                    fontColor: 'black',
                    fontSize: 18
                }
            },
            scales: {
                xAxes: [
                    {
                        ticks: {
                            autoSkip: false,
                            fontColor: 'black',
                            fontSize: 18
                            // maxTicksLimit: 20
                        }
                    }
                ],
                yAxes: [
                    {
                        ticks: {
                            fontColor: 'black',
                            fontSize: 18
                        }
                    }
                ]
            }
        };

        this.chartPieAnswers = {
            data: {
                labels: [
                    '#1 Answer Correct',
                    '#2 Answer Correct',
                    '#3 Answer Correct',
                    '#4 Answer Correct',
                    '#5 Answer Correct',
                    'Ground truth not in top 5'
                ],
                datasets: [
                    {
                        label: '',
                        data: [],
                        backgroundColor: ['#548235', '#4472C4', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', '#C00000'],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: false,
                title: {
                    display: true,
                    text: 'Questions where ground truth is in the top 5 model answers'
                },
                legend: {
                    position: 'left'
                },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const meta = dataset._meta[Object.keys(dataset._meta)[0]];
                            const total = meta.total;
                            const currentValue = dataset.data[tooltipItem.index];
                            const percentage = parseFloat(((currentValue / total) * 100).toFixed(1));
                            return currentValue + ' (' + percentage + '%)';
                        },
                        title: (tooltipItem, data) => {
                            return data.labels[tooltipItem[0].index];
                        }
                    }
                }
            }
        };

        this.chartPieConsensus = {
            data: {
                labels: [],
                datasets: [
                    {
                        label: '',
                        data: [],
                        backgroundColor: [],
                        fill: false
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Turker Consensus for all questions'
                },
                legend: {
                    position: 'left'
                },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const meta = dataset._meta[Object.keys(dataset._meta)[0]];
                            const total = meta.total;
                            const currentValue = dataset.data[tooltipItem.index];
                            const percentage = parseFloat(((currentValue / total) * 100).toFixed(1));
                            return currentValue + ' (' + percentage + '%)';
                        },
                        title: (tooltipItem, data) => {
                            return data.labels[tooltipItem[0].index];
                        }
                    }
                }
            }
        };

        this.chartConsensusVsTop5 = {
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Turker agreement on ground truth',
                        data: [],
                        backgroundColor: [],
                        fill: false,
                        borderColor: '#36a2eb'
                    },
                    {
                        label: 'Ground truth found in top 5 model answers',
                        data: [],
                        backgroundColor: [],
                        fill: false,
                        borderColor: '#F26E1D'
                    },
                    {
                        label: 'Ground truth found in top 1 model answers',
                        data: [],
                        backgroundColor: [],
                        fill: false,
                        borderColor: '#548235'
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Turker Consensus vs. In top 5'
                },
                legend: {
                    position: 'bottom'
                },
                scales: {
                    // yAxes: [{
                    //     scaleLabel: {
                    //       display: true,
                    //       labelString: 'Turker Consensus'
                    //     }
                    //   }],
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Turker Consensus'
                            }
                        }
                    ]
                }
            }
        };
    }

    typeCast(val: any) {
        if (val.toString().toLowerCase() === 'true') {
            return true;
        } else if (val.toString().toLowerCase() === 'false') {
            return false;
        }
        return val;
    }

    getGlobalExplanationDataset() {
        console.log('Get Global Explanation - ' + this.filter);
        this.loadComplete = false;
        this.filterParams = this.currentFilter(); // Update GE filter params from query string
        this.globalExplanationService
            .getGlobalExplanationDataset(
                this.globalExplanationService.defaultDataset,
                this.globalExplanationService.defaultPhase,
                this.filter,
                this.filterParams
            )
            .then(globalExplanationDataset => {
                this.globalExplanationDataset = globalExplanationDataset;
                this.resetCharts();
                // Reset filters
                this.globalExplanationDataset.questionTableModel.questionFilter = '';
                this.globalExplanationDataset.questionTableModel.countFilter = 0;
                this.globalExplanationDataset.questionTableModel.uniqueTurkerAnswerCountFilter = 0;
                this.answerFilterText = '';
                this.globalExplanationDataset.log.startTask('Client - Build Sunburst Graph');
                this.globalExplanationDataset.log.endTask();
                let top5CorrectCount = 0;
                for (let index = 0; index <= 4; index++) {
                    const correctCount = globalExplanationDataset.statistics.modelAnswersCorrectByIndex[index];
                    top5CorrectCount += correctCount;
                    this.chartPieAnswers.data.datasets[0].data.push(correctCount);
                }
                this.chartPieAnswers.data.datasets[0].data.push(globalExplanationDataset.statistics.questionsTotal - top5CorrectCount); // Not in top 5

                for (const key of Object.keys(globalExplanationDataset.statistics.turkerConsensus)
                    .sort()
                    .reverse()) {
                    this.chartPieConsensus.data.labels.push(parseFloat(key) * 100 + '%');
                    this.chartPieConsensus.data.datasets[0].data.push(globalExplanationDataset.statistics.turkerConsensus[key]);
                    this.chartPieConsensus.data.datasets[0].backgroundColor.push(this.getColor(key));
                }

                for (const key of Object.keys(globalExplanationDataset.statistics.turkerConsensusInTop5)
                    .sort()
                    .reverse()) {
                    this.chartConsensusVsTop5.data.labels.push(parseFloat(key) * 100 + '%');
                    this.chartConsensusVsTop5.data.datasets[0].data.push(globalExplanationDataset.statistics.turkerConsensus[key]);
                    this.chartConsensusVsTop5.data.datasets[1].data.push(globalExplanationDataset.statistics.turkerConsensusInTop5[key]);
                    this.chartConsensusVsTop5.data.datasets[2].data.push(globalExplanationDataset.statistics.turkerConsensusInTop1[key]);
                    // this.chartConsensusVsTop5.data.datasets[0].backgroundColor.push(this.getColor(key));
                }

                if (this.focusOnQuestion || this.focusOnAnswer) {
                    this.globalExplanationDataset.questionTableModel.questionFilter = this.focusOnQuestion
                        .toLowerCase()
                        .replace(',', '')
                        .replace('?', '')
                        .trim();
                    this.topQuestionsTable.filter(
                        this.globalExplanationDataset.questionTableModel.questionFilter,
                        'question',
                        this.globalExplanationDataset.questionTableModel.questionFilterMatchMode
                    );
                    this.answerFilterText = this.focusOnAnswer
                        .toLowerCase()
                        .replace(',', '')
                        .replace('?', '')
                        .trim();
                    this.filterAnswers(this.answerFilterText);
                }
                this.loadComplete = true;
                this.resetTables();
            })
            .catch(error => {
                console.log(error.message);
                this.messageService.add({ severity: 'error', summary: 'Error Message', detail: error.message });
            });
    }

    tabChanged(e) {
        if (e.index === 4 && !this.isSunburstInitialized) {
            // Sunburst Tab
            this.initializeSunburst();
        }
    }

    initializeSunburst() {
        this.loadComplete = false;
        setTimeout(() => {
            this.globalExplanationDataset.log.startTask('Client - Build Sunburst Graph');
            this.sunburstGraph = new SunburstGraph(this.globalExplanationDataset.questionCsv);
            (<HTMLInputElement>(
                document.getElementById('sunburstFilterText')
            )).value = this.globalExplanationDataset.questionTableModel.questionFilter;
            // if (this.globalExplanationDataset.questionTableModel.questionFilter !== '') {
            this.sunburstGraph.searchInputChange(this.globalExplanationDataset.questionTableModel.questionFilter + ' ');
            // }
            this.globalExplanationDataset.log.endTask();
            this.isSunburstInitialized = true;
            this.loadComplete = true;
        }, 200);
    }

    filterQuestions() {
        // this.sunburstGraph.searchInputChange(this.globalExplanationDataset.questionTableModel.questionFilter);
        // const maxResults = 25;
        // this.filteredQuestions = [];
        // for (let i = 0; i < this.globalExplanationDataset.annotationCsvArray.length; i++) {
        //     const question = this.globalExplanationDataset.annotationCsvArray[i][0];
        //     if (question.toLowerCase().indexOf(this.questionText.toLowerCase()) === 0) {
        //         this.filteredQuestions.push(question);
        //         if (this.filteredQuestions.length >= maxResults) {
        //             return;
        //         }
        //     }
        // }
    }

    filterAnswers(filterText: string) {
        this.topAnswersTable.filter(this.answerFilterText, 'answer', this.answerFilterMatchMode);
        this.topModelAnswersTable.filter(this.answerFilterText, 'answer', this.answerFilterMatchMode);
    }

    sortByRejectedAlternatives(annotations: Annotation[]) {
        const sortedAnnotations = annotations.sort((a, b) => {
            const a_delta1_2 = a.topN[0].score - a.topN[1].score;
            const b_delta1_2 = b.topN[0].score - b.topN[1].score;

            const a_delta2_3 = a.topN[1].score - a.topN[2].score;
            const b_delta2_3 = b.topN[1].score - b.topN[2].score;

            const a_delta3_4 = a.topN[2].score - a.topN[3].score;
            const b_delta3_4 = b.topN[2].score - b.topN[3].score;

            const a_slope1_2 = a_delta1_2 - a_delta2_3;
            const b_slope1_2 = b_delta1_2 - b_delta2_3;
            if (a_slope1_2 > b_slope1_2) {
                return 1;
            } else if (a_slope1_2 < b_slope1_2) {
                return -1;
            }
            return 0;
        });
        // let min1 = 9999;
        // let max1 = -9999;
        // let min2 = 9999;
        // let max2 = -9999;

        // const sortedAnnotations = annotations.sort((a, b) => {
        //     const a1 = a.topN[0].score;
        //     const b1 = b.topN[0].score;
        //     const a2 = a.topN[1].score;
        //     const b2 = b.topN[1].score;

        //     min1 = Math.min(a1, b1, min1);
        //     max1 = Math.max(a1, b1, max1);
        //     min2 = Math.min(a2, b2, min2);
        //     max2 = Math.max(a2, b2, max2);

        //     if (a1 === b1) {
        //         return (a2 > b2) ? -1 : (a2 < b2) ? 1 : 0;
        //     } else {
        //         return (a1 > b1) ? -1 : 1;
        //     }
        //     // if (a1 < b1) {
        //     //     return 1;
        //     // } else if (a1 > b1) {
        //     //     return -1;
        //     // }
        // });
        // console.log('Answer 1 score range: ' + min1 + ' - ' + max1);
        // console.log('Answer 2 score range: ' + min2 + ' - ' + max2);
        return sortedAnnotations;
    }

    getAnnotationsForAnswer(answer: string) {
        this.showWaitSpinner = true;
        this.globalExplanationService.getAnnotationsForAnswer(answer, this.filter, this.currentFilter()).subscribe(response => {
            this.annotationDialogModel.annotations = this.sortByRejectedAlternatives(response.body);
            const idList = [];
            for (const annotation of this.annotationDialogModel.annotations) {
                idList.push(annotation.question_id);
            }
            console.log(idList.join(','));
            this.annotationDialogModel.type = 'Images with the answer';
            this.annotationDialogModel.value = answer;
            this.showWaitSpinner = false;
            this.annotationDialogModel.display = true;
        });
    }

    getAnnotationsForModelAnswer(answer: string) {
        this.showWaitSpinner = true;
        this.globalExplanationService.getAnnotationsForModelAnswer(answer, this.filter, this.currentFilter()).subscribe(response => {
            this.annotationDialogModel.annotations = this.sortByRejectedAlternatives(response.body);
            this.annotationDialogModel.type = 'Images with the answer';
            this.annotationDialogModel.value = answer;
            this.showWaitSpinner = false;
            this.annotationDialogModel.display = true;
        });
    }

    getAnnotationsForQuestion(question) {
        this.showWaitSpinner = true;
        this.globalExplanationService
            .getAnnotationsForQuestion(question.question, this.filter, this.currentFilter())
            .subscribe(response => {
                this.annotationDialogModel.annotations = this.sortByRejectedAlternatives(response.body);
                this.annotationDialogModel.type = 'Images with the question';
                this.annotationDialogModel.value = question.question + '?';
                this.showWaitSpinner = false;
                this.annotationDialogModel.display = true;
            });
    }

    getNAnnotations(maxResults: number) {
        this.showWaitSpinner = true;
        this.globalExplanationService.getNAnnotations(maxResults, this.currentFilter()).subscribe(response => {
            this.annotationDialogModel.annotations = response.body;
            this.annotationDialogModel.type = 'First (' + this.topNresults + ') question/image pairs for this filter';
            this.annotationDialogModel.value = '';
            this.showWaitSpinner = false;
            this.annotationDialogModel.display = true;
        });
    }

    setTopAnswerChartData(question: QuestionTableItem, orderByModel: boolean) {
        const maxItems = 200;
        const barWidth = 50;
        let answerArraySrc = question.answers;
        if (orderByModel) {
            answerArraySrc = question.modelAnswers;
        }
        const labelArray = answerArraySrc
            .map(a => {
                return a.answer;
            })
            .slice(0, maxItems);
        const valueArray = answerArraySrc
            .map(a => {
                return a.count;
            })
            .slice(0, maxItems);

        const valueArrayAlt = [];
        for (let index = 0; index < labelArray.length; index++) {
            const turkAnswer = labelArray[index];
            let answerFrequency;
            if (orderByModel) {
                answerFrequency = question.answerFreqMap[turkAnswer];
            } else {
                answerFrequency = question.modelAnswerFreqMap[turkAnswer];
            }
            if (answerFrequency !== undefined) {
                valueArrayAlt.push(answerFrequency);
            } else {
                valueArrayAlt.push(0);
            }
        }
        this.topAnswerChartOptions.title.text = question.question + '?';
        const data = {
            labels: labelArray,
            datasets: [
                {
                    label: 'Turkers',
                    backgroundColor: '#42A5F5',
                    borderColor: '#36a2eb',
                    data: orderByModel ? valueArrayAlt : valueArray
                },
                {
                    label: 'Model',
                    backgroundColor: '#EF905D',
                    borderColor: '#F26E1D',
                    data: orderByModel ? valueArray : valueArrayAlt
                }
            ]
        };
        this.topAnswerChartWidth = Math.max(labelArray.length * barWidth, 1200);
        this.topAnswerChartData = data;
    }

    ngOnInit() {
        this.principal.identity().then(account => {
            this.currentAccount = account;
        });

        this.registerChangeInGlobalExplanations();

        this.subscription = this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                // Show loading indicator
                console.log('NavigationStart');
            }

            if (event instanceof NavigationEnd) {
                // Hide loading indicator
                console.log('NavigationEnd');
                // setTimeout(() => {
                // Give the GUI/Spinner time to draw before building dataset
                this.getGlobalExplanationDataset();
                // }, 400);
            }

            if (event instanceof NavigationError) {
                // Hide loading indicator

                // Present error to user
                console.log(event.error);
            }
        });
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    trackId(index: number, item: IGlobalExplanation) {
        return item.id;
    }

    registerChangeInGlobalExplanations() {
        this.eventSubscriber = this.eventManager.subscribe('globalExplanationListModification', response => this.loadAll());
    }

    private onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }

    applyFilterAndTransition() {
        this.router.navigate(['/global-explanation'], {
            queryParams: this.filterParams
        });
    }

    clearFilterAndTransition() {
        this.router.navigate(['/global-explanation']);
    }

    currentFilter(): GlobalExplanationFilter {
        // Current filter based on values in query string
        const result = new GlobalExplanationFilter();
        // Update GE filter params from query string
        Object.keys(this.route.snapshot.queryParams).forEach(key => {
            if (result[key] !== undefined) {
                result[key] = this.typeCast(this.route.snapshot.queryParams[key]);
            }
        });
        return result;
    }

    hasFilterChanged() {
        return JSON.stringify(this.filterParams) === JSON.stringify(this.currentFilter());
    }
    isDefaultFilter() {
        return JSON.stringify(this.currentFilter()) === JSON.stringify(new GlobalExplanationFilter());
    }
}
