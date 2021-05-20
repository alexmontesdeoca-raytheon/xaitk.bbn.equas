import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import {
    Annotation,
    BlurAnswer,
    BlurQuestion,
    GlobalExplanationDataset,
    BonusCase,
    TestCondition,
    OneShotAnswer
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
    selector: 'jhi-one-shot',
    templateUrl: './one-shot.component.html',
    providers: [MessageService],
    styleUrls: ['blur-game.scss']
})
export class OneShotComponent implements OnInit, OnDestroy {
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
    oneShotAnswer = new OneShotAnswer();
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
    messages = [];

    maxQuestionsPerWorker = 30;
    questionsPerHit = 100;
    blurLimit = 30;
    // questionsCompletedPerAssignment = {};
    showRewardButton = false;
    allowFeedback = true;
    bonusPay = 0;
    maxBonusPayout = 0;
    allLikertQuestionsAnswer = require('./likertQuestions-Answer.json');
    allLikertQuestionsExplanation = require('./likertQuestions-Explanation.json');
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
        rgb: [228, 26, 28],
        class: '--- Move any features you think should be excluded below this line ---'
    };
    // gradeScale = [90, 80, 70, 60];
    gradeScale = [80, 70, 60, 50];
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
                // this.globalExplanationService
                //     .hasWorkerAlreadyParticipatedInAnotherModality(this.getWorkerId(), this.modality)
                //     .subscribe(response => {
                //         if (response.body === true) {
                //             console.log('Worker (' + this.getWorkerId() + ') has already participated in another modality.');
                //             this.showPreamble = false;
                //             this.showAlreadyParticipated = true;
                //         } else {
                //             setTimeout(() => {
                //                 // Give the GUI/Spinner time to draw before building dataset
                //                 this.getNextTrial(true);
                //             }, 400);
                //         }
                //     });
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
        return this.blurQuestion.completedInAssignment + 1;
    }

    getNextTrial(isGameMode: boolean) {
        this.showProgressSpinner = true;
        this.messages.length = 0;
        this.attempt = 1;
        this.imageChosen = false;
        this.saveFeedback(false).then(result => {
            console.log(result);
            const forceQuestionId = this.route.snapshot.queryParams['forceQuestionId']
                ? this.route.snapshot.queryParams['forceQuestionId']
                : 0;
            // const uncompletedTrials = this.getUncompletedTrials();
            let category = this.getCategory();
            if (isGameMode) {
                // category = uncompletedTrials[0].category;
                // this.changeCategory(category, uncompletedTrials[0].trial - 1);
                category = 'none';
            }
            this.globalExplanationService
                .getNextOneShotGameQuestion(this.getWorkerId(), this.getAssignmentId(), forceQuestionId, this.modality, category, 0)
                .subscribe(response => {
                    // this.trial += 1;
                    // this.overrideAnnotationWithNewExplanation(response.body.annotation); // Use the newest explanations from Kerry/Jialin
                    this.blurQuestion = response.body;
                    console.log('Completed For This Assignment: ' + this.getCompletedCountForThisAssignment());
                    console.log('Completed Total: ' + this.blurQuestion.completedTotal);
                    if (this.reachedAssignmentQuota() || this.reachedMaxQuota()) {
                        // User completed all questions or reached quota
                        this.showPreamble = false;
                        this.showGameComplete = true;
                        this.showProgressSpinner = false;
                    } else {
                        this.initNewQuestion(this.blurQuestion);
                    }
                });
        });
    }

    didUserChangeSort(): boolean {
        for (let i = 0; i < this.currentAnnotation.userSortedFeatures.length; ++i) {
            if (this.currentAnnotation.intialSortOrder[i] !== this.currentAnnotation.userSortedFeatures[i]) {
                return true;
            }
        }
        return false;
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
                if (this.oneShotAnswer.id !== '') {
                    this.globalExplanationService
                        .saveOneShotFeedback(
                            this.oneShotAnswer.id,
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
        return !this.isGamePaused() && !this.imageChosen;
    }

    isGamePaused() {
        if (this.messages.length > 0 || this.showRewardButton) {
            return true;
        }
        return false;
    }

    shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    initNewQuestion(blurQuestion: BlurQuestion) {
        this.selectedAnswer = '';
        this.bonusCase = new BonusCase();
        this.blurStep = this.blurStepInitial;
        this.collapseAnswerPanel = true;
        this.showComponentOverlay = true;

        this.blurQuestion.annotations = this.shuffleArray([].concat(this.blurQuestion.annotations));
        for (const annotation of this.blurQuestion.annotations) {
            // annotation.userSortedFeatures = annotation.userSortedFeatures.slice(0, 10);
            annotation.componentExplanation = [].concat(annotation.userSortedFeatures);
            annotation.userSortedFeatures = this.shuffleArray([].concat(annotation.componentExplanation));
            const index = annotation.userSortedFeatures.findIndex(item => item.class === this.excludeBelow.class);
            annotation.userSortedFeatures.splice(index, 1);
            annotation.userSortedFeatures.push(this.excludeBelow);
            annotation.intialSortOrder = [].concat(annotation.userSortedFeatures);
        }

        this.blurQuestion.annotation = blurQuestion.annotations[0];
        this.currentAnnotation = blurQuestion.annotation;
        this.oneShotAnswer = new OneShotAnswer();
        this.calcSimilaritryScore();
        this.loadComplete = true;
    }

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
        // const category = this.route.snapshot.queryParams['category'];
        // if (category) {
        //     return category;
        // } else {
        //     return 'soccer';
        // }
        if (this.currentAnnotation) {
            return this.currentAnnotation.topAnswer;
        }
        return '';
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
        if (this.blurQuestion.completedInAssignment + 1 >= this.blurQuestion.maxTrials) {
            return true;
        }
        return false;
    }
    reachedAssignmentQuota(): boolean {
        if (this.blurQuestion.completedInAssignment >= this.blurQuestion.maxTrials) {
            return true;
        }
        return false;
    }

    reachedMaxQuota(): boolean {
        if (this.blurQuestion.completedInAssignment >= this.blurQuestion.maxTrials) {
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
                    this.oneShotAnswer.id = ''; // Prevent 2nd saveFeedback in getNextTrial
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
        if (this.isAnswerModality()) {
            allLikertQuestions = [].concat(this.allLikertQuestionsAnswer);
            this.addLikertQuestion(allLikertQuestions, 0); // Pinned question;
        } else {
            allLikertQuestions = [].concat(this.allLikertQuestionsExplanation);
            this.addLikertQuestion(allLikertQuestions, 0); // Pinned question;
        }
        allLikertQuestions.sort(() => Math.random() - 0.5);
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
        allLikertQuestions.splice(index, 1);
    }

    requireLikertQuestions() {
        // if (this.testLoopTimeout) {
        //     // Disable likert questions for test mode
        //     return false;
        // }
        // if (!this.isNoModality() && (this.isAnswerModality() && this.isMentalModeling()) === false) {
        //     return true;
        // }
        return false;
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
        this.globalExplanationService.deleteOneShotAnswersByWorkerId(this.getWorkerId()).subscribe(response => {
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

    isBelowExcluded(component): boolean {
        const excludeBelowIndex = this.currentAnnotation.userSortedFeatures.indexOf(this.excludeBelow);
        if (this.currentAnnotation.userSortedFeatures.indexOf(component) > excludeBelowIndex) {
            return true;
        }
        return false;
    }

    submitOneShot() {
        if (!this.didUserChangeSort()) {
            this.confirmationService.confirm({
                key: 'Info',
                header: 'No change detected',
                rejectVisible: false,
                acceptLabel: 'Ok',
                message: 'Please sort the list first',
                accept: () => {}
            });
        } else {
            this.confirmationService.confirm({
                message: 'Are you sure you want to submit the current list sorting?',
                accept: () => {
                    if (this.showProgressSpinner === false) {
                        this.showProgressSpinner = true;
                        this.selectedAnswer = this.currentAnnotation.modelAnswer;
                        try {
                            this.oneShotAnswer.hitId = this.route.snapshot.queryParams['hitId'];
                            this.oneShotAnswer.requestedOn = this.blurQuestion.requestedOn;
                            this.oneShotAnswer.sandbox = this.isSandbox();
                            this.oneShotAnswer.assignmentId = this.getAssignmentId();
                            this.oneShotAnswer.workerId = this.getWorkerId();
                            this.oneShotAnswer.modality = this.modality;
                            this.oneShotAnswer.sandbox = this.isSandbox();
                            this.oneShotAnswer.category = this.getCategory();
                            this.oneShotAnswer.trial = this.getCompletedTrialCount();
                            this.oneShotAnswer.selectedQuestionId = this.currentAnnotation.question_id;
                            this.oneShotAnswer.levenshtein = this.levenshtein;
                            this.oneShotAnswer.kendallsTau = this.kendallsTauA;
                            this.oneShotAnswer.annotations = [].concat(this.currentAnnotation);
                            this.oneShotAnswer.correctQuestionId = this.blurQuestion.correctQuestionId;
                            const initalSort = this.currentAnnotation.intialSortOrder.map(item => {
                                return item['class'];
                            });
                            this.oneShotAnswer.initalSort = initalSort.join(',');
                            this.globalExplanationService.saveOneShot(this.oneShotAnswer).subscribe(response => {
                                this.messages.push({
                                    severity: 'success',
                                    summary: 'Image and list submitted successfully',
                                    detail: ''
                                });
                                const id = response.headers.get('x-equasapp-params');
                                console.log(id);
                                // this.markCurrentTrialCompleted();
                                // this.getNextTrial(true);
                                this.oneShotAnswer.id = response.headers.get('x-equasapp-params');
                                // this.markCurrentTrialCompleted();
                                if (this.isLastQuestion()) {
                                    console.log('Assignment Quota Reached');
                                    // this.showGameComplete = true; <- Not necessary to show because Mturk redirects to HIT list after reward is given
                                    // if (this.isMTurk()) {
                                    // Give Turker their reward
                                    // this.giveAssignmentReward();
                                    this.showRewardButton = true;
                                    // }
                                }
                                this.attempt += 1;
                                // this.blurAnswer = new BlurAnswer();
                                if (this.is_touch_device() === false) {
                                    if (this.answerInputContol) {
                                        this.answerInputContol.focusInput();
                                    }
                                }
                                this.showProgressSpinner = false;
                            });
                        } catch (e) {
                            this.showProgressSpinner = false;
                            this.logError(e);
                        }
                        this.showComponentOverlay = true;
                    }
                }
            });
        }
    }

    drop(event: CdkDragDrop<string[]>) {
        if (event.previousContainer !== event.container) {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        } else {
            moveItemInArray(this.currentAnnotation.userSortedFeatures, event.previousIndex, event.currentIndex);
        }
    }
}
