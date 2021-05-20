import { GlobalExplanationComponent } from './../entities/global-explanation/global-explanation.component';

import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { LoginModalService, Principal, Account } from '../core';
import { TreeNode } from 'primeng/api';
import { MenuItem } from 'primeng/api';

import { XAIService } from '../shared/xai/xai.service';
import {
    XAIObj,
    VqaHistory,
    VqaBundle,
    EvaluationPhase,
    FolderEntity,
    FolderEntityObj,
    VqaNeuron,
    SupportingEvidence,
    VqaBestAnswer,
    NumberFilter,
    ModelType
} from '../shared/xai/xai.model';
import { ThresholdFilter } from '../shared/xai/xai.imagefilter';
import { Message } from 'primeng/components/common/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { SelectItem } from 'primeng/api';
import { v4 as uuid } from 'uuid';
// import { TreeTable } from 'primeng/treetable';
import { Table } from 'primeng/table';
@Component({
    selector: 'jhi-hiecoatten-vqa',
    templateUrl: './home.component.html',
    providers: [MessageService],
    styleUrls: ['home.scss']
})
export class HomeComponent implements OnInit {
    account: Account;
    modalRef: NgbModalRef;
    readonly defaultPhase: EvaluationPhase = EvaluationPhase.training;
    @Input() defaultImage = '25.jpg';
    @Input() autoAskQuestion = '';
    @Input() autoAskGroundTruth = '';
    vqaHistory: VqaHistory;
    imageHistory: VqaHistory[] = [];
    imageHistoryIndex = -1; // Current image being viewed in imageHistory[imageHistoryIndex]
    imageList: FolderEntityObj;
    showImageList = false; // Dialog for image selection
    showSimilarCaseDialog = false;
    questionText = '';
    questionTypeOptions: SelectItem[];
    questionTypeSelection: string[] = ['My Questions', 'Annotations'];
    showVqaHeatMap = true;
    showImage = true;
    showExpandedDetails = false;
    showQuestionHistorySideBar = false;
    showAnnotationSideBar = false;
    selectedTabIndex = 0;
    selectedFilter = 'vqa_gcam_gs';
    guiOptions = {
        devMode: true,
        tabviewLayout: false
    };
    evidenceFilterTimeout: any;
    @ViewChild('supportingEvidenceTable') supportingEvidenceTable: Table;
    similarCases = require('./similarCases.json');
    thresholdFilter = new ThresholdFilter();
    globalAccuracyFilter = new NumberFilter();

    focusOnQuestion = '';
    focusOnAnswer = '';
    globalExplanationActiveTab = 0;

    showGlobalExplanation = false;

    constructor(
        private principal: Principal,
        private loginModalService: LoginModalService,
        private eventManager: JhiEventManager,
        private xaiService: XAIService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.principal.identity().then(account => {
            this.account = account;
            if (account !== null) {
                this.getInitialVqaHistory();
            }
        });

        this.registerAuthenticationSuccess();
        this.questionTypeOptions = [
            { label: 'My Questions', value: 'My Questions', icon: 'fa fa-fw fa-user-circle' },
            { label: 'All Users', value: 'All Users', icon: 'fa fa-fw fa-users' },
            { label: 'Annotations', value: 'Annotations', icon: 'fa fa-fw fa-eye' }
        ];

        this.resetImageHistory();
        this.imageList = new FolderEntityObj();
    }

    registerAuthenticationSuccess() {
        this.eventManager.subscribe('authenticationSuccess', message => {
            this.principal.identity().then(account => {
                this.account = account;
                this.getInitialVqaHistory();
            });
        });
    }

    isAuthenticated() {
        return this.principal.isAuthenticated();
    }

    login() {
        this.modalRef = this.loginModalService.open();
    }

    getRandomImage() {
        this.xaiService.getRandomImage(this.xaiService.defaultDataset, this.defaultPhase).subscribe(response => {
            // this.imageSource = response;
        });
    }

