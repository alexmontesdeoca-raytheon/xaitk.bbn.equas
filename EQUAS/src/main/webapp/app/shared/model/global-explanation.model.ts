export interface IGlobalExplanation {
    id?: string;
    name?: string;
}

export class GlobalExplanation implements IGlobalExplanation {
    constructor(public id?: string, public name?: string) {}
}

export class GlobalExplanationStatistics {
    questionsTotal: number;
    questionsUnique: number;
    answersTotal: number;
    answersUnique: number;
    imageCount: number;
    modelAnswersUnique: number;
    modelAnswersCorrect: number;
    modelAnswersCorrectByIndex: any;
    turkerConsensus: any;
    turkerConsensusInTop5: any;
    turkerConsensusInTop1: any;
}
export class GlobalExplanationDataset {
    statistics = new GlobalExplanationStatistics();
    questionCsv = '';
    questionCsvArray = [];
    answers = [];

    modelAnswers = [];
    modelAnswerTable = [];

    answerTable = [];
    questionTableModel = new QuestionTableDialogModel();
    log = new TaskLog();
}

export class TaskLog {
    items: TaskEntry[] = [];
    previousTask: TaskEntry;
    public endTask() {
        if (this.previousTask !== undefined && this.previousTask.endTime === undefined) {
            this.previousTask.endTask();
        }
    }
    public startTask(taskName: string) {
        this.endTask();
        const newTask = new TaskEntry(taskName);
        this.previousTask = newTask;
        this.items.push(newTask);
        return newTask;
    }
}
export class TaskEntry {
    name: string;
    startTime = new Date().getTime();
    endTime: number; // = this.startTime;
    durationMs: number;
    constructor(name?: string) {
        this.name = name;
    }
    public endTask() {
        this.endTime = new Date().getTime();
        this.durationMs = this.endTime - this.startTime;
    }
}

export class Answer {
    answer = '';
}
export class AnswerScore {
    answer = '';
    score = 0;
}
export class Annotation {
    pairBlurStats = new PairBlurStats();
    imageName = '';
    answers: Answer[] = [];
    question = ''; // required for Images with answer

    modelAnswer = '';
    topAnswer = '';
    question_id = '';
    explanationHtml = '';
    topN: AnswerScore[] = [];
    componentExplanation: any[];
    consensus = 0;
    userSortedFeatures: any[];
    intialSortOrder: any[];

    public get delta1_2(): number {
        return this.topN[0].score - this.topN[1].score;
    }
    public get delta2_3(): number {
        return this.topN[1].score - this.topN[2].score;
    }
    public get delta3_4(): number {
        return this.topN[2].score - this.topN[3].score;
    }
    public get getSlope1_2(): number {
        return this.delta1_2 - this.delta2_3;
    }
    public get getSlope2_3(): number {
        return this.delta2_3 - this.delta3_4;
    }
}
export class QuestionStat {
    count = 0;
    annotations: Annotation[] = [];
}

export class QuestionTableItem {
    question = '';
    count = 0;
    correctCount = 0;
    answers = [];
    modelAnswers = [];
    answerFreqMap = {};
    modelAnswerFreqMap = {};
    totalAnswerCount = 0;
    public get uniqueTurkerAnswerCount(): number {
        return this.answers.length;
    }
    public get uniqueModelAnswerCount(): number {
        return this.modelAnswers.length;
    }
    public get correctCountPercent(): number {
        return this.correctCount / this.count;
    }
    public get topTurkerAnswer1(): string {
        return this.answers[0].answer;
    }
    public get topTurkerAnswer1Count(): number {
        return this.answers[0].count;
    }
    public get topModelAnswer1(): string {
        return this.getTopModelAnswer(1);
    }
    public get topModelAnswer1Count(): number {
        return this.getTopModelAnswerCount(1);
    }
    public get topTurkerAnswer2(): string {
        return this.getTopTurkerAnswer(2);
    }
    public get topTurkerAnswer2Count(): number {
        return this.getTopTurkerAnswerCount(2);
    }
    public get topModelAnswer2(): string {
        return this.getTopModelAnswer(2);
    }
    public get topModelAnswer2Count(): number {
        return this.getTopModelAnswerCount(2);
    }
    public get topTurkerAnswer3(): string {
        return this.getTopTurkerAnswer(3);
    }
    public get topTurkerAnswer3Count(): number {
        return this.getTopTurkerAnswerCount(3);
    }
    public get topModelAnswer3(): string {
        return this.getTopModelAnswer(3);
    }
    public get topModelAnswer3Count(): number {
        return this.getTopModelAnswerCount(3);
    }
    public get topTurkerAnswer4(): string {
        return this.getTopTurkerAnswer(4);
    }
    public get topTurkerAnswer4Count(): number {
        return this.getTopTurkerAnswerCount(4);
    }
    public get topModelAnswer4(): string {
        return this.getTopModelAnswer(4);
    }
    public get topModelAnswer4Count(): number {
        return this.getTopModelAnswerCount(4);
    }
    public get topTurkerAnswer5(): string {
        return this.getTopTurkerAnswer(5);
    }
    public get topTurkerAnswer5Count(): number {
        return this.getTopTurkerAnswerCount(5);
    }
    public get topModelAnswer5(): string {
        return this.getTopModelAnswer(5);
    }
    public get topModelAnswer5Count(): number {
        return this.getTopModelAnswerCount(5);
    }

