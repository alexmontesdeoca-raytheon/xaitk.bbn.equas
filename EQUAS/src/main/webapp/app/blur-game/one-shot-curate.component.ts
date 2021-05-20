import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
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
    templateUrl: './one-shot-curate.component.html',
    providers: [MessageService],
    styleUrls: ['blur-game.scss']
})
export class OneShotCurateComponent implements OnInit, OnDestroy {
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
    // componentExplanations = require('./fe_preprocessed_component_explanations.json');
    showComponentOverlay = true;
    selectedComponent;
    testLoopTimeout;
    Statistics = require('./statistics.min.js');
    kendallsTauA = 0;
    categories = [
        'soccer',
        'tennis',
        'baseball',
        'skiing',
        'skateboarding',
        'surfing',
        'eating',
        'snowboarding',
        'standing',
        'sitting',
        'walking',
        'flying kite',
        'sleeping',
        'cooking',
        'playing frisbee',
        'talking on phone',
        'frisbee',
        'pizza',
        'water',
        'grass',
        'cat',
        'dog',
        'kite',
        'horse',
        'phone',
        'cake',
        'giraffe',
        'bus',
        'motorcycle',
        'elephant',
        'hat',
        'bathroom',
        'kitchen',
        'living room',
        'beach',
        'bedroom',
        'street',
        'city',
        'sidewalk',
        'airport',
        'ocean',
        'ground',
        'mountains',
        'restaurant',
        'office',
        'train station'
    ];
    trialsCookie = 'trials_V1';
    trials = [
        {
            category: 'soccer',
            trial: 1,
            completed: false
        },
        {
            category: 'tennis',
            trial: 2,
            completed: false
        },
        {
            category: 'skiing',
            trial: 6,
            completed: false
        },
        {
            category: 'skateboarding',
            trial: 10,
            completed: false
        },
        {
            category: 'surfing',
            trial: 4,
            completed: false
        },
        {
            category: 'flying kite',
            trial: 3,
            completed: false
        },
        {
            category: 'talking on phone',
            trial: 4,
            completed: false
        },
        {
            category: 'pizza',
            trial: 1,
            completed: false
        },
        {
            category: 'cat',
            trial: 3,
            completed: false
        },
        {
            category: 'dog',
            trial: 2,
            completed: false
        },
        {
            category: 'kite',
            trial: 20,
            completed: false
        },
        {
            category: 'horse',
            trial: 6,
            completed: false
        },
        {
            category: 'cake',
            trial: 5,
            completed: false
        },
        {
            category: 'bus',
            trial: 1,
            completed: false
        },
        {
            category: 'motorcycle',
            trial: 2,
            completed: false
        },
        {
            category: 'bathroom',
            trial: 3,
            completed: false
        },
        {
            category: 'beach',
            trial: 15,
            completed: false
        },
        {
            category: 'bedroom',
            trial: 7,
            completed: false
        },
        {
            category: 'kitchen',
            trial: 7,
            completed: false
        },
        {
            category: 'mountains',
            trial: 1,
            completed: false
        }
    ];

    trial = 0;
    excludeBelow = {
        rgb: [228, 26, 28],
        class: '--- Move any features you think should be excluded below this line ---'
    };

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