    resetImageHistory() {
        this.imageHistory = [];
        this.imageHistoryIndex = -1;
    }
    addToImageHistory(vqaHistory: VqaHistory) {
        // If this image already exists in the image history then resuse it.
        let found = false;
        for (let index = 0; index < this.imageHistory.length; index++) {
            const history: VqaHistory = this.imageHistory[index];
            if (history.imgUri === vqaHistory.imgUri) {
                this.vqaHistory = history;
                this.imageHistory.push(history);
                this.imageHistoryIndex += 1;
                found = true;
                break;
            }
        }
        if (!found) {
            this.vqaHistory = vqaHistory;
            this.imageHistory.push(vqaHistory);
            this.imageHistoryIndex += 1;
        }
    }

    getRandomVqaHistory() {
        this.xaiService
            .getRandomVqaHistory(this.xaiService.defaultDataset, this.defaultPhase, ModelType.hiecoattenvqa)
            .subscribe(response => {
                this.addToImageHistory(response);
            });
    }

    getVqaHistory(imageName: string) {
        this.xaiService
            .getVqaHistory(this.xaiService.defaultDataset, this.defaultPhase, imageName, ModelType.hiecoattenvqa)
            .subscribe(response => {
                this.addToImageHistory(response);
                if (this.autoAskQuestion !== '') {
                    this.questionText = this.autoAskQuestion;
                    this.submitQuestionWithGroundTruth(this.autoAskGroundTruth);
                }
            });
    }

    getInitialVqaHistory() {
        this.resetImageHistory();
        this.getVqaHistory(this.defaultImage);
        this.xaiService.getImageList(this.xaiService.defaultDataset, this.defaultPhase, 999999).then(response => {
            this.imageList = response;
        });
    }

    getPreviousVqaHistory() {
        if (this.imageHistoryIndex > 0) {
            this.imageHistoryIndex -= 1;
            this.vqaHistory = this.imageHistory[this.imageHistoryIndex];
        }
    }

    getNextVqaHistory() {
        if (this.imageHistoryIndex !== this.imageHistory.length - 1) {
            this.imageHistoryIndex += 1;
            this.vqaHistory = this.imageHistory[this.imageHistoryIndex];
        } else {
            this.xaiService
                .getNextVqaHistory(this.xaiService.defaultDataset, this.defaultPhase, this.getCurrentImageName(), ModelType.hiecoattenvqa)
                .subscribe(response => {
                    this.addToImageHistory(response);
                });
        }
    }

    getCurrentImageName() {
        return this.getImageName(this.vqaHistory.imgUri);
    }

    getCurrentImageNameNoExt() {
        return this.getCurrentImageName().replace(/\.[^/.]+$/, '');
    }

    getImageName(imgUri: string) {
        return imgUri.split(/(\\|\/)/g).pop();
    }

    selectImage(folder: FolderEntityObj, file: string) {
        this.showImageList = false;
        this.getVqaHistory(file);
    }

    resubmitAnnotation(event, vqaBundle: VqaBundle) {
        vqaBundle.groundTruth = vqaBundle.answer;
        this.resubmitQuestion(event, vqaBundle, '');
    }

    resubmitQuestion(event, vqaBundle: VqaBundle, forceAnswer: string) {
        event.stopPropagation();
        let messageDetail = vqaBundle.question;
        if (forceAnswer !== '') {
            messageDetail += '<br>Focusing on answer (' + forceAnswer + ')';
        }
        this.messageService.clear();
        this.messageService.add({ severity: 'success', summary: 'Question Re-submitted', detail: messageDetail });
        const newQuestion = new VqaBundle();
        newQuestion.id = uuid();
        newQuestion.question = vqaBundle.question;
        newQuestion.groundTruth = vqaBundle.groundTruth;
        newQuestion.forceAnswer = forceAnswer;
        newQuestion.img = this.getCurrentImageName();
        newQuestion.imgUri = this.vqaHistory.imgUri;
        this.vqaHistory.history.splice(0, 0, newQuestion);
        this.vqaHistory.selectedHistory = undefined;
        this.xaiService.submitQuestionHieCoAttenVqa(newQuestion).subscribe(response => {
            const indexToUpdate = this.vqaHistory.history.indexOf(newQuestion);
            this.vqaHistory.history[indexToUpdate] = response.body;
        });
    }

