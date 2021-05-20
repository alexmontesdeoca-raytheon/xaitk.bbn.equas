import { TreeNode } from 'primeng/api';

export enum EvaluationPhase {
    training,
    validation,
    test
}
export enum ModelType {
    faithful,
    hiecoattenvqa
}

export class VqaBestAnswer {
    public id: number;
    public answer: string;
    public activation: number;
}

export class VqaNeuron {
    public neuronId: number;
    public label: string;
    public category: string;
    public accuracy: number;
    public imageryFilename: string;
    public activation: number;
}

export class VqaReply {
    public id: string;
    public answer: string;
    public neurons: VqaNeuron[];
    public bestAnswers: VqaBestAnswer[];
}

export class VqaHistory {
    public hostAddress?: string;
    public imgUri?: string;
    public history?: VqaBundle[];
    public annotations?: VqaBundle[];
    // UI specific fields
    public showExpandedDetails = false;
    public selectedHistory?: VqaBundle;
    public selectedAnnotation?: VqaBundle;

    public get absoluteImgUri(): string {
        return this.hostAddress + this.imgUri;
    }
}

export class NlgPhrase {
    public neuronId: number;
    public words: string;
}

export class NlgDescription {
    public annotatedText: NlgPhrase[];
}

export class AnswerScore {
    answer = '';
    score = 0;
}

export class VqaBundle {
    public id?: string;
    public question?: string;
    public answer?: string;
    public agree?: boolean = null;
    public groundTruth?: string;
    public forceAnswer?: string;
    public img?: string;
    public imgUri?: string;
    public timeAsked?: Date;
    public timeAnswered?: Date;
    public reply: VqaReply;
    public naturalLanguage: NlgDescription;
    public explanation = '';
    public explanationHtml = '';
    public componentExplanation: any;
    public componentExplanationHtml = '';
    public topN: AnswerScore[] = [];

    public topRejectedScore = -999;
    public topRejectedScoreDelta = -999;

    // UI specific fields
    // public supportingEvidence: any[];
    // public selectedSupportingEvidence: any;

    public supportingEvidence: SupportingEvidence;
}

export class SupportingEvidence {
    // Fitlers
    public activationFilter = new NumberFilter();
    public accuracyFilter = new NumberFilter();
    // Tree Table
    public selectedNode: TreeNode;
    public treeNodes: TreeNode[];
    public treeNodesFiltered: TreeNode[];
    public sortField = 'activation';
    public sortDirection = 'sort-down';
    // Flat Table
    public neuronsFiltered: VqaNeuron[] = [];
    public selectedNeuron: VqaNeuron;
}

export class NumberFilter {
    static sliderFudge = 10000; // Slider cannot handle decimal values
    public value = 1000;
    public min = NumberFilter.sliderFudge;
    public max = -NumberFilter.sliderFudge;

    public get decimalValue(): number {
        return this.value / NumberFilter.sliderFudge;
    }

    public reset(): number {
        return (this.value = this.min);
    }

    public addMinMaxValue(newValue: number) {
        newValue = Math.floor(newValue * NumberFilter.sliderFudge);
        if (newValue < this.min) {
            this.min = newValue;
        }
        if (newValue > this.max) {
            this.max = newValue;
        }
    }
    public setMedian() {
        this.value = (this.min + this.max) / 2;
    }
    public setValue(val: number) {
        this.value = val * NumberFilter.sliderFudge;
    }
}

export class FolderEntity {
    public folderUri?: string;
    public files?: string[];
    public folders?: FolderEntity[];
}

export class FileEntityObj {
    public name?: string;
    constructor(name: string) {
        this.name = name;
    }
}
export class FolderEntityObj {
    public folderUri?: string;
    public files?: FileEntityObj[] = [];
    public folders?: FolderEntity[];
}

export class XAIObj {
    public id?: any;
    public login?: string;
    public firstName?: string;
    public lastName?: string;
    public email?: string;
    public activated?: Boolean;
    public langKey?: string;
    public authorities?: any[];
    public createdBy?: string;
    public createdDate?: Date;
    public lastModifiedBy?: string;
    public lastModifiedDate?: Date;
    public password?: string;

    constructor(
        id?: any,
        login?: string,
        firstName?: string,
        lastName?: string,
        email?: string,
        activated?: Boolean,
        langKey?: string,
        authorities?: any[],
        createdBy?: string,
        createdDate?: Date,
        lastModifiedBy?: string,
        lastModifiedDate?: Date,
        password?: string
    ) {
        this.id = id ? id : null;
        this.login = login ? login : null;
        this.firstName = firstName ? firstName : null;
        this.lastName = lastName ? lastName : null;
        this.email = email ? email : null;
        this.activated = activated ? activated : false;
        this.langKey = langKey ? langKey : null;
        this.authorities = authorities ? authorities : null;
        this.createdBy = createdBy ? createdBy : null;
        this.createdDate = createdDate ? createdDate : null;
        this.lastModifiedBy = lastModifiedBy ? lastModifiedBy : null;
        this.lastModifiedDate = lastModifiedDate ? lastModifiedDate : null;
        this.password = password ? password : null;
    }
}
