import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { saveAs } from 'file-saver';
const SeededShuffle = require('./seededshuffle.js');

import {
    Annotation,
    BlurAnswer,
    BlurQuestion,
    GlobalExplanationDataset,
    BonusCase,
    TestCondition,
    OneShotAnswer,
    Rankings,
    Unit,
    OneShotAnswerV3
} from 'app/shared/model/global-explanation.model';
import { PixelateFilter } from 'app/shared/xai/xai.pixelatefilter';
import { JhiEventManager } from 'ng-jhipster';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { generate } from 'shortid';
import { Account, LoginModalService, Principal } from '../core';
import { XAIService } from '../shared/xai/xai.service';

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
    selector: 'jhi-one-shot-v3',
    templateUrl: './one-shot-v3.component.html',
    providers: [MessageService],
    styleUrls: ['blur-game.scss']
})
export class OneShotV3Component implements OnInit, OnDestroy {
    account: Account;
    modalRef: NgbModalRef;
    // Applies a Gaussian blur to the input image. The value of radius defines the value of the standard deviation to the Gaussian function,
    // or how many pixels on the screen blend into each other, so a larger value will create more blur. The lacuna value for interpolation is 0.
    // The parameter is specified as a CSS length, but does not accept percentage values.
    blurMax = 98;
    blurAmount = this.blurMax;
    blurStep = 0.02;
    blurStepInitial = 0.02;
    blurModifier = 0;
    userOverride = false;
    showPreamble = true;
    showGameComplete = false;
    showAlreadyParticipated = false;
    pixelateFilter = new PixelateFilter();
    modality = '';
    blurStrategy = 'Downsample';
    blurOptions = [
        { label: 'Gaussian', value: 'Gaussian', icon: 'fas fa-fw fa-adjust' },
        { label: 'Downsample', value: 'Downsample', icon: 'fas fa-fw fa-adjust' }
    ];
    blurSmoothing = 100;
    @ViewChild('imgBlurGaussian') imgBlurGaussian: ElementRef;
    globalExplanationDataset = new GlobalExplanationDataset();
    gefilter = 'blur-game';
    // questionsCompleted = 1;
    annotationIndex = 0;
    currentAnnotation = new Annotation();
    // allAnnotations: Annotation[] = [];
    // remainingAnnotations: Annotation[] = [];
    sessionId = '';
    sessionStart = new Date();
    sessionStarted = false;
    // completedHistory = [];
    // imagesViewed = [];
    blurQuestion = new BlurQuestion();
    oneShotAnswer = new OneShotAnswerV3();
    blurAnswerHistory: BlurAnswer[] = [];
    bonusCase = new BonusCase();
    filteredAnswers: string[];
    allUniqueAnswers: string[]; // All unique answers from full GE dataset
    @ViewChild('answerInput') answerInputContol: AutoComplete;
    selectedAnswer = '';
    attempt = 1;
    collapseAnswerPanel = true;
    loadComplete = false;
    showProgressSpinner = false;
    progressSpinnerMessage = '';
    messages = [];

    maxQuestionsPerWorker = 30;
    questionsPerHit = 100;
    blurLimit = 30;
    // questionsCompletedPerAssignment = {};
    showRewardButton = false;
    allowFeedback = true;
    bonusPay = 0;
    maxBonusPayout = 0;
    allLikertQuestionsOneshot = require('./likertQuestions-Oneshot-v3.json');
    likertQuestions = [];
    // Componenent explanations
    @ViewChild('downSampleCanvas') componentOverlay: ElementRef;
    showComponentOverlay = true;
    selectedComponent;
    testLoopTimeout;
    Statistics = require('./statistics.min.js');
    kendallsTauA = 0;
    trialScore = 0;
    levenshtein = 1;
    score = 0;
    imageChosen = false;
    excludeBelow = {
        image: '-999',
        unit: -999,
        iou: 0,
        label: '--- Move any features you think should be excluded below this line ---',
        cat: '',
        index: -999
    };
    // gradeScale = [90, 80, 70, 60];
    gradeScale = [0.05, 0.01, -0.01, -0.05];

    exampleImages = [
        'badminton',
        'bocce',
        'croquet',
        'polo',
        'RockClimbing',
        'rowing',
        'sailing',
        'snowboarding',
        'baggage_claim',
        'dentists_office',
        'drugstore',
        'firing_range',
        'labyrinth_outdoor',
        'observatory_outdoor',
        'power_plant_outdoor',
        'toll_plaza',
        'wine_cellar_barrel_storage'
    ];
    exampleImageIndex = -1;
    exampleImageRankings: Rankings;
    showVisualWord = false;
    showUnit: Unit;
    maxUnits = 5;
    scoredResults: Rankings;
    showScore = false;
    newUnitLabels: Rankings = require('./newUnitLabels.json');

    @HostListener('window:resize')
    onWindowResize() {
        // Not sure why, but this is needed for getBlurStyle to work correctly
    }