    submitQuestionWithGroundTruth(groundTruth: string) {
        this.messageService.clear();

        this.questionText = this.questionText.trim();
        if (this.questionText === '') {
            this.messageService.add({ severity: 'warn', summary: 'Enter a question', detail: '' });
        } else {
            this.messageService.add({ severity: 'success', summary: 'Question Submitted', detail: this.questionText });
            const newQuestion = new VqaBundle();
            newQuestion.id = uuid();
            newQuestion.question = this.questionText;
            newQuestion.img = this.getCurrentImageName();
            newQuestion.imgUri = this.vqaHistory.imgUri;
            newQuestion.groundTruth = groundTruth;
            this.questionText = '';
            this.vqaHistory.history.splice(0, 0, newQuestion);
            this.vqaHistory.selectedHistory = undefined;
            this.xaiService.submitQuestionHieCoAttenVqa(newQuestion).subscribe(response => {
                const indexToUpdate = this.vqaHistory.history.indexOf(newQuestion);
                this.vqaHistory.history[indexToUpdate] = response.body;
            });
        }
    }

    submitQuestion() {
        this.submitQuestionWithGroundTruth('');
    }

    waitColor(): string {
        return 'rgb(204, 118, 7)';
    }
    answerColor(vqaBundle: VqaBundle, compairAnswers): string {
        if (compairAnswers) {
            if (vqaBundle.answer !== vqaBundle.groundTruth) {
                // if (this.vqaHistory.selectedHistory === vqaBundle || this.vqaHistory.selectedAnnotation === vqaBundle) {
                //     return 'rgb(255, 153, 21)';
                // } else {
                return this.waitColor();
                // }
            }
        }
        // if (this.vqaHistory.selectedHistory === vqaBundle || this.vqaHistory.selectedAnnotation === vqaBundle) {
        //     return 'rgb(121, 243, 73)';
        // } else {
        return 'darkgreen';
        // }
    }
    setAgreement(event, vqaBundle: VqaBundle, agree: boolean) {
        if (vqaBundle.agree === agree) {
            vqaBundle.agree = null;
        } else {
            vqaBundle.agree = agree;
        }
        event.currentTarget.blur(); // Remove the focus on the button so the green/red styling updates.
    }
    getElapsedTime(vqaBundle: VqaBundle): number {
        return (new Date(vqaBundle.timeAnswered).getTime() - new Date(vqaBundle.timeAsked).getTime()) / 1000;
    }

    tabChanged(e) {
        this.selectedTabIndex = e.index;
    }

    getCurrentSelectedQuestion(): VqaBundle {
        if (this.guiOptions.tabviewLayout) {
            if (this.selectedTabIndex === 0) {
                // Ask a question
                if (this.vqaHistory.history.length > 0) {
                    return this.vqaHistory.history[0];
                }
                return undefined;
            } else if (this.selectedTabIndex === 1) {
                // Question History
                return this.vqaHistory.selectedHistory;
            } else if (this.selectedTabIndex === 2) {
                // Annotations
                return undefined;
            }
        } else {
            if (this.vqaHistory.selectedHistory !== undefined) {
                return this.vqaHistory.selectedHistory;
            } else if (this.vqaHistory.history.length > 0) {
                return this.vqaHistory.history[0];
            }
        }
        return undefined;
    }