    public getTopTurkerAnswer(index: number): string {
        if (this.answers.length > index - 1) {
            return this.answers[index - 1].answer;
        }
        return '';
    }
    public getTopTurkerAnswerCount(index: number): number {
        if (this.answers.length > index - 1) {
            return this.answers[index - 1].count;
        }
        return null;
    }

    public getTopModelAnswer(index: number): string {
        if (this.modelAnswers.length > index - 1) {
            return this.modelAnswers[index - 1].answer;
        }
        return '';
    }
    public getTopModelAnswerCount(index: number): number {
        if (this.modelAnswers.length > index - 1) {
            return this.modelAnswers[index - 1].count;
        }
        return null;
    }
    public doAnswersMatch(index: number): boolean {
        return this.getTopTurkerAnswer(index) === this.getTopModelAnswer(index);
    }
    public doAnswersMatchColor(index: number): string {
        if (!this.doAnswersMatch(index)) {
            return 'goldenrod';
        }
        return '';
    }
    constructor(question?: string, correctCount?: number, count?: number) {
        this.question = question;
        this.count = count;
        this.correctCount = correctCount;
    }
}

export class QuestionTableDialogModel {
    display = false;
    dataset: QuestionTableItem[] = [];
    questionFilterMatchMode = 'startsWith';
    questionFilter = '';
    countFilter = 0;
    countFilterMax = 0;
    uniqueTurkerAnswerCountFilter = 0;
    uniqueTurkerAnswerCountMax = 0;
    title = '';
    nTopAnswers = 2;
    nTopAnswersArray;
    matchModeOptions = [
        { label: 'Starts with', value: 'startsWith' },
        { label: 'Contains', value: 'contains' },
        { label: 'Equals', value: 'equals' },
        { label: 'Ends With', value: 'endsWith' }
    ];

    setNTopAnswersArray() {
        // https://stackoverflow.com/questions/6299500/tersest-way-to-create-an-array-of-integers-from-1-20-in-javascript
        this.nTopAnswersArray = Array(Number(this.nTopAnswers))
            .fill(0)
            .map((x, i) => i + 1);
    }
    public selectAnswer(answer) {
        this.dataset = answer.questions;
        this.title = answer.answer;
        this.display = true;
    }
    constructor() {
        this.setNTopAnswersArray();
    }
}

export class AnnotationDialogModel {
    display = false;
    annotations: Annotation[] = [];
    filterText = '';
    filterOptions = [
        {
            label: 'Model Answer',
            value: 'modelAnswer'
        },
        {
            label: 'Top Turker Answer',
            value: 'topAnswer'
        },
        {
            label: 'Question Id',
            value: 'question_id'
        }
    ];
    selectedFilter = this.filterOptions[0].value;
    type = '';
    value = '';
    autoSearchForRejectedAlternatives = false;

    displaySelected = false;
    selectedAnnotation: Annotation;
    public selectAnnotation(annotation: Annotation) {
        this.autoSearchForRejectedAlternatives = false;
        this.selectedAnnotation = annotation;
        this.displaySelected = true;
    }
    public searchForRejectedAlternatives(annotation: Annotation) {
        this.autoSearchForRejectedAlternatives = true;
        this.selectedAnnotation = annotation;
        this.displaySelected = true;
    }
}

export class VqaPlaygroundDialogModel {
    display = false;
    defaultImage = '';
    autoAskQuestion = '';
    autoAskGroundTruth = '';
    title = '';
    public displayImage(imageName, autoAskQuestion, autoAskGroundTruth) {
        this.defaultImage = imageName;
        this.autoAskQuestion = autoAskQuestion;
        this.autoAskGroundTruth = autoAskGroundTruth;
        this.display = true;
    }
}
export enum TestCondition {
    GodMode = 1,
    AlwaysYes,
    AlwaysNo,
    AlwaysNoCorrect,
    AlwaysYesWithFeedback,
    AlwaysNoWithFeedback
}
export class BonusCase {
    case = 0;
    bonusMessage = '';
    multiplier = 0;
}

export class BlurQuestion {
    correctBlurLevel = 0;
    completedInAssignment = 0;
    completedTotal = 0;
    answersCorrect = 0;
    answersWrong = 0;
    annotation: Annotation;
    requestedOn: Date;
    bonusPayTotal: 0;

    annotations: Annotation[];
    maxTrials = 0;
    score = 0;
    correctQuestionId = '';
}

export class BlurLevel {
    qId = '';
    blurLevel = 0;
    avgFirstCorrectGuessBlurLevel = 0;
    avgCorrectBlurLevel = 0;
}

export class BlurAnswer {
    id = '';
    sessionId = '';
    // sessionTime = 0;
    user = '';
    ip = '';
    qId = '';
    imgId = '';
    answer = '';
    groundTruth = '';
    isCorrect = false;
    attempt = 0;
    userConfidence = 0;
    isFinalAnswer = false;
    blurAmount = 0;
    newW = 0;
    newH = 0;
    orgW = 0;
    orgH = 0;
    // scale = 0;
    blurRadius = 0;
    screenW = 0;
    screenH = 0;
    zoom = 0;
    dtStart = new Date();
    dtEnd: Date;
    requestedOn: Date;
    blurStrategy = '';

    assignmentId = '';
    workerId = '';
    hitId = '';
    feedback = '';
    modality = '';
    oToggles = 0;
    modelAnswer = '';
    hitReward = false;
    sandbox = 0;
    bonus = 0;
    userOverride = false;
    likert = '';
}