            if (this.trialsCookie in localStorage === false) {
                localStorage.setItem(this.trialsCookie, JSON.stringify(this.trials));
            } else {
                this.trials = JSON.parse(localStorage.getItem(this.trialsCookie));
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
                this.globalExplanationService
                    .hasWorkerAlreadyParticipatedInAnotherModality(this.getWorkerId(), this.modality)
                    .subscribe(response => {
                        if (response.body === true) {
                            console.log('Worker (' + this.getWorkerId() + ') has already participated in another modality.');
                            this.showPreamble = false;
                            this.showAlreadyParticipated = true;
                        } else {
                            setTimeout(() => {
                                // Give the GUI/Spinner time to draw before building dataset
                                this.getGlobalExplanationDataset();
                            }, 400);
                        }
                    });
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

    getGlobalExplanationDataset() {
        console.log('Get Global Explanation - ' + this.gefilter);
        this.loadComplete = false;
        this.globalExplanationService.getBlurGameParams().subscribe(blurGameParams => {
            this.blurMax = blurGameParams.body.blurMax;
            this.blurStep = blurGameParams.body.blurStep;
            this.blurStepInitial = blurGameParams.body.blurStep;
            this.blurModifier = blurGameParams.body.blurModifier;
            this.blurLimit = blurGameParams.body.blurLimit;
            this.allowFeedback = blurGameParams.body.allowFeedback;
            this.bonusPay = blurGameParams.body.bonusPay;
            this.maxBonusPayout = blurGameParams.body.maxBonusPayout;
            this.maxQuestionsPerWorker = blurGameParams.body.maxQuestionsPerWorker;
            if (this.isMTurk()) {
                this.questionsPerHit = blurGameParams.body.questionsPerHit;
            } else {
                // If the user is not using the blur game throught MTurk then let the questionsPerHit be the full allotment
                this.questionsPerHit = blurGameParams.body.maxQuestionsPerWorker;
            }
            // this.globalExplanationService.getBlurGameQuestions().subscribe(response => {
            //     // this.allAnnotations = response.body.sort((a, b) => (a.topN[0].score < b.topN[0].score) ? 1 : ((b.topN[0].score < a.topN[0].score) ? -1 : 0));
            //     this.allAnnotations = response.body.filter(a => !blurGameParams.body.excludedQuestionIds.includes(a.question_id));
            //     this.getRandomUncompletedQuestion();
            // });
            this.getNextTrial(true);
            this.globalExplanationService.getAllUniqueAnswers().subscribe(response => {
                this.allUniqueAnswers = response.body.sort();
                // Remove excluded Answer Options
                for (const answerOption of blurGameParams.body.excludedAnswerOptions) {
                    const index = this.allUniqueAnswers.indexOf(answerOption);
                    if (index !== -1) {
                        this.allUniqueAnswers.splice(index, 1);
                    }
                }
            });
        });
    }
    markCurrentTrialCompleted() {
        const uncompletedTrials = this.getUncompletedTrials();
        if (uncompletedTrials.length > 0) {
            if (uncompletedTrials[0].category === this.getCategory() && uncompletedTrials[0].trial === this.trial) {
                uncompletedTrials[0].completed = true;
                localStorage.setItem(this.trialsCookie, JSON.stringify(this.trials));
            }
        }
    }
    getCompletedTrialCount() {
        const result = this.trials.length - this.getUncompletedTrials().length + 1;
        if (!this.isGamePaused()) {
            return result;
        } else {
            return result - 1;
        }
    }
    getUncompletedTrials() {
        return this.trials.filter(trial => trial.completed === false);
    }

    getNextTrial(isGameMode: boolean) {
        this.showProgressSpinner = true;
        this.messages.length = 0;
        this.attempt = 1;
        this.saveFeedback(false).then(result => {
            console.log(result);
            const forceQuestionId = this.route.snapshot.queryParams['forceQuestionId']
                ? this.route.snapshot.queryParams['forceQuestionId']
                : 0;
            if (this.reachedAssignmentQuota() || this.reachedMaxQuota()) {
                // User completed all questions or reached quota
                this.showPreamble = false;
                this.showGameComplete = true;
                this.showProgressSpinner = false;
            } else {
                const uncompletedTrials = this.getUncompletedTrials();
                let category = this.getCategory();
                if (isGameMode) {
                    category = uncompletedTrials[0].category;
                    this.changeCategory(category, uncompletedTrials[0].trial - 1);
                }
                this.globalExplanationService
                    .getNextOneShotGameQuestion(
                        this.getWorkerId(),
                        this.getAssignmentId(),
                        forceQuestionId,
                        this.modality,
                        category,
                        this.trial
                    )
                    .subscribe(response => {
                        this.trial += 1;
                        // this.overrideAnnotationWithNewExplanation(response.body.annotation); // Use the newest explanations from Kerry/Jialin
                        this.blurQuestion = response.body;
                        console.log('Completed For This Assignment: ' + this.getCompletedCountForThisAssignment());
                        console.log('Completed Total: ' + this.blurQuestion.completedTotal);
                        this.initNewQuestion(this.blurQuestion);
                    });
            }
        });
    }

    getSimilaritryScore(): number {
        const userSort = this.currentAnnotation.userSortedFeatures.map(item => {
            return item['class'];
        });

        const origSort = this.currentAnnotation.componentExplanation.map(item => {
            return item['class'];
        });
        const indx = userSort.indexOf(this.excludeBelow.class);
        if (indx !== -1) {
            userSort.splice(indx, 1);
        }
        // userSort.pop();
        // return this.getSimilaritry(userSort, origSort);

        const testData = [];
        for (let index = 0; index < userSort.length; index++) {
            const word = userSort[index];
            const userIndex = index;
            const origIndex = origSort.indexOf(word);
            testData.push({ user: userIndex, orig: origIndex });
        }
        const testVars = { user: 'ordinal', orig: 'ordinal' };
        const stats = new this.Statistics(testData, testVars);
        const kendallsTau = stats.kendallsTau('user', 'orig');
        this.kendallsTauA = kendallsTau.a.tauA;
        return this.levenshtein(userSort, origSort);
    }

    // getSimilaritry(a: string[], b: string[]): number {
    //     return a.map((val, index) => {
    //       // calculate the position offset and divide by the length to get each
    //       // values similarity score
    //       const posOffset = Math.abs(b.indexOf(val) - index);
    //       return posOffset / a.length;
    //     }).reduce((curr, prev) => {
    //       // divide the current value by the length and subtract from
    //       // one to get the contribution to similarity
    //       return (1 - curr / a.length) + prev;
    //     });
    //   }

    // levenshtein(a, b) {
    //     let t = [], u, i, j, m = a.length, n = b.length;
    //     if (!m) { return n; }
    //     if (!n) { return m; }
    //     for (j = 0; j <= n; j++) { t[j] = j; }
    //     for (i = 1; i <= m; i++) {
    //       for (u = [i], j = 1; j <= n; j++) {
    //         u[j] = a[i - 1] === b[j - 1] ? t[j - 1] : Math.min(t[j - 1], t[j], u[j - 1]) + 1;
    //       } t = u;
    //     } return u[n];
    // }

    levenshtein = (a, b) => {
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

    // overrideAnnotationWithNewExplanation(oldAnnotation: Annotation) {
    //     const newComponentExplanation = this.componentExplanations[oldAnnotation.question_id];
    //     if (newComponentExplanation) {
    //         oldAnnotation.modelAnswer = newComponentExplanation.answer;
    //         oldAnnotation.explanationHtml = newComponentExplanation.explanationHtml;
    //         // oldAnnotation.topAnswer = newComponentExplanation.top_turker_answer;
    //     }
    // }

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
        if (!this.isNoModality()) {
            let correctBlurLevelModified = this.blurQuestion.correctBlurLevel + this.blurModifier;
            if (correctBlurLevelModified > 98) {
                correctBlurLevelModified = 98;
            }
            this.blurAmount = 0; // correctBlurLevelModified;
        } else {
            this.blurAmount = this.blurMax;
        }
        this.blurStep = this.blurStepInitial;
        this.collapseAnswerPanel = true;
        this.showComponentOverlay = true;
        for (const annotation of blurQuestion.annotations) {
            annotation.userSortedFeatures = [].concat(annotation.componentExplanation); // .slice(0, 10);
            // annotation.userSortedFeatures = this.shuffleArray([].concat(annotation.componentExplanation)); // .slice(0, 10);
            annotation.userSortedFeatures.push(this.excludeBelow);
        }

        this.blurQuestion.annotation = blurQuestion.annotations[0];
        this.currentAnnotation = blurQuestion.annotation;
        this.oneShotAnswer = new OneShotAnswer();
        if (!this.isNoModality()) {
            this.setRandomLikertQuestions(2);
            this.userOverride = false;
            if (this.isMentalModeling()) {
                this.blurAmount = 0;
                this.userOverride = false;
            }
        } else {
            this.userOverride = true;
        }
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

    changeCategory(category: string, trial: number) {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                category
            },
            queryParamsHandling: 'merge'
        });
        this.trial = trial;
    }

    getCategory() {
        const category = this.route.snapshot.queryParams['category'];
        if (category) {
            return category;
        } else {
            return 'soccer';
        }
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

    reachedAssignmentQuota(): boolean {
        if (this.getUncompletedTrials().length <= 0) {
            return true;
        }
        return false;
    }

    reachedMaxQuota(): boolean {
        if (this.getUncompletedTrials().length <= 0) {
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
        this.getGlobalExplanationDataset();
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
                    this.getGlobalExplanationDataset();
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
        localStorage.removeItem(this.trialsCookie);
        this.messageService.add({
            severity: 'success',
            summary: 'Success!',
            detail: 'Refresh your browser to restart the game.'
        });
        // this.globalExplanationService.deleteWorkerById(this.getWorkerId()).subscribe(response => {
        //     this.messageService.add({
        //         severity: 'success',
        //         summary: 'Success!',
        //         detail: 'Refresh your browser.'
        //     });
        // });
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
        this.confirmationService.confirm({
            message: 'Are you sure you want to submit this particular image along with the current list sorting?',
            accept: () => {
                // Actual logic to perform a confirmation
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
                        this.oneShotAnswer.trial = this.trial;
                        this.oneShotAnswer.selectedQuestionId = this.currentAnnotation.question_id;
                        this.oneShotAnswer.annotations = [].concat(this.blurQuestion.annotations);
                        // if (confidence === 1 || this.blurAmount <= this.blurLimit) {
                        //     this.blurAnswer.isFinalAnswer = true;
                        // }
                        // this.blurAnswer.modality = this.modality;
                        // this.blurAnswer.sessionId = this.sessionId;
                        // this.blurAnswer.qId = this.currentAnnotation.question_id;
                        // this.blurAnswer.imgId = this.currentAnnotation.imageName;
                        // this.blurAnswer.answer = this.selectedAnswer;
                        // this.blurAnswer.groundTruth = this.currentAnnotation.topAnswer;
                        // this.blurAnswer.modelAnswer = this.currentAnnotation.modelAnswer;
                        // this.blurAnswer.userConfidence = confidence;
                        // this.blurAnswer.blurAmount = this.blurAmount;
                        // this.blurAnswer.attempt = this.attempt;
                        // // MTurk params
                        // this.blurAnswer.hitId = this.route.snapshot.queryParams['hitId'];
                        // this.blurAnswer.sandbox = this.isSandbox();
                        // this.blurAnswer.assignmentId = this.getAssignmentId();
                        // this.blurAnswer.workerId = this.getWorkerId();
                        // this.blurAnswer.userOverride = this.userOverride;
                        // // const sessionMs = new Date().getTime() - this.sessionStart.getTime();
                        // // this.blurAnswer.sessionTime = Math.round(sessionMs / 1000); // seconds
                        // this.blurAnswer.requestedOn = this.blurQuestion.requestedOn;
                        // if (this.isMentalModeling()) {
                        //     if (this.selectedAnswer === 'Correctly') {
                        //         if (this.currentAnnotation.modelAnswer === this.currentAnnotation.topAnswer) {
                        //             this.blurAnswer.isCorrect = true;
                        //             if (this.blurQuestion.bonusPayTotal < this.maxBonusPayout) {
                        //                 // Pay bonus if max payout is not exceeded
                        //                 this.blurAnswer.bonus = this.bonusPay;
                        //                 this.blurQuestion.bonusPayTotal += this.bonusPay;
                        //             }
                        //         } else {
                        //             this.blurAnswer.isCorrect = false;
                        //         }
                        //     } else if (this.selectedAnswer === 'Incorrectly') {
                        //         if (this.currentAnnotation.modelAnswer === this.currentAnnotation.topAnswer) {
                        //             this.blurAnswer.isCorrect = false;
                        //         } else {
                        //             this.blurAnswer.isCorrect = true;
                        //             if (this.blurQuestion.bonusPayTotal < this.maxBonusPayout) {
                        //                 // Pay bonus if max payout is not exceeded
                        //                 this.blurAnswer.bonus = this.bonusPay;
                        //                 this.blurQuestion.bonusPayTotal += this.bonusPay;
                        //             }
                        //         }
                        //     }
                        // } else {
                        //     this.blurAnswer.isCorrect = this.getCorrectAnswer() === this.selectedAnswer;

                        //     if (!this.isNoModality()) {
                        //         this.bonusCase = this.getBonusMultiplier();
                        //         if (this.blurQuestion.bonusPayTotal < this.maxBonusPayout) {
                        //             // Pay bonus if max payout is not exceeded
                        //             this.blurAnswer.bonus = this.bonusPay * this.bonusCase.multiplier;
                        //             this.blurQuestion.bonusPayTotal += this.blurAnswer.bonus;
                        //         }
                        //     }
                        // }
                        // this.blurAnswer.blurStrategy = this.blurStrategy;
                        // try {
                        //     this.blurAnswer.orgW = this.pixelateFilter.originalWidth;
                        //     this.blurAnswer.orgH = this.pixelateFilter.originalHeight;
                        //     this.blurAnswer.blurRadius = this.pixelateFilter.blurRadius;
                        //     if (this.blurStrategy === 'Gaussian') {
                        //         const el = this.imgBlurGaussian.nativeElement;
                        //         this.blurAnswer.newW = this.pixelateFilter.constrainedWidth();
                        //         this.blurAnswer.newH = this.pixelateFilter.constrainedHeight();
                        //     } else if (this.blurStrategy === 'Downsample') {
                        //         this.blurAnswer.newW = this.pixelateFilter.newWidth;
                        //         this.blurAnswer.newH = this.pixelateFilter.newHeight;
                        //         // this.blurAnswer.scale = this.pixelateFilter.downSampleScale;
                        //     }

                        //     this.blurAnswer.zoom = Math.round(window.devicePixelRatio * 100); // Browser Zoom Level
                        //     this.blurAnswer.screenW = window.screen.width;
                        //     this.blurAnswer.screenH = window.screen.height;
                        // } catch (error) {
                        //     console.error('Unable to detect dimensions: ' + error.message);
                        // }
                        // this.selectedAnswer = '';
                        // this.filteredAnswers = [];
                        this.globalExplanationService.saveOneShot(this.oneShotAnswer).subscribe(response => {
                            this.messages.push({
                                severity: 'success',
                                summary: 'Image / List Submitted Successfully',
                                detail: 'Click the button below to continue'
                            });
                            const id = response.headers.get('x-equasapp-params');
                            console.log(id);
                            // this.markCurrentTrialCompleted();
                            // this.getNextTrial(true);
                            this.oneShotAnswer.id = response.headers.get('x-equasapp-params');
                            this.markCurrentTrialCompleted();
                            if (this.reachedAssignmentQuota()) {
                                console.log('Assignment Quota Reached');
                                // this.showGameComplete = true; <- Not necessary to show because Mturk redirects to HIT list after reward is given
                                // if (this.isMTurk()) {
                                // Give Turker their reward
                                // this.giveAssignmentReward();
                                this.showRewardButton = true;
                                // }
                            }
                            // this.blurAnswerHistory.push(this.blurAnswer);
                            // if (this.blurAnswer.isFinalAnswer) {
                            //     // this.messageService.add({ severity: 'success', summary: 'The correct answer was (' + this.currentAnnotation.topAnswer + ')'});
                            //     // const blurPct = Math.round((this.blurAmount / this.blurMax) * 100);

                            //     if (this.blurAnswer.isCorrect) {
                            //         if (this.isMentalModeling()) {
                            //             this.messages.push({
                            //                 severity: 'success',
                            //                 summary: 'You guessed "' + this.blurAnswer.answer + '".',
                            //                 detail: this.robotIncorrectMessage()
                            //             });
                            //         } else {
                            //             this.messages.push({
                            //                 severity: 'success',
                            //                 summary: 'Thats correct!',
                            //                 detail: ' The answer is (' + this.blurAnswer.answer + ')' + '<br>' + this.bonusCase.bonusMessage
                            //             });
                            //         }
                            //     } else {
                            //         if (this.isMentalModeling()) {
                            //             this.messages.push({
                            //                 severity: 'error',
                            //                 summary: 'You guessed "' + this.blurAnswer.answer + '".',
                            //                 detail: this.robotIncorrectMessage()
                            //                 // '<br> The smart robot answered incorrectly with (' +
                            //                 // this.currentAnnotation.modelAnswer +
                            //                 // ').' +
                            //                 // '<br> The correct answer was (' +
                            //                 // this.currentAnnotation.topAnswer +
                            //                 // ')'
                            //                 // +
                            //                 // '<br> The top answer by other Turkers is (' +
                            //                 // this.currentAnnotation.topAnswer +
                            //                 // ')'
                            //             });
                            //         } else {
                            //             this.messages.push({
                            //                 severity: 'error',
                            //                 summary: 'Wrong Answer!',
                            //                 detail:
                            //                     ' The correct answer was (' +
                            //                     this.getCorrectAnswer() +
                            //                     ').' +
                            //                     '<br> You answered with (' +
                            //                     this.blurAnswer.answer +
                            //                     ')' +
                            //                     '<br>' +
                            //                     this.bonusCase.bonusMessage
                            //             });
                            //         }
                            //     }
                            //     this.deBlurAnimate(0, this.blurAmount / 15);
                            //     this.blurQuestion.completedInAssignment += 1;
                            //     this.blurQuestion.completedTotal += 1;
                            //     if (this.blurAnswer.isCorrect) {
                            //         this.blurQuestion.answersCorrect += 1;
                            //     } else {
                            //         this.blurQuestion.answersWrong += 1;
                            //     }
                            //     console.log('CompletedCountForThisAssignment: ' + this.getCompletedCountForThisAssignment());
                            //     if (this.reachedAssignmentQuota()) {
                            //         console.log('Assignment Quota Reached');
                            //         // this.showGameComplete = true; <- Not necessary to show because Mturk redirects to HIT list after reward is given
                            //         if (this.isMTurk()) {
                            //             // Give Turker their reward
                            //             // this.giveAssignmentReward();
                            //             this.showRewardButton = true;
                            //         }
                            //     }
                            // } else {
                            //     this.deBlur();
                            // }
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