    getSupportingEvidence(vqaBundle: VqaBundle): SupportingEvidence {
        const uniqueCategories = new Map<string, TreeNode>();
        if (vqaBundle.reply) {
            if (!vqaBundle.supportingEvidence) {
                // Converts the VqaNeurons into an array of TreeNode
                const newSupportingEvidence = new SupportingEvidence();
                const neurons: VqaNeuron[] = vqaBundle.reply.neurons;
                let topCategory: TreeNode;
                let topNeuron: TreeNode;
                // const uniqueCategories: string[] = [];
                neurons.forEach((category: VqaNeuron) => {
                    if (!uniqueCategories.has(category.category)) {
                        const categoryNode: TreeNode = {
                            label: category.category,
                            // data: neuron.category,
                            data: {
                                label: category.category,
                                activation: '',
                                accuracy: ''
                            },
                            expandedIcon: 'fa-folder-open',
                            collapsedIcon: 'fa-folder',
                            type: 'category',
                            selectable: false,
                            children: []
                        };
                        uniqueCategories.set(categoryNode.label, categoryNode);
                        neurons.forEach((neuron: VqaNeuron) => {
                            if (categoryNode.label === neuron.category) {
                                const neuronNode: TreeNode = {
                                    label: neuron.label,
                                    data: neuron,
                                    icon: 'fa-file-image-o',
                                    selectable: true,
                                    type: 'neuron'
                                };
                                newSupportingEvidence.activationFilter.addMinMaxValue(neuron.activation);
                                newSupportingEvidence.accuracyFilter.addMinMaxValue(neuron.accuracy);
                                this.globalAccuracyFilter.addMinMaxValue(neuron.accuracy);
                                categoryNode.children.push(neuronNode);
                                if (topNeuron === undefined || neuron.activation > topNeuron.data.activation) {
                                    // Select the top activated neuron
                                    topNeuron = neuronNode;
                                    topCategory = categoryNode;
                                }
                            }
                        });
                    }
                });
                // newSupportingEvidence.activationFilter.setMedian();
                if (topNeuron !== undefined) {
                    // Select the top activated neuron
                    // newSupportingEvidence.selectedNode = topNeuron;
                    newSupportingEvidence.selectedNeuron = topNeuron.data; // Flat Table:
                    topCategory.expanded = true;
                }
                newSupportingEvidence.treeNodes = Array.from(uniqueCategories.values());
                newSupportingEvidence.treeNodesFiltered = JSON.parse(JSON.stringify(newSupportingEvidence.treeNodes));
                vqaBundle.supportingEvidence = newSupportingEvidence;
                this.doEvidenceFilter();
            }
        }
        return vqaBundle.supportingEvidence;
    }

    onEvidenceFilter(event, treeTable: Table) {
        if (this.evidenceFilterTimeout) {
            clearTimeout(this.evidenceFilterTimeout);
        }
        this.evidenceFilterTimeout = setTimeout(() => {
            this.doEvidenceFilter();
        }, 100);
    }