export class OneShotAnswer {
    id = '';
    ip = '';
    dtEnd: Date;
    requestedOn: Date;
    assignmentId = '';
    workerId = '';
    hitId = '';
    feedback = '';
    modality = '';
    hitReward = false;
    sandbox = 0;
    likert = '';
    category = '';
    trial = 0;
    selectedQuestionId = '';
    levenshtein = 0;
    kendallsTau = 1;
    annotations: Annotation[];
    correctQuestionId = '';
    initalSort = '';
}

export class OneShotAnswerV2 {
    // id = '';
    ip = '';
    dtEnd: Date;
    requestedOn: Date;
    assignmentId = '';
    workerId = '';
    hitId = '';
    feedback = '';
    modality = '';
    hitReward = false;
    sandbox = 0;
    likert = '';
    category = '';
    trial = 0;

    totalMoveCount = 0;
    excludedCount = 0;
    // selectedQuestionId = '';
    // levenshtein = 0;
    // kendallsTau = 1;
    // annotations: Annotation[];
    // correctQuestionId = '';
    // initalSort = '';
}

export class OneShotAnswerV3 {
    // id = '';
    ip = '';
    dtEnd: Date;
    requestedOn: Date;
    assignmentId = '';
    workerId = '';
    hitId = '';
    feedback = '';
    modality = '';
    hitReward = false;
    sandbox = 0;
    likert = '';
    category = '';
    trial = 0;
    excludedId = 0;
    excludedLabel = '';
    distractorId = 0;
    distractorLabel = '';
    correctAnswer = false;
}

export class BlurGameStatsfilter {
    public display = false;
    public excludeFirstAmtRun = true;
    public onlyIncludeCurrentDataset = false;
    public groupWorkersByAssignmentId = false;
    public virtualExperiment = false;
    public minDate = new Date(2020, 0, 1, 0, 0, 0, 0);
    public maxDate = new Date();
    public removeDuplicateTrials = false;
    public excludeYesNo = false;
    public minCompletedQuestions = 0;
    public minPercentCorrect = 0;
    public minAvgGuessesPerQuestion = 0;
    public avgEffortTimePerQuestion = 0;
    public excludedWorkerIds: string[] = [];
    public filteredAnnotationIds: string[] = [];
    public adhocText = '';
    public trialRange: number[] = [0, 50];

    constructor(filteredAnnotations: Annotation[]) {
        this.maxDate.setHours(23, 59, 59, 999);
        for (const annotation of filteredAnnotations) {
            this.filteredAnnotationIds.push(annotation.question_id.toString());
        }
        console.log('Applying filter to the following Questions');
        console.log(JSON.stringify(this.filteredAnnotationIds));

        // this.filteredAnnotationIds.sort(() => Math.random() - 0.5);
        // console.log(JSON.stringify(this.filteredAnnotationIds.slice(0, 79)));
    }
}
export class PairBlurStats {
    public firstCorrectGuessBlurLevelSum = 0;
    public firstCorrectGuessBlurLevels: number[] = [];
    public firstCorrectGuessBlurLevelCount = 0;
    public correctBlurLevelSum = 0;
    public correctGuessBlurLevels: number[] = [];
    public correctBlurLevelCount = 0;
    public allBlurLevelSum = 0;
    public allBlurLevelCount = 0;
    public totalGuesses = 0;

    public getMedian(valueList: number[]) {
        if (valueList.length === 0) {
            return 0;
        }
        valueList.sort(function(a, b) {
            return a - b;
        });
        const half = Math.floor(valueList.length / 2);
        if (valueList.length % 2) {
            return valueList[half];
        }
        // return (valueList[half - 1] + valueList[half]) / 2.0;
        return valueList[Math.ceil(half)];
    }

    public medianFirstCorrectGuessBlurLevel() {
        return this.getMedian(this.firstCorrectGuessBlurLevels);
    }

    public medianCorrectGuessBlurLevel() {
        return this.getMedian(this.correctGuessBlurLevels);
    }

    public avgFirstCorrectGuessBlurLevel() {
        if (this.firstCorrectGuessBlurLevelCount === 0) {
            return 0;
        }
        return this.firstCorrectGuessBlurLevelSum / this.firstCorrectGuessBlurLevelCount;
    }

    public avgCorrectBlurLevel() {
        if (this.correctBlurLevelCount === 0) {
            return 0;
        }
        return this.correctBlurLevelSum / this.correctBlurLevelCount;
    }

    public avgAllBlurLevel() {
        if (this.allBlurLevelCount === 0) {
            return 0;
        }
        return this.allBlurLevelSum / this.allBlurLevelCount;
    }

    public pctCorrect() {
        if (this.allBlurLevelCount === 0) {
            return 0;
        }
        return this.correctBlurLevelCount / this.allBlurLevelCount;
    }
    public blurDeltaAverage() {
        return this.avgFirstCorrectGuessBlurLevel() - this.avgCorrectBlurLevel();
    }
    public blurDeltaMedian() {
        return this.medianFirstCorrectGuessBlurLevel() - this.medianCorrectGuessBlurLevel();
    }
}

export class SummaryStat {
    public count = 0;
    public likert1Sum = 0;
    public likert2Sum = 0;
    public likert1Count = 0;

    public get avgLiker1() {
        const denom = this.likert1Count;
        if (denom > 0) {
            return this.likert1Sum / denom;
        } else {
            return 0;
        }
    }