    constructor(
        public route: ActivatedRoute,
        private principal: Principal,
        private loginModalService: LoginModalService,
        private eventManager: JhiEventManager,
        private xaiService: XAIService,
        public messageService: MessageService,
        private globalExplanationService: GlobalExplanationService,
        private router: Router,
        private confirmationService: ConfirmationService
    ) {
        // this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    }
    startSession() {
        if (this.sessionStarted === false) {
            this.sessionStart = new Date();
            console.log('Session started at: ' + this.sessionStart.toUTCString());
            this.sessionStarted = true;
        }
    }

    ngOnDestroy() {
        clearTimeout(this.testLoopTimeout);
    }

    ngOnInit() {
        try {
            this.modality = this.route.snapshot.queryParams['modality'] ? this.route.snapshot.queryParams['modality'] : '';
            if ('sessionId' in localStorage === false) {
                localStorage.setItem('sessionId', generate());
            }
            this.sessionId = localStorage.getItem('sessionId');

            // if (this.trialsCookie in localStorage === false) {
            //     localStorage.setItem(this.trialsCookie, JSON.stringify(this.trials));
            // } else {
            //     this.trials = JSON.parse(localStorage.getItem(this.trialsCookie));
            // }
            // Shuffle images based on workerId seed
            if (this.getWorkerId()) {
                this.exampleImages = SeededShuffle.shuffle(this.exampleImages, this.getWorkerId(), true);
            }
        } catch (e) {
            this.logError(e);
        }

        // try {
        //     if ('completedHistory' in localStorage) {
        //         this.completedHistory = JSON.parse(localStorage.getItem('completedHistory'));
        //     }
        // } catch (e) {
        //     this.logError(e);
        // }

        // try {
        //     if ('imagesViewed' in localStorage) {
        //         this.imagesViewed = JSON.parse(localStorage.getItem('imagesViewed'));
        //     }
        // } catch (e) {
        //     this.logError(e);
        // }

        // try {
        //     if ('questionsCompleted' in localStorage) {
        //         this.questionsCompleted = parseInt(localStorage.getItem('questionsCompleted'), 10);
        //     }
        // } catch (e) {
        //     this.logError(e);
        // }

        // try {
        //     if ('questionsCompletedPerAssignment' in localStorage) {
        //         this.questionsCompletedPerAssignment = JSON.parse(localStorage.getItem('questionsCompletedPerAssignment'));
        //     }
        // } catch (e) {
        //     this.logError(e);
        // }

        this.principal.identity().then(account => {
            this.account = account;
        });

        // Hide preamble if the turker has accepted the assignment.
        // if (this.isMTurk() && this.turkerAcceptedAssigment()) {
        //     this.showPreamble = false;
        // }

        this.registerAuthenticationSuccess();

        try {
            const e2etest = this.route.snapshot.queryParams['e2etest'] ? this.route.snapshot.queryParams['e2etest'] : '';
            if (e2etest) {
                this.showPreamble = false;
                this.runTest(e2etest);
            } else {
                this.getNextTrial(true);
            }
        } catch (e) {
            this.logError(e);
        }
    }

    logError(error: Error) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error!',
            detail: error.stack
        });
        console.error(error);
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

    getCompletedTrialCount() {
        // return this.blurQuestion.completedInAssignment + 1;
        return this.exampleImageIndex + 1;
    }

    getNextTrial(isGameMode: boolean) {
        window.scroll(0, 0);
        this.showProgressSpinner = true;
        this.messages.length = 0;
        this.attempt = 1;
        this.showScore = false;
        this.imageChosen = false;
        this.saveFeedback(false).then(result => {
            console.log(result);
            const forceQuestionId = this.route.snapshot.queryParams['forceQuestionId']
                ? this.route.snapshot.queryParams['forceQuestionId']
                : 0;
            // const uncompletedTrials = this.getUncompletedTrials();
            let category = this.getCategory();

            this.globalExplanationService
                .getNextOneShotV3GameQuestion(this.getWorkerId(), this.getAssignmentId(), forceQuestionId, this.modality)
                .subscribe(response => {
                    // this.trial += 1;
                    // this.overrideAnnotationWithNewExplanation(response.body.annotation); // Use the newest explanations from Kerry/Jialin
                    this.blurQuestion = response.body;
                    console.log('Completed For This Assignment: ' + this.getCompletedCountForThisAssignment());
                    console.log('Completed Total: ' + this.blurQuestion.completedTotal);
                    // this.blurQuestion.completedInAssignment = 16;
                    if (isGameMode) {
                        this.exampleImageIndex = this.blurQuestion.completedInAssignment;
                    } else {
                        this.exampleImageIndex += 1; // adimin mode. user clicked image class
                    }
                    if (this.reachedAssignmentQuota() || this.reachedMaxQuota()) {
                        // User completed all questions or reached quota
                        this.showPreamble = false;
                        this.showGameComplete = true;
                        this.showProgressSpinner = false;
                    } else {
                        this.imageChosen = true;
                        this.loadRankings();
                        this.setRandomLikertQuestions(2);
                    }
                });
        });
    }
    loadRankings() {
        this.showSpinner('Loading...');
        this.scoredResults = undefined;
        this.globalExplanationService.getRankingv3(this.exampleImages[this.exampleImageIndex]).subscribe(
            rankings => {
                this.oneShotAnswer = new OneShotAnswerV3();
                const tmpRankings = JSON.parse(JSON.stringify(rankings.body));
                this.exampleImageRankings = JSON.parse(JSON.stringify(rankings.body));
                this.exampleImageRankings.units.length = 0;
                tmpRankings.units.forEach(unit => {
                    // Remove choose_task NA
                    if (unit.choose_task !== 'na') {
                        this.exampleImageRankings.units.push(unit);
                    }
                });
                //Shuffle the first N features
                this.exampleImageRankings.units = this.shuffleArrayFirstN([].concat(this.exampleImageRankings.units), this.maxUnits - 1);

                for (let index = 0; index < this.exampleImageRankings.units.length; index++) {
                    const unit = this.exampleImageRankings.units[index];
                    // unit.label = 'Feature #' + (index + 1);//Create Generic Unit Labels "Feature #1..."
                    this.newUnitLabel(unit); //expand -t, -b, -r, -l
                }
                this.exampleImageRankings.initalSort = JSON.parse(JSON.stringify(this.exampleImageRankings.units));
                // this.exampleImageRankings.units.splice(this.maxUnits - 1, 0, this.excludeBelow);
                // this.initNewQuestion(this.blurQuestion);

                this.loadComplete = true;
                // this.hideSpinner();
            },
            error => {
                this.hideSpinner();
            }
        );
    }

    didUserMakeExclusion(): boolean {
        const excludedUnit = this.excludedUnit();
        if (excludedUnit) {
            return true;
        }
        return false;
    }

    excludedUnit(): Unit {
        for (let i = 0; i < this.maxUnits; ++i) {
            if (this.exampleImageRankings.units[i].excluded) {
                return this.exampleImageRankings.units[i];
            }
        }
    }

    excludedUnitLabel(): string {
        for (let i = 0; i < this.maxUnits; ++i) {
            if (this.exampleImageRankings.units[i].excluded) {
                return '#' + (i + 1) + ' ' + this.exampleImageRankings.units[i].label;
            }
        }
    }

    normalize(val: number, valmin: number, valmax: number, min: number, max: number): number {
        return ((val - valmin) / (valmax - valmin)) * (max - min) + min;
    }

    getUsersScore() {
        return (this.blurQuestion.score + this.trialScore) / this.getCompletedTrialCount();
    }

    getFinalScore() {
        return this.blurQuestion.score / this.blurQuestion.completedInAssignment;
    }

    calcSimilaritryScore(): void {
        const userSort = this.currentAnnotation.userSortedFeatures.map(item => {
            return item['class'];
        });

        const origSort = this.currentAnnotation.componentExplanation.map(item => {
            return item['class'];
        });
        // const userSortExcludeIndex = userSort.indexOf(this.excludeBelow.class);
        // const origSortExcludeIndex = origSort.indexOf(this.excludeBelow.class);
        // if (userSortExcludeIndex !== -1) {
        //     userSort.splice(userSortExcludeIndex, 1);
        // }

        // if (origSortExcludeIndex !== -1) {
        //     userSort.splice(origSortExcludeIndex, 1);
        // }

        const testData = [];
        for (let index = 0; index < userSort.length; index++) {
            const word = userSort[index];
            const userIndex = index;
            const origIndex = origSort.indexOf(word);
            // Let all items below the exclude line have the same index
            // if (userIndex > userSortExcludeIndex) {
            //     userIndex = userSortExcludeIndex;
            // }
            // if (origIndex > origSortExcludeIndex) {
            //     origIndex = origSortExcludeIndex;
            // }
            testData.push({ user: userIndex, orig: origIndex });
        }
        const testVars = { user: 'ordinal', orig: 'ordinal' };
        const stats = new this.Statistics(testData, testVars);
        const kendallsTau = stats.kendallsTau('user', 'orig');
        this.kendallsTauA = kendallsTau.a.tauA;
        this.trialScore = this.normalize(this.kendallsTauA, -1, 1, 0, 100);
        this.levenshtein = this.calcLevenshtein(userSort, origSort);
    }

    calcLevenshtein = (a, b) => {
        const alen = a.length;
        const blen = b.length;
        if (alen === 0) {
            return blen;
        }
        if (blen === 0) {
            return alen;
        }
        let tmp, i, j, prev, val, row, ma, mb, mc, md, bprev;

        if (alen > blen) {
            tmp = a;
            a = b;
            b = tmp;
        }

        row = new Int8Array(alen + 1);
        // init the row
        for (i = 0; i <= alen; i++) {
            row[i] = i;
        }

        // fill in the rest
        for (i = 1; i <= blen; i++) {
            prev = i;
            bprev = b[i - 1];
            for (j = 1; j <= alen; j++) {
                if (bprev === a[j - 1]) {
                    val = row[j - 1];
                } else {
                    ma = prev + 1;
                    mb = row[j] + 1;
                    mc = ma - ((ma - mb) & ((mb - ma) >> 7));
                    md = row[j - 1] + 1;
                    val = mc - ((mc - md) & ((md - mc) >> 7));
                }
                row[j - 1] = prev;
                prev = val;
            }
            row[alen] = prev;
        }
        return row[alen];
    };

    saveFeedback(collectReward: boolean): Promise<string> {
        // if (this.allowFeedback) {
        return new Promise((resolve, reject) => {
            try {
                if (this.oneShotAnswer['_id'] !== '') {
                    this.globalExplanationService
                        .saveOneShotV3Feedback(
                            this.oneShotAnswer['_id'],
                            this.oneShotAnswer.feedback,
                            collectReward,
                            this.getLikertResponsesStr()
                        )
                        .subscribe(response => {
                            return resolve('Feedback saved successfully.');
                        });
                } else {
                    return resolve('Skipped saving feedback. answer.id is empty.');
                }
            } catch (e) {
                this.logError(e);
                return resolve('Saving feedback failed with an exception!: ' + e.message);
            }
        });
        // }
    }

    allowImageSelection() {
        return !this.isGamePaused();
    }

    isGamePaused() {
        if (this.messages.length > 0 || this.showRewardButton) {
            return true;
        }
        return false;
    }
    shuffleArrayFirstN(a, n) {
        for (let i = n; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // initNewQuestion(blurQuestion: BlurQuestion) {
    //     this.selectedAnswer = '';
    //     this.bonusCase = new BonusCase();
    //     this.blurStep = this.blurStepInitial;
    //     this.collapseAnswerPanel = true;
    //     this.showComponentOverlay = true;

    //     this.blurQuestion.annotations = this.shuffleArray([].concat(this.blurQuestion.annotations));
    //     for (const annotation of this.blurQuestion.annotations) {
    //         // annotation.userSortedFeatures = annotation.userSortedFeatures.slice(0, 10);
    //         annotation.componentExplanation = [].concat(annotation.userSortedFeatures);
    //         annotation.userSortedFeatures = this.shuffleArray([].concat(annotation.componentExplanation));
    //         // const index = annotation.userSortedFeatures.findIndex(item => item.class === this.excludeBelow.class);
    //         // annotation.userSortedFeatures.splice(index, 1);
    //         annotation.userSortedFeatures.push(this.excludeBelow);
    //         annotation.intialSortOrder = [].concat(annotation.userSortedFeatures);
    //     }

    //     this.blurQuestion.annotation = blurQuestion.annotations[0];
    //     this.currentAnnotation = blurQuestion.annotation;
    //     this.oneShotAnswer = new OneShotAnswer();
    //     this.calcSimilaritryScore();
    //     this.loadComplete = true;
    // }

    submitRequest() {
        this.selectedAnswer = '';
        this.blurAmount = this.blurMax;
        this.collapseAnswerPanel = true;
    }

    getImageNameNoExt() {
        return this.currentAnnotation.imageName.replace(/\.[^/.]+$/, '');
    }

    guassianEstimation() {
        // return (this.pixelateFilter.originalPixelCount() / (this.blurAmount * 2 )) / this.pixelateFilter.originalPixelCount();
        return 1 / this.blurAmount;
    }

    getBlurStyle() {
        // dividing by window.devicePixelRatio accounts for the browser zoom level
        this.applyPixelateFilter(false);
        return 'blur(' + this.pixelateFilter.blurRadius / window.devicePixelRatio + 'px)';
    }

    filterAnswers(event) {
        this.filteredAnswers = [];
        // for (const answerOption of this.globalExplanationDataset.answerTable) {
        //     if (answerOption.answer.toLowerCase().indexOf(event.query.toLowerCase()) === 0) {
        //         this.filteredAnswers.push(answerOption.answer);
        //     }
        // }

        // // Allow only answers found in the subset
        // for (const answerOption of this.allAnnotations) {
        //     if (answerOption.topAnswer.toLowerCase().indexOf(event.query.toLowerCase()) === 0) {
        //         this.filteredAnswers.push(answerOption.topAnswer);
        //     }
        // }

        for (const answerOption of this.allUniqueAnswers) {
            if (this.filteredAnswers.length >= 75) {
                break; // Limit the size of the dropdown list
            }
            if (answerOption.toLowerCase().indexOf(event.query.toLowerCase()) === 0) {
                this.filteredAnswers.push(answerOption);
            }
        }
    }

    deBlur() {
        // const frameCount = 15;
        // const targetBlurAmount = Number(Number(this.blurAmount - this.blurAmount * this.blurStep).toPrecision(2));
        // this.deBlurAnimate(targetBlurAmount, targetBlurAmount / frameCount);
        // const newblurAmount = this.blurAmount - this.blurStep * 100;
        // const newblurAmount = Math.round(this.blurAmount - ((100 - this.blurAmount) * 1.25));
        const newblurAmount = Math.round(100 - (100 - this.blurAmount) * this.blurStep);
        // this.blurStep += .01;
        if (newblurAmount >= 0) {
            this.blurAmount = newblurAmount;
        } else {
            this.blurAmount = 0;
        }
    }
    applyPixelateFilter(forceRedraw: boolean) {
        this.pixelateFilter.apply('sourceImage', 'imgBlurDownsample', this.blurAmount, this.blurSmoothing, forceRedraw);
    }
    clearPixelateFilter() {
        this.pixelateFilter.clear('imgBlurDownsample');
    }

    deBlurAnimate(targetBlurAmount, step) {
        // setTimeout(() => {
        //     if (this.blurAmount > targetBlurAmount) {
        //         this.blurAmount -= step;
        //         this.deBlurAnimate(targetBlurAmount, step);
        //     }
        // }, 100);
        this.blurAmount = targetBlurAmount;
    }

    // https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
    is_touch_device() {
        const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        const mq = query => {
            return window.matchMedia(query).matches;
        };
        // tslint:disable-next-line
        if ('ontouchstart' in window) {
            // tslint:disable-line
            return true;
        }
        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }

    isMTurk() {
        const assignmentId = this.route.snapshot.queryParams['assignmentId'];
        if (assignmentId === undefined) {
            return false;
        }
        return true;
    }

    getWorkerId() {
        if (this.isMTurk()) {
            return this.route.snapshot.queryParams['workerId'];
        } else {
            return this.sessionId;
        }
    }

    getAssignmentId() {
        if (this.isMTurk()) {
            return this.route.snapshot.queryParams['assignmentId'];
        } else {
            return 'equas-hosted';
        }
    }

    // changeCategory(category: string, trial: number) {
    //     this.router.navigate([], {
    //         relativeTo: this.route,
    //         queryParams: {
    //             category
    //         },
    //         queryParamsHandling: 'merge'
    //     });
    //     this.trial = trial;
    // }

    getCategory() {
        // if (this.currentAnnotation) {
        //     return this.currentAnnotation.topAnswer;
        // }
        // return '';
        return this.exampleImages[this.exampleImageIndex];
    }

    chooseThisImage() {
        this.imageChosen = true;
    }

    isSandbox() {
        if (this.isMTurk()) {
            const turkSubmitTo = this.route.snapshot.queryParams['turkSubmitTo'] ? this.route.snapshot.queryParams['turkSubmitTo'] : '';
            if (turkSubmitTo.includes('sandbox')) {
                return 1; // worker sandbox
            } else {
                return 0; // real run
            }
        } else {
            return 2; // equas-hosted
        }
    }
    turkerAcceptedAssigment(): boolean {
        const assignmentId = this.getAssignmentId();
        if (this.isMTurk() && assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
            return false;
        }
        return true;
    }

    decode(strToDecode) {
        return unescape(strToDecode.replace(/\+/g, ' '));
    }

    getCompletedCountForThisAssignment(): number {
        return this.blurQuestion.completedInAssignment;
    }

    isLastQuestion() {
        // if (this.blurQuestion.completedInAssignment + 1 >= this.blurQuestion.maxTrials) {
        if (this.exampleImageIndex + 1 >= this.exampleImages.length) {
            return true;
        }
        return false;
    }
    reachedAssignmentQuota(): boolean {
        // if (this.blurQuestion.completedInAssignment >= this.blurQuestion.maxTrials) {
        if (this.exampleImageIndex >= this.exampleImages.length) {
            return true;
        }
        return false;
    }

    reachedMaxQuota(): boolean {
        // if (this.blurQuestion.completedInAssignment >= this.blurQuestion.maxTrials) {
        if (this.exampleImageIndex >= this.exampleImages.length) {
            return true;
        }
        return false;
    }

    getHitsAllowed(): number {
        return this.maxQuestionsPerWorker / this.questionsPerHit;
    }

    getHitsCompleted(): number {
        return Math.trunc(this.blurQuestion.completedTotal / this.questionsPerHit);
    }

    giveAssignmentReward() {
        if (this.showProgressSpinner === false) {
            this.showProgressSpinner = true;
            this.saveFeedback(true).then(result => {
                console.log(result);
                console.log('Give Assignment Reward');
                if (this.isMTurk()) {
                    const form = document.forms.namedItem('mturk_form');
                    // Gets whether it is sandbox or real AMT (or nothing)
                    const service = this.decode(this.route.snapshot.queryParams['turkSubmitTo']);

                    if (service.length > 0) {
                        form.action = service + '/mturk/externalSubmit';
                        form.submit();
                    }
                } else {
                    this.oneShotAnswer['_id'] = ''; // Prevent 2nd saveFeedback in getNextTrial
                    this.getNextTrial(true);
                }
            });
        }
    }
    replaceRgb(html: string, newColor: string) {
        try {
            return html.replace(/rgb\(.+?\)/gm, newColor);
        } catch (e) {
            console.log(e.message);
        }
        return html;
    }

    getComponentColor(component) {
        if (this.isComponentModality()) {
            return 'rgb(0, 0, 0)';
        } else {
            return this.getRgb(component);
        }
    }

    getRgb(component) {
        return 'rgb(' + component.rgb[0] + ', ' + component.rgb[1] + ', ' + component.rgb[2] + ')';
    }

    isMentalModeling() {
        return this.modality.includes('-mm');
    }

    isGeMode() {
        return this.modality.includes('-ge');
    }

    isNoModality() {
        return this.modality === '';
    }

    isAnswerModality() {
        return (
            this.modality === 'answer' || this.modality === 'answer-ge' || this.modality === 'answer-mm' || this.modality === 'answer-mm-ge'
        );
    }

    isExplanationModality() {
        return (
            this.modality === 'explanation' ||
            this.modality === 'explanation-ge' ||
            this.modality === 'explanation-mm' ||
            this.modality === 'explanation-mm-ge'
        );
    }

    isComponentModality() {
        return (
            this.modality === 'component' ||
            this.modality === 'component-ge' ||
            this.modality === 'component-mm' ||
            this.modality === 'component-mm-ge'
        );
    }

    isComponentMaskModality() {
        return (
            this.modality === 'component-mask' ||
            this.modality === 'component-mask-ge' ||
            this.modality === 'component-mask-mm' ||
            this.modality === 'component-mask-mm-ge'
        );
    }

    setRandomLikertQuestions(n: number) {
        // Shuffle all questions
        this.likertQuestions.length = 0;
        let allLikertQuestions = [];
        allLikertQuestions = [].concat(this.allLikertQuestionsOneshot);
        // this.addLikertQuestion(allLikertQuestions, 0); // Pinned question;
        // allLikertQuestions.sort(() => Math.random() - 0.5);
        for (let index = 0; this.likertQuestions.length < n; index++) {
            this.addLikertQuestion(allLikertQuestions, index);
        }
    }

    addLikertQuestion(allLikertQuestions: any, index: number) {
        const element = allLikertQuestions[index];
        this.likertQuestions.push({
            id: element.id,
            question: element.question,
            userSelection: 0
        });
        // allLikertQuestions.splice(index, 1);
    }

    requireLikertQuestions() {
        // if (this.testLoopTimeout) {
        //     // Disable likert questions for test mode
        //     return false;
        // }
        // if (!this.isNoModality() && (this.isAnswerModality() && this.isMentalModeling()) === false) {
        //     return true;
        // }
        return true;
    }

    hasUserAnsweredLikertQuestions() {
        if (this.requireLikertQuestions()) {
            for (const q of this.likertQuestions) {
                if (q.userSelection === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    hasUserAnsweredLikertQuestionsToolTip() {
        if (this.hasUserAnsweredLikertQuestions()) {
            return '';
        } else {
            return 'You must first answer the survey questions';
        }
    }

    getLikertResponsesStr() {
        const delim = '_';
        let result = '';
        for (const q of this.likertQuestions) {
            result += q.id + '-' + q.userSelection + delim;
        }
        if (result.endsWith(delim)) {
            result = result.slice(0, -1);
        }
        if (result === '') {
            return delim;
        }
        return result;
    }

    doUserOverride() {
        this.userOverride = true;
        this.deBlur();
        this.deBlur();
    }

    getCorrectAnswer() {
        // if (this.isMentalModeling()) {
        //     return this.currentAnnotation.modelAnswer;
        // } else {
        return this.currentAnnotation.topAnswer;
        // }
    }

    robotIncorrectMessage() {
        if (this.currentAnnotation.modelAnswer === this.currentAnnotation.topAnswer) {
            return '<br> The smart robot answered this question correctly.'; // with (' + this.currentAnnotation.modelAnswer + ').';
        } else {
            return '<br> The smart robot answered this question incorrectly.'; // with (' + this.currentAnnotation.modelAnswer + ').'
            // +
            // '<br> The correct answer was (' +
            // this.currentAnnotation.topAnswer +
            // ').'
        }
    }
    runTest(delayMs: number) {
        this.sessionId = 'test_' + generate();
        // this.getGlobalExplanationDataset();
        this.runTestLoop(delayMs, 1, 1, TestCondition.GodMode);
    }
    stopTest() {
        clearTimeout(this.testLoopTimeout);
        this.testLoopTimeout = undefined;
    }
    runTestLoop(delayMs: number, trialCount: number, roundsPlayed: number, testCondition: TestCondition) {
        if (roundsPlayed >= 50) {
            this.stopTest();
        } else {
            let testConditionName = TestCondition[testCondition];
            this.testLoopTimeout = setTimeout(() => {
                if (this.showRewardButton && this.isMTurk()) {
                    this.stopTest();
                    return;
                }
                // Generate new sessionId and reset the game.
                if (this.showGameComplete) {
                    roundsPlayed += 1;
                    if (testCondition === TestCondition.GodMode) {
                        testCondition = TestCondition.AlwaysYes;
                    } else if (testCondition === TestCondition.AlwaysYes) {
                        testCondition = TestCondition.AlwaysNo;
                    } else if (testCondition === TestCondition.AlwaysNo) {
                        testCondition = TestCondition.AlwaysNoCorrect;
                    } else if (testCondition === TestCondition.AlwaysNoCorrect) {
                        testCondition = TestCondition.AlwaysYesWithFeedback;
                    } else if (testCondition === TestCondition.AlwaysYesWithFeedback) {
                        testCondition = TestCondition.AlwaysNoWithFeedback;
                    } else if (testCondition === TestCondition.AlwaysNoWithFeedback) {
                        testCondition = TestCondition.GodMode;
                    }
                    this.sessionId = 'test_' + generate();
                    testConditionName = TestCondition[testCondition];
                    this.sessionId += '_' + testConditionName;
                    this.showGameComplete = false;
                    // this.getGlobalExplanationDataset();
                }
                if (this.isMentalModeling()) {
                    if (document.getElementById('mmYes')) {
                        const btnYes = <HTMLButtonElement>document.getElementById('mmYes').firstElementChild;
                        const btnNo = <HTMLButtonElement>document.getElementById('mmNo').firstElementChild;
                        if (testConditionName.includes('AlwaysYes')) {
                            btnYes.click();
                        } else if (testConditionName.includes('AlwaysNo')) {
                            btnNo.click();
                        }
                    }
                } else if (!this.isNoModality()) {
                    if (document.getElementById('bgAccept')) {
                        const bgAccept = <HTMLButtonElement>document.getElementById('bgAccept').firstElementChild;
                        const bgOverride = <HTMLButtonElement>document.getElementById('bgOverride').firstElementChild;
                        if (testConditionName.includes('GodMode')) {
                            if (this.currentAnnotation.topAnswer === this.currentAnnotation.modelAnswer) {
                                bgAccept.click();
                            } else {
                                bgOverride.click();
                            }
                        } else if (testConditionName.includes('AlwaysYes')) {
                            bgAccept.click();
                        } else if (testConditionName.includes('AlwaysNo')) {
                            bgOverride.click();
                        }
                    }
                    if (document.getElementById('txtAnswerInput')) {
                        if (testConditionName.includes('GodMode') || testConditionName.includes('AlwaysNoCorrect')) {
                            this.selectedAnswer = this.currentAnnotation.topAnswer;
                        } else {
                            this.selectedAnswer = 'aaa';
                        }
                    }
                    if (document.getElementById('btnSubmitAnswer')) {
                        const btnSubmitAnswer = <HTMLButtonElement>document.getElementById('btnSubmitAnswer').firstElementChild;
                        btnSubmitAnswer.click();
                    }
                }
                // Consistant across modalities
                if (document.getElementById('btnProceedToNextQuestion')) {
                    const btnProceedToNextQuestion = <HTMLButtonElement>(
                        document.getElementById('btnProceedToNextQuestion').firstElementChild
                    );
                    if (testConditionName.includes('Feedback') && document.getElementById('txtFeedback')) {
                        this.oneShotAnswer.feedback = 'Feedback message #' + trialCount;
                    }
                    btnProceedToNextQuestion.click();
                    trialCount += 1;
                }
                if (document.getElementById('btnCollectReward')) {
                    const btnCollectReward = <HTMLButtonElement>document.getElementById('btnCollectReward').firstElementChild;
                    btnCollectReward.click();
                    trialCount += 1;
                }
                this.runTestLoop(delayMs, trialCount, roundsPlayed, testCondition);
            }, delayMs);
        }
    }

    resetWorkerId() {
        this.globalExplanationService.deleteOneShotV3AnswersByWorkerId(this.getWorkerId()).subscribe(response => {
            this.messageService.add({
                severity: 'success',
                summary: 'Success!',
                detail: 'Refresh your browser to restart the game.'
            });
        });
    }

    currentAccuracy(): number {
        if (this.blurQuestion.completedTotal > 0) {
            return this.blurQuestion.answersCorrect / this.blurQuestion.completedTotal;
        } else {
            return 1;
        }
    }

    getBonusMultiplier(): BonusCase {
        if (this.userOverride === false) {
            if (this.currentAnnotation.topAnswer === this.selectedAnswer) {
                return {
                    case: 1,
                    bonusMessage: `You received 3 points toward your bonus for accepting the robot's correct answer.`,
                    multiplier: 3
                };
            } else if (this.currentAnnotation.topAnswer !== this.selectedAnswer) {
                return {
                    case: 2,
                    bonusMessage: `You received no points toward your bonus because you accepted the robot's incorrect answer.`,
                    multiplier: 0
                };
            }
        } else {
            if (
                this.currentAnnotation.topAnswer !== this.currentAnnotation.modelAnswer &&
                this.currentAnnotation.topAnswer === this.selectedAnswer
            ) {
                return {
                    case: 3,
                    bonusMessage: `You received 3 points toward your bonus for overriding the robot's wrong answer and entering the correct answer.`,
                    multiplier: 3
                };
            } else if (
                this.currentAnnotation.topAnswer !== this.currentAnnotation.modelAnswer &&
                this.currentAnnotation.topAnswer !== this.selectedAnswer
            ) {
                return {
                    case: 4,
                    bonusMessage: `You received 2 points toward your bonus for overriding the robot's wrong answer.`,
                    multiplier: 2
                };
            } else if (
                this.currentAnnotation.topAnswer === this.currentAnnotation.modelAnswer &&
                this.currentAnnotation.topAnswer !== this.selectedAnswer
            ) {
                return {
                    case: 5,
                    bonusMessage: `You received no points toward your bonus because you overrode the robot's correct answer and you entered an incorrect answer.`,
                    multiplier: 0
                };
            } else if (
                this.currentAnnotation.topAnswer === this.currentAnnotation.modelAnswer &&
                this.currentAnnotation.topAnswer === this.selectedAnswer
            ) {
                return {
                    case: 6,
                    bonusMessage: `You received 1 point toward your bonus because, even though you overrode the robot's correct answer, you then entered that correct answer`,
                    multiplier: 1
                };
            }
        }
        return {
            case: 7,
            bonusMessage: 'Unknown condition',
            multiplier: 0
        };
    }

    imageOverlayUrl(): string {
        if (this.isComponentMaskModality()) {
            return '/evaluation_dataset/component_explanations/no_fill/' + this.currentAnnotation.question_id + '.png';
        } else if (this.isExplanationModality()) {
            return '/evaluation_dataset/seg_masks/' + this.currentAnnotation.question_id + '.png';
        }
        return '';
    }

    excludeUnit(unit) {
        if (this.allowImageSelection()) {
            this.exampleImageRankings.units.forEach(element => {
                if (element == unit) {
                    element.excluded = !element.excluded;
                } else {
                    element.excluded = false;
                }
            });
        }
    }

    submitOneShot(newRankings: Rankings) {
        this.showVisualWord = false;
        if (!this.didUserMakeExclusion()) {
            this.hideSpinner();
            this.confirmationService.confirm({
                key: 'Info',
                header: 'No change detected',
                rejectVisible: false,
                acceptLabel: 'Ok',
                message: 'Please remove a feature from the list before continuing',
                accept: () => {}
            });
        } else {
            if (this.showProgressSpinner === false) {
                this.showSpinner('Calculating Score.  Please wait...');
                // this.selectedAnswer = this.currentAnnotation.modelAnswer;
                try {
                    this.oneShotAnswer.hitId = this.route.snapshot.queryParams['hitId'];
                    // this.oneShotAnswer.requestedOn = this.blurQuestion.requestedOn;
                    this.oneShotAnswer.sandbox = this.isSandbox();
                    this.oneShotAnswer.assignmentId = this.getAssignmentId();
                    this.oneShotAnswer.workerId = this.getWorkerId();
                    this.oneShotAnswer.modality = this.modality;
                    this.oneShotAnswer.sandbox = this.isSandbox();
                    this.oneShotAnswer.category = this.getCategory();
                    this.oneShotAnswer.trial = this.getCompletedTrialCount();

                    for (let i = 0; i < this.maxUnits; ++i) {
                        const unit = this.exampleImageRankings.units[i];
                        if (unit.excluded) {
                            this.oneShotAnswer.excludedId = unit.unit;
                            // this.oneShotAnswer.excludedLabel = unit.label;
                            this.oneShotAnswer.excludedLabel = '#' + (i + 1) + ' ' + this.newUnitLabel(unit);
                        }
                        if (unit['choose_task'] === 'distractor') {
                            this.oneShotAnswer.distractorId = unit.unit;
                            // this.oneShotAnswer.distractorLabel = unit.label;
                            this.oneShotAnswer.distractorLabel = '#' + (i + 1) + ' ' + this.newUnitLabel(unit);
                        }
                    }
                    if (this.oneShotAnswer.distractorId === this.oneShotAnswer.excludedId) {
                        this.oneShotAnswer.correctAnswer = true;
                    }
                    newRankings['stats'] = this.oneShotAnswer;
                    this.globalExplanationService.sumbitRankingv3(this.getCategory(), newRankings).subscribe(
                        results => {
                            this.messages.push({
                                severity: 'success',
                                summary: 'Image and list submitted successfully',
                                detail: ''
                            });
                            this.oneShotAnswer['_id'] = results.body['_id'];
                            if (this.isLastQuestion()) {
                                console.log('Assignment Quota Reached');
                                this.showRewardButton = true;
                            }
                            this.attempt += 1;
                            if (this.is_touch_device() === false) {
                                if (this.answerInputContol) {
                                    this.answerInputContol.focusInput();
                                }
                            }
                            this.scoredResults = results.body;
                            this.hideSpinner();

                            setTimeout(() => {
                                this.smoothScrollToElement('btnShowScore');
                            }, 400);
                        },
                        error => {
                            this.hideSpinner();
                        }
                    );
                } catch (e) {
                    this.hideSpinner();
                    this.logError(e);
                }
                this.showComponentOverlay = true;
            }
        }
    }

    smoothScrollToElement(elementId: string) {
        if (document.getElementById(elementId)) {
            const btnProceedToNextQuestion = <HTMLButtonElement>document.getElementById(elementId).firstElementChild;
            btnProceedToNextQuestion.scrollIntoView({ behavior: 'smooth' });
        }
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer !== event.container) {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        } else {
            moveItemInArray(this.exampleImageRankings.units, event.previousIndex, event.currentIndex);
        }
        // Tally move count
        const unitMoved = this.exampleImageRankings.units[event.currentIndex];
        if (unitMoved['moveCount']) {
            unitMoved['moveCount'] += 1;
        } else {
            unitMoved['moveCount'] = 1;
        }
    }

    showUnitImage(unit: Unit, event: MouseEvent) {
        if (event.buttons === 0) {
            if (unit === this.excludeBelow) {
                this.showVisualWord = false;
            } else {
                this.showVisualWord = true;
            }
            this.showUnit = unit;
        }
        // console.log('showUnitImage - button', event.button, event.buttons);
    }

    hideUnitImage(unit: Unit, event: MouseEvent) {
        // console.log('hideUnitImage - button', event.button, event.buttons);
        if (event.buttons === 0) {
            this.showVisualWord = false;
        }
    }
    sortBest() {
        this.exampleImageRankings.units.sort((a, b) => (a.iou < b.iou ? -1 : b.iou < a.iou ? 1 : 0));
    }

    uniqueFeatures() {
        const featureCount = {};
        const featureIou = {};
        this.exampleImageRankings.initalSort.forEach(feature => {
            const key = feature.label.split('-')[0];
            if (featureCount[key] !== undefined) {
                featureCount[key] += 1;
                featureIou[key] += feature.iou;
            } else {
                featureCount[key] = 1;
                featureIou[key] = feature.iou;
            }
        });
        const keys = Object.keys(featureCount).sort();

        keys.forEach(key => {
            console.log(key + ' - count: ' + featureCount[key] + '  avgIou: ' + featureIou[key] / featureCount[key]);
        });
        // console.log(JSON.stringify(featureMap));
    }

    saveRanking(submitForScore: boolean) {
        if (submitForScore) {
            this.submitOneShot(this.exampleImageRankings);
        } else {
            saveAs(
                new Blob([JSON.stringify(this.exampleImageRankings, null, 2)], { type: 'text' }),
                this.exampleImages[this.exampleImageIndex] + '-v3-exclude.json'
            );
            // const shuffled = SeededShuffle.shuffle(this.exampleImages, this.getWorkerId(), true);
            // console.log(shuffled);
            this.hideSpinner();
        }
    }

    sendToTop(index: number) {
        moveItemInArray(this.exampleImageRankings.units, index, 0);
    }

    sendToBottom(index: number) {
        moveItemInArray(this.exampleImageRankings.units, index, Math.min(this.maxUnits, this.exampleImageRankings.units.length) - 1);
    }

    getScoreColor(before: number, after: number) {
        if (after > before) {
            return 'green';
        } else if (after < before) {
            return 'red';
        } else {
            return 'default';
        }
    }
    getScoreDelta(before: number, after: number) {
        return after - before;
    }

    showSpinner(message: string) {
        this.showProgressSpinner = true;
        this.progressSpinnerMessage = message;
    }

    hideSpinner() {
        this.showProgressSpinner = false;
        this.progressSpinnerMessage = '';
    }

    newUnitLabel(oldUnit: Unit): string {
        if (oldUnit['oldLabel']) {
            return oldUnit.label;
        } else {
            oldUnit['oldLabel'] = oldUnit.label;
            oldUnit.label = oldUnit.label.replace('-t', ' top');
            oldUnit.label = oldUnit.label.replace('-b', ' bottom');
            oldUnit.label = oldUnit.label.replace('-l', ' left');
            oldUnit.label = oldUnit.label.replace('-r', ' right');
            return oldUnit.label;
        }
        // }
    }
    featureTooltip(unit: Unit): string {
        if (this.allowImageSelection()) {
            return 'Click to remove the feature (' + unit.label + ')';
        } else {
            return '';
        }
    }
}