    doEvidenceFilter() {
        const currentQuestion = this.getCurrentSelectedQuestion();
        const newSupportingEvidence = this.getSupportingEvidence(currentQuestion);
        let foundSelected = false;
        newSupportingEvidence.neuronsFiltered.length = 0; // Work around for the out of the box broke table filtering.
        for (let catIndex = 0; catIndex < newSupportingEvidence.treeNodes.length; catIndex++) {
            const categoryNodeSrc = newSupportingEvidence.treeNodes[catIndex];
            const categoryNodeDest = newSupportingEvidence.treeNodesFiltered[catIndex];
            categoryNodeDest.children.length = 0;
            for (let nIndex = 0; nIndex < categoryNodeSrc.children.length; nIndex++) {
                const neuronNodeSrc = categoryNodeSrc.children[nIndex];
                if (
                    neuronNodeSrc.data.activation >= newSupportingEvidence.activationFilter.decimalValue &&
                    neuronNodeSrc.data.accuracy >= this.globalAccuracyFilter.decimalValue
                ) {
                    // if (neuronNodeSrc === newSupportingEvidence.selectedNode) {
                    //     foundSelected = true;
                    // }
                    if (neuronNodeSrc.data === newSupportingEvidence.selectedNeuron) {
                        foundSelected = true;
                    }
                    categoryNodeDest.children.push(neuronNodeSrc);
                    newSupportingEvidence.neuronsFiltered.push(neuronNodeSrc.data); // Flat Table: Work around for the out of the box broke table filtering.
                }
            }
        }

        if (foundSelected === false) {
            // Clear selected evidence if that neruon has be filtered out. OBE Since selection can also be made via textual explanation
            // newSupportingEvidence.selectedNode = undefined;
            // newSupportingEvidence.selectedNeuron = undefined; // Flat Table:
        }

        // Flat Table:  Out of the box table filtering is broke  https://github.com/primefaces/primeng/issues/5040
        // Flat Table: this.supportingEvidenceTable.filter(newSupportingEvidence.accuracyFilter.decimalValue, 'accuracy', 'gt');
        // Flat Table: this.supportingEvidenceTable.filter(newSupportingEvidence.activationFilter.decimalValue, 'activation', 'gt');
        if (this.supportingEvidenceTable !== undefined) {
            this.supportingEvidenceTable.sortSingle(); // Flat Table: filtering clears the sort.  re-apply sort
        }
    }
    truncateNumber(value: any, precision: number): string {
        if (value === '') {
            return '';
        }
        return Number(value).toFixed(precision);
    }
    expandOrCollapse(treeTable: Table, expanded: boolean) {
        for (const node of treeTable.value) {
            if (node.children) {
                node.expanded = expanded;
            }
        }
    }
    sortTreeTable(treeTable: Table, filedName: string) {
        let sortDirection = 1;
        const supportingEvidence = this.getSupportingEvidence(this.getCurrentSelectedQuestion());
        if (supportingEvidence.sortDirection === 'sort-down') {
            sortDirection = 1;
            supportingEvidence.sortDirection = 'sort-up';
        } else {
            sortDirection = -1;
            supportingEvidence.sortDirection = 'sort-down';
        }
        supportingEvidence.sortField = filedName;
        const sortCompareFn = (n1: TreeNode, n2: TreeNode) => {
            if (n1.data[filedName] > n2.data[filedName]) {
                return sortDirection;
            }
            if (n1.data[filedName] < n2.data[filedName]) {
                return -sortDirection;
            }
            return 0;
        };
        for (const node of supportingEvidence.treeNodes) {
            // Sort child nodes
            node.children.sort(sortCompareFn);
        }
        if (filedName === 'label') {
            // When sorting by label, also sort top level nodes (category).
            supportingEvidence.treeNodes.sort(sortCompareFn);
            supportingEvidence.treeNodesFiltered.sort(sortCompareFn);
        }
        this.doEvidenceFilter();
    }
    isSelectedAnswer(answer: string) {
        const currentQuestion = this.getCurrentSelectedQuestion();
        if (currentQuestion.forceAnswer !== '' && currentQuestion.forceAnswer === answer) {
            return true;
        } else {
            if (currentQuestion.answer === answer) {
                return true;
            }
        }
        return false;
    }
    getSingleImageUrl(index: number) {
        const supportingEvidence = this.getSupportingEvidence(this.getCurrentSelectedQuestion());
        const filePrefix = 'conv5_4-';
        const padNeuronId = ('0000' + supportingEvidence.selectedNeuron.neuronId).slice(-4);
        return '/evaluation_dataset/net_dissection_single_images/' + filePrefix + padNeuronId + '-00' + index + '.jpg';
    }
    setFilterToGradCam() {
        this.selectedFilter = this.selectedFilter.replace('_neuron_', '');
    }
    findNeuron(neuronId: number): VqaNeuron {
        const currentQuestion = this.getCurrentSelectedQuestion();
        const foundNeuron = currentQuestion.reply.neurons.find(n => n.neuronId === neuronId);
        return foundNeuron;
    }
    setSelectedNeuron(neuron: VqaNeuron) {
        if (!this.selectedFilter.endsWith('_neuron_')) {
            this.selectedFilter = this.selectedFilter + '_neuron_';
        }
        const currentQuestion = this.getCurrentSelectedQuestion();
        this.getSupportingEvidence(currentQuestion).selectedNeuron = neuron;
    }
    getSelectedNeuronId() {
        const currentQuestion = this.getCurrentSelectedQuestion();
        const selectedNeruon = this.getSupportingEvidence(currentQuestion).selectedNeuron;
        if (selectedNeruon !== undefined && selectedNeruon !== null) {
            return selectedNeruon.neuronId;
        }
        return -999;
    }
    getSimilarCaseActivation(index: number): string {
        const result: any = this.similarCases[
            this.getSupportingEvidence(this.getCurrentSelectedQuestion()).selectedNeuron.neuronId + '-' + index
        ];
        if (result !== undefined) {
            return this.truncateNumber(result.activation, 2);
        }
        return 'n/a';
    }
    applyThresholdFilter() {
        this.thresholdFilter.apply('sourceGS', 'canvasThreshold');
    }
    clearThresholdFilter() {
        this.thresholdFilter.clear('canvasThreshold');
    }

    displayGlobalExplanation(globalExplanationActiveTab: number, answerText: string) {
        const currentQuestion = this.getCurrentSelectedQuestion();
        this.focusOnQuestion = currentQuestion.question;
        this.focusOnAnswer = answerText; // currentQuestion.answer;
        this.globalExplanationActiveTab = globalExplanationActiveTab;
        this.showGlobalExplanation = true;
    }
}