    public get avgLiker2() {
        const denom = this.likert1Count;
        if (denom > 0) {
            return this.likert2Sum / denom;
        } else {
            return 0;
        }
    }
}

export class BlurGameStats {
    public filter = new BlurGameStatsfilter([]);
    public blurGameResults: BlurAnswer[];
    public allAnswersByQid: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public finalAnswersByQid: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public allAnswersByWorkerId: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public finalAnswersByWorkerId: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public allAnswersByQidWorkerId: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public finalAnswersByQidWorkerId: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public workerStatsMap: Map<string, BlurGameWorkerStat> = new Map<string, BlurGameWorkerStat>();
    public workerUnfilteredTrials: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public workerStats: BlurGameWorkerStat[] = [];
    public completedTotal = 0;
    public completedCorrect = 0;
    public completedTotalForTrial: Map<string, number> = new Map<string, number>();
    public completedCorrectForTrial: Map<string, number> = new Map<string, number>();
    public completedCorrectBlurLevels: number[] = [];
    public completedWrongBlurLevels: number[] = [];
    public completedTopCorrectAnswers: Map<string, number> = new Map<string, number>();
    public completedTopWrongAnswers: Map<string, number> = new Map<string, number>();
    public guessesTotal = 0;
    public guessesCorrect = 0;
    public modality = '';
    public blurLevels: BlurLevel[] = [];
    public blurLevelsMap = {};
    public duplicateTrialCount = 0;
    public totalEffortTimeSpentForAllWokers = 0;

    public modelCorrect = 0;
    public correctAndModelCorrect = 0;
    public correctAndModelWrong = 0;
    public wrongAndModelCorrect = 0;
    public wrongAndModelWrong = 0;

    public modelCorrectAndUserAccepted = new SummaryStat();
    public modelCorrectAndUserOverrideCorrect = new SummaryStat();
    public modelCorrectAndUserOverrideWrong = new SummaryStat();
    public modelWrongAndUserAccepted = new SummaryStat();
    public modelWrongAndUserOverrideCorrect = new SummaryStat();
    public modelWrongAndUserOverrideWrongSame = new SummaryStat();
    public modelWrongAndUserOverrideWrongNew = new SummaryStat();

    public hitRewards = 0;

    public blurHistogram = {
        labels: [],
        datasets: []
    };
    public performanceOverTime = {
        labels: [],
        datasets: []
    };

    private tallyLikertSatisfaction(blurAnswer: BlurAnswer, summaryStat: SummaryStat) {
        summaryStat.count += 1;
        if (blurAnswer.likert !== undefined && blurAnswer.likert !== null) {
            const questions = blurAnswer.likert.split('_');
            if (questions.length > 1) {
                const satisfaction1 = questions[0].split('-');
                if (satisfaction1.length > 1) {
                    summaryStat.likert1Sum += parseInt(satisfaction1[1], 10);
                    summaryStat.likert1Count += 1;
                }
                const satisfaction2 = questions[1].split('-');
                if (satisfaction2.length > 1) {
                    summaryStat.likert2Sum += parseInt(satisfaction2[1], 10);
                }
            }
        }
    }

    constructor(blurGameResults: BlurAnswer[], filter: BlurGameStatsfilter, modality: string, blurLevels: BlurLevel[]) {
        this.filter = filter;
        this.modality = modality;
        this.blurGameResults = blurGameResults;
        this.blurLevels = blurLevels;
        this.blurLevelsMap = {};
        for (const bl of this.blurLevels) {
            this.blurLevelsMap[bl.qId] = bl.blurLevel;
        }
        this.build();
    }
    public build() {
        for (const a of this.blurGameResults) {
            if (this.modality === 'ALL' || this.modality === a.modality) {
                if (
                    (!this.filter.onlyIncludeCurrentDataset || this.filter.filteredAnnotationIds.includes(a.qId)) &&
                    !this.filter.excludedWorkerIds.includes(a.workerId)
                ) {
                    if (this.filter.virtualExperiment) {
                        // Virtural Experiment
                        let correctBlurLevelModified = this.blurLevelsMap[a.qId] + 2; // 2 was the blur modifier used in the 4 modalities.
                        if (correctBlurLevelModified > 98) {
                            correctBlurLevelModified = 98;
                        }
                        if (
                            a.blurAmount === correctBlurLevelModified ||
                            a.blurAmount + 1 === correctBlurLevelModified ||
                            a.blurAmount - 1 === correctBlurLevelModified
                        ) {
                            this.addAnswer(a);
                        }
                    } else {
                        const workerTrialCount = this.workerUnfilteredTrials[a.workerId + a.assignmentId]
                            ? this.workerUnfilteredTrials[a.workerId + a.assignmentId].length
                            : 0;
                        if (workerTrialCount >= this.filter.trialRange[0] && workerTrialCount <= this.filter.trialRange[1]) {
                            this.addAnswer(a);
                        }
                    }
                    this.addToMap(this.workerUnfilteredTrials, a.workerId + a.assignmentId, a);
                }
            }
        }
        this.blurHistogram = this.buildBlurHistogram();
        this.performanceOverTime = this.buildPerformanceChart();
    }

    // public getAvgCorrectBlurLevel(qId: string, includeAll: boolean): number {
    //     const list: BlurAnswer[] = this.finalAnswersByQid[qId];
    //     let sum = 0;
    //     let count = 0;
    //     if (list) {
    //         for (const ba of list) {
    //             if (includeAll || ba.isCorrect) {
    //                 sum += ba.blurAmount;
    //                 count += 1;
    //             }
    //         }
    //     }
    //     if ( count > 0 ) {
    //         return sum / count;
    //     } else {
    //         return 0;
    //     }
    // }
    public getPairBlurStats(qId: string): PairBlurStats {
        const result = new PairBlurStats();
        const list: BlurAnswer[] = this.allAnswersByQid[qId];
        const encounteredWorkerIds = [];
        if (list) {
            result.totalGuesses = list.length;
            for (const ba of list) {
                // Final answers
                if (ba.isFinalAnswer) {
                    result.allBlurLevelSum += ba.blurAmount;
                    result.allBlurLevelCount += 1;
                    if (ba.isCorrect) {
                        result.correctBlurLevelSum += ba.blurAmount;
                        result.correctBlurLevelCount += 1;
                        result.correctGuessBlurLevels.push(ba.blurAmount);
                    }
                }
                // All guesses
                if (ba.isCorrect) {
                    // Only count the first blur level for when a worker get's the answer right.
                    if (!encounteredWorkerIds.includes(ba.workerId)) {
                        encounteredWorkerIds.push(ba.workerId);
                        result.firstCorrectGuessBlurLevelSum += ba.blurAmount;
                        result.firstCorrectGuessBlurLevels.push(ba.blurAmount);
                        result.firstCorrectGuessBlurLevelCount += 1;
                    }
                }
            }
        }
        return result;
    }

    public get avgEffortTimePerQuestion() {
        return this.totalEffortTimeSpentForAllWokers / this.completedTotal;
    }
    public get avgEffortTimePerWorker() {
        return this.totalEffortTimeSpentForAllWokers / this.workerStats.length;
    }

    public get completedPercentCorrect() {
        if (this.completedTotal > 0) {
            return this.completedCorrect / this.completedTotal;
        } else {
            return 0;
        }
    }

    public get guessesPercentCorrect() {
        if (this.guessesTotal > 0) {
            return this.guessesCorrect / this.guessesTotal;
        } else {
            return 0;
        }
    }

    public get modelPercentCorrect() {
        if (this.completedTotal > 0) {
            return this.modelCorrect / this.completedTotal;
        } else {
            return 0;
        }
    }

    public getFinalAnswersByQid(questionId: any) {
        const result = this.finalAnswersByQid[questionId];
        if (result) {
            return result;
        } else {
            return [];
        }
    }

    public get avgCorrectBlurLevel() {
        const total = this.completedCorrectBlurLevels.reduce((acc, c) => acc + c, 0);
        return total / this.completedCorrectBlurLevels.length;
    }

    public get completedCorrectBlurLevelFrequency() {
        const map = this.completedCorrectBlurLevels.reduce((obj, b) => {
            obj[b] = ++obj[b] || 1;
            return obj;
        }, {});
        return map;
    }

    public get completedWrongBlurLevelFrequency() {
        const map = this.completedWrongBlurLevels.reduce((obj, b) => {
            obj[b] = ++obj[b] || 1;
            return obj;
        }, {});
        return map;
    }

    public get percentCorrectWhenModelIsCorrect() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.correctAndModelCorrect / denom;
        } else {
            return 0;
        }
    }
    public get percentCorrectWhenModelIsWrong() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.correctAndModelWrong / denom;
        } else {
            return 0;
        }
    }

    public get percentWrongWhenModelIsCorrect() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.wrongAndModelCorrect / denom;
        } else {
            return 0;
        }
    }

    public get percentWrongWhenModelIsWrong() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.wrongAndModelWrong / denom;
        } else {
            return 0;
        }
    }

    public get percentModelCorrectAndUserAccepted() {
        const denom = this.modelCorrect;
        if (denom > 0) {
            return this.modelCorrectAndUserAccepted.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelCorrectAndUserOverrideCorrect() {
        const denom = this.modelCorrect;
        if (denom > 0) {
            return this.modelCorrectAndUserOverrideCorrect.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelCorrectAndUserOverrideWrong() {
        const denom = this.modelCorrect;
        if (denom > 0) {
            return this.modelCorrectAndUserOverrideWrong.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelWrongAndUserAccepted() {
        const denom = this.completedTotal - this.modelCorrect;
        if (denom > 0) {
            return this.modelWrongAndUserAccepted.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelWrongAndUserOverrideCorrect() {
        const denom = this.completedTotal - this.modelCorrect;
        if (denom > 0) {
            return this.modelWrongAndUserOverrideCorrect.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelWrongAndUserOverrideWrongSame() {
        const denom = this.completedTotal - this.modelCorrect;
        if (denom > 0) {
            return this.modelWrongAndUserOverrideWrongSame.count / denom;
        } else {
            return 0;
        }
    }

    public get percentModelWrongAndUserOverrideWrongNew() {
        const denom = this.completedTotal - this.modelCorrect;
        if (denom > 0) {
            return this.modelWrongAndUserOverrideWrongNew.count / denom;
        } else {
            return 0;
        }
    }

    public buildBlurHistogram() {
        const correctMap = this.completedCorrectBlurLevelFrequency;
        const wrongMap = this.completedWrongBlurLevelFrequency;
        const correctkeys = Object.keys(correctMap);
        const wrongkeys = Object.keys(wrongMap);
        const allKeys = correctkeys;
        for (const key of wrongkeys) {
            if (!allKeys.includes(key)) {
                // prevent dups
                allKeys.push(key);
            }
        }
        allKeys.sort().reverse();
        const result = {
            labels: allKeys,
            datasets: [
                {
                    label: 'Confident & Correct',
                    backgroundColor: '#9CCC65',
                    borderColor: '#7CB342',
                    data: []
                },
                {
                    label: 'Confident & Wrong',
                    backgroundColor: '#C00000',
                    borderColor: '#C00000',
                    data: []
                }
            ]
        };

        for (const key of allKeys) {
            if (correctMap[key]) {
                result.datasets[0].data.push(correctMap[key]);
            } else {
                result.datasets[0].data.push(0);
            }
            if (wrongMap[key]) {
                result.datasets[1].data.push(wrongMap[key]);
            } else {
                result.datasets[1].data.push(0);
            }
        }
        return result;
    }

    public buildPerformanceChart() {
        const allKeys = Object.keys(this.completedTotalForTrial);
        const allKeysNumeric = allKeys.map(Number);
        const result = {
            labels: allKeysNumeric,
            datasets: [
                {
                    label: 'Average % Correct per Trial',
                    borderColor: '#4bc0c0',
                    fill: false,
                    data: []
                }
            ]
        };

        for (const key of allKeysNumeric) {
            result.datasets[0].data.push(Math.round((this.completedCorrectForTrial[key] / this.completedTotalForTrial[key]) * 100));
        }
        return result;
    }

    public addAnswer(blurAnswer: BlurAnswer) {
        blurAnswer['dtEndServer'] = new Date(blurAnswer.dtEnd);
        // Exclude results from first run
        // if (this.filter.excludeFirstAmtRun) {
        if (
            blurAnswer['dtEndServer'].getTime() < this.filter.minDate.getTime() ||
            blurAnswer['dtEndServer'].getTime() > this.filter.maxDate.getTime()
        ) {
            return;
        }
        // }
        // if (blurAnswer.blurAmount < 30) {
        //     console.log('Blur below threshold: ' + blurAnswer.dtEnd + ' - ' + blurAnswer.qId + ' - ' + blurAnswer.workerId);
        //     return;
        // }
        // Check to see if the worker has already completed a question.  Exclude subsequent duplicates
        if (this.filter.removeDuplicateTrials) {
            if (this.finalAnswersByQidWorkerId[blurAnswer.qId + blurAnswer.workerId]) {
                if (blurAnswer.isFinalAnswer) {
                    this.duplicateTrialCount += 1;
                    console.log(
                        'Duplicate trial (' +
                            this.duplicateTrialCount +
                            '): ' +
                            blurAnswer.dtEnd +
                            ' - ' +
                            blurAnswer.qId +
                            ' - ' +
                            blurAnswer.workerId
                    );
                }
                return;
            }
        }
        if (this.filter.excludeYesNo && this.isYesNo(blurAnswer.groundTruth)) {
            return;
        }
        if (blurAnswer.requestedOn !== null) {
            blurAnswer['dtRequestedOn'] = new Date(blurAnswer.requestedOn);
        } else {
            blurAnswer['dtRequestedOn'] = new Date(blurAnswer.dtStart);
        }
        blurAnswer['timeSpent'] = (blurAnswer['dtEndServer'].getTime() - blurAnswer['dtRequestedOn'].getTime()) / 1000;
        this.addWorker(this.workerStatsMap, blurAnswer);
        this.addToMap(this.allAnswersByQid, blurAnswer.qId, blurAnswer);
        this.addToMap(this.allAnswersByWorkerId, blurAnswer.workerId, blurAnswer);
        this.addToMap(this.allAnswersByQidWorkerId, blurAnswer.qId + blurAnswer.workerId, blurAnswer);
        this.guessesTotal += 1;
        if (blurAnswer.isCorrect) {
            this.guessesCorrect += 1;
        }
        if (blurAnswer.isFinalAnswer) {
            const trialCount = 1 + this.getTrialsCompletedByWorker(blurAnswer.workerId);
            // Tally completed Total for trial N
            if (!this.completedTotalForTrial[trialCount]) {
                this.completedTotalForTrial[trialCount] = 0;
            }
            if (!this.completedCorrectForTrial[trialCount]) {
                this.completedCorrectForTrial[trialCount] = 0;
            }
            this.completedTotalForTrial[trialCount] += 1;

            this.totalEffortTimeSpentForAllWokers += blurAnswer['timeSpent'];
            this.completedTotal += 1;
            let answerKey = blurAnswer.answer;
            if (answerKey === 'size') {
                answerKey = 'size_'; // Fixes error with map below: ERROR TypeError: Cannot set property size of [object Map] which has only a getter
            }
            if (blurAnswer.isCorrect) {
                // Tally completed correct for trial N
                this.completedCorrectForTrial[trialCount] += 1;

                this.completedCorrect += 1;
                this.completedCorrectBlurLevels.push(blurAnswer.blurAmount);
                if (this.completedTopCorrectAnswers[answerKey] === undefined) {
                    this.completedTopCorrectAnswers[answerKey] = 0;
                }
                this.completedTopCorrectAnswers[answerKey] += 1;
            } else {
                this.completedWrongBlurLevels.push(blurAnswer.blurAmount);
                if (this.completedTopWrongAnswers[answerKey] === undefined) {
                    this.completedTopWrongAnswers[answerKey] = 0;
                }
                this.completedTopWrongAnswers[answerKey] += 1;
            }
            this.addToMap(this.finalAnswersByQid, blurAnswer.qId, blurAnswer);
            this.addToMap(this.finalAnswersByWorkerId, blurAnswer.workerId, blurAnswer);
            this.addToMap(this.finalAnswersByQidWorkerId, blurAnswer.qId + blurAnswer.workerId, blurAnswer);
        }
    }
    public getUniqueQuestionIds() {
        return Object.keys(this.finalAnswersByQid);
    }
    public getUniqueWorkerIds() {
        return Object.keys(this.finalAnswersByWorkerId);
    }
    // public buildStatsByWorker() {
    //     for (const workerId of this.getUniqueWorkerIds()) {

    //     }
    // }
    private getTrialsCompletedByWorker(workerId: string): number {
        if (!this.finalAnswersByWorkerId[workerId]) {
            return 0;
        }
        return this.finalAnswersByWorkerId[workerId].length;
    }
    private addToMap(map: Map<string, BlurAnswer[]>, key: string, blurAnswer: BlurAnswer) {
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push(blurAnswer);
    }
    private addWorker(map: Map<string, BlurGameWorkerStat>, blurAnswer: BlurAnswer) {
        let workerStat: BlurGameWorkerStat;
        const assignmentId = this.filter.groupWorkersByAssignmentId ? ' - ' + blurAnswer.assignmentId : '';
        if (!map[blurAnswer.workerId + assignmentId]) {
            workerStat = new BlurGameWorkerStat();
            workerStat.screenResolution = blurAnswer.screenW + ' x ' + blurAnswer.screenH + ' @ ' + blurAnswer.zoom + '%';
            workerStat.startedOn = new Date(blurAnswer.requestedOn);
            map[blurAnswer.workerId + assignmentId] = workerStat;
            this.workerStats.push(workerStat);
            workerStat.workerId = blurAnswer.workerId;
            workerStat.assignmentId = blurAnswer.assignmentId;
            workerStat.ip = blurAnswer.ip;
            workerStat.sandbox = blurAnswer.sandbox;
            if (this.filter.adhocText.includes(workerStat.workerId)) {
                workerStat.adHocTextCount = this.filter.adhocText.split(workerStat.workerId).length - 1;
            }
        } else {
            workerStat = map[blurAnswer.workerId + assignmentId];
        }
        // All Guesses
        workerStat.guessesTotal += 1;
        workerStat.bonusPayTotal += blurAnswer.bonus;
        if (blurAnswer.isCorrect) {
            workerStat.guessesCorrect += 1;
        }
        // Count Hit rewards collected
        if (blurAnswer.hitReward) {
            workerStat.hitRewards += 1;
            this.hitRewards += 1;
        }
        // Final guess
        if (blurAnswer.isFinalAnswer) {
            workerStat.componentOverlayToggles += blurAnswer.oToggles;
            workerStat.totalEffortTimeSpent += blurAnswer['timeSpent'];
            blurAnswer['totalEffortTimeSpent'] = workerStat.totalEffortTimeSpent;
            workerStat.completedTotal += 1;
            const modelCorrect = blurAnswer.modelAnswer === blurAnswer.groundTruth;
            if (blurAnswer.isCorrect) {
                workerStat.completedCorrect += 1;
                // Turker vs. model
                if (modelCorrect) {
                    this.modelCorrect += 1;
                    workerStat.modelCorrect += 1;
                    this.correctAndModelCorrect += 1;
                    workerStat.correctAndModelCorrect += 1;

                    if (blurAnswer.userOverride) {
                        this.tallyLikertSatisfaction(blurAnswer, this.modelCorrectAndUserOverrideCorrect); // Model is Correct ; Override ; Correct
                    } else {
                        this.tallyLikertSatisfaction(blurAnswer, this.modelCorrectAndUserAccepted); // Model is Correct ; Accept
                    }
                } else {
                    this.correctAndModelWrong += 1;
                    workerStat.correctAndModelWrong += 1;

                    if (blurAnswer.userOverride) {
                        if (blurAnswer.groundTruth === blurAnswer.answer) {
                            this.tallyLikertSatisfaction(blurAnswer, this.modelWrongAndUserOverrideCorrect); // Model is Wrong ; Override ; Correct
                        }
                    }
                }
            } else {
                if (modelCorrect) {
                    this.modelCorrect += 1;
                    workerStat.modelCorrect += 1;
                    this.wrongAndModelCorrect += 1;
                    workerStat.wrongAndModelCorrect += 1;
                    if (blurAnswer.userOverride) {
                        this.tallyLikertSatisfaction(blurAnswer, this.modelCorrectAndUserOverrideWrong); // Model is Correct ; Override ; Wrong
                    } else {
                        console.log('Should not happen');
                    }
                } else {
                    this.wrongAndModelWrong += 1;
                    workerStat.wrongAndModelWrong += 1;

                    if (blurAnswer.userOverride) {
                        if (blurAnswer.modelAnswer === blurAnswer.answer) {
                            this.tallyLikertSatisfaction(blurAnswer, this.modelWrongAndUserOverrideWrongSame); // Model is Wrong ; Override ; Wrong Same
                        } else {
                            this.tallyLikertSatisfaction(blurAnswer, this.modelWrongAndUserOverrideWrongNew); // Model is Wrong ; Override ; Wrong New
                        }
                    } else {
                        this.tallyLikertSatisfaction(blurAnswer, this.modelWrongAndUserAccepted); // Model is Wrong ; Accept
                    }
                }
            }
        }
        // if (!workerStat.startTime || blurAnswer['dtEndServer'] < workerStat.startTime) {
        //     workerStat.startTime = blurAnswer['dtEndServer'];
        // }
        // if (!workerStat.endTime || blurAnswer['dtEndServer'] > workerStat.endTime) {
        //     workerStat.endTime = blurAnswer['dtEndServer'];
        // }
    }
    isYesNo(answer: string) {
        if (answer === 'yes' || answer === 'no') {
            return true;
        }
        return false;
    }
}
export class BlurGameWorkerStat {
    public workerId = '';
    public assignmentId = '';
    public ip = '';
    public hitRewards = 0;
    public completedTotal = 0;
    public completedCorrect = 0;
    public screenResolution = '';
    public startedOn = new Date();
    public componentOverlayToggles = 0;
    public modelCorrect = 0;
    public correctAndModelCorrect = 0;
    public correctAndModelWrong = 0;
    public wrongAndModelCorrect = 0;
    public wrongAndModelWrong = 0;
    public guessesTotal = 0;
    public guessesCorrect = 0;
    public adHocTextCount = 0;
    public sandbox = 0;
    public bonusPayTotal = 0;

    public get bonusPayRounded() {
        return this.bonusPayTotal.toFixed(2);
    }

    // public startTime: Date;
    // public endTime: Date;
    public totalEffortTimeSpent = 0;
    // public finalAnswersByQid: Map<string, BlurAnswer[]> = new Map<string, BlurAnswer[]>();
    public get avgGuessesPerQuestion() {
        if (this.completedTotal > 0) {
            return this.guessesTotal / this.completedTotal;
        } else {
            return 0;
        }
    }

    public get completedPercentCorrect() {
        if (this.completedTotal > 0) {
            return this.completedCorrect / this.completedTotal;
        } else {
            return 0;
        }
    }
    public get guessesPercentCorrect() {
        if (this.guessesTotal > 0) {
            return this.guessesCorrect / this.guessesTotal;
        } else {
            return 0;
        }
    }

    public get modelPercentCorrect() {
        if (this.completedTotal > 0) {
            return this.modelCorrect / this.completedTotal;
        } else {
            return 0;
        }
    }

    public get percentCorrectWhenModelIsCorrect() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.correctAndModelCorrect / denom;
        } else {
            return 0;
        }
    }
    public get percentCorrectWhenModelIsWrong() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.correctAndModelWrong / denom;
        } else {
            return 0;
        }
    }

    public get percentWrongWhenModelIsCorrect() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.wrongAndModelCorrect / denom;
        } else {
            return 0;
        }
    }

    public get percentWrongWhenModelIsWrong() {
        const denom = this.completedTotal;
        if (denom > 0) {
            return this.wrongAndModelWrong / denom;
        } else {
            return 0;
        }
    }
    // public get avgTimePerQuestion(): number {
    //     if (this.completedTotal > 0) {
    //         return this.totalTimeSpent / this.completedTotal;
    //     } else {
    //         return 0;
    //     }
    // }
    // public get totalTimeSpent(): number {
    //     if (this.endTime && this.startTime) {
    //         return (this.endTime.getTime() - this.startTime.getTime()) / 1000;
    //     } else {
    //         return 0;
    //     }
    // }
    // public get timeSpentInMinutes(): number {
    //     return this.totalTimeSpent / 60;
    // }

    public get avgEffortTimePerQuestion(): number {
        if (this.completedTotal > 0) {
            return this.totalEffortTimeSpent / this.completedTotal;
        } else {
            return 0;
        }
    }
}
export class GlobalExplanationFilter {
    public minTurkerConsensus = 0;
    public vqaRight = true;
    public vqaWrong = true;
    public allowDuplicateImages = true;
    public allowDuplicateQuestions = true;
    public allowBinary = true;
    public allowOcr = true;
    public allowDuplicateAnswers = true;
    public allowYesNo = true;
    public allowNumeric = true;
    public allowPluralForms = true;
    public shuffleSeed = 0;
    public maxQuestions = 999999;
}

export class Header {
    name: string;
    image: string;
}

export class Unit {
    image: string;
    unit: number;
    iou: number;
    label: string;
    cat: string;
    index: number;
    excluded = false;
}

export class Rankings {
    header: Header;
    scores: Scores;
    units: Unit[];
    initalSort: Unit[];
}
export class Scores {
    accuracy_after = 0;
    accuracy_before = 0;
    f1_after = 0;
    f1_before = 0;
    pctImprovement = 0;
}

export class DemoSave {
    id = '';
    name = '';
    sessionId = '';
    timestamp: number;
    aspects: DemoAspect[] = [];
}

export class DemoAspect {
    id = 0;
    name = 'My Aspect #1';
    images: DemoImage[] = [];

    max_results = 32;
    excluded = false;
}

export class DemoImage {
    id = 9999;
    score = 0;
    negative = false;
    b64_image = '';
    name = 'A310';
    image_path = '../../../evaluation_dataset/one_shot_data/aircraft_data/A310/0063281.jpg';
    in_aspect = false;
    heatmapData = new HeatMapData();
}

export class DemoScoreResult {
    id = 0;
    auc = 0;
    precision: number[] = [];
    recall: number[] = [];
}

export class DemoScoreInput {
    id = 0;
    class = '';
    aspects = {};
}
export class HeatMapData {
    public max = 1;
    public min = 0;
    public data: HeatMapCoordinates[] = [];
}
export class HeatMapCoordinates {
    public x = 0;
    public y = 0;
    public value = 0;
}
