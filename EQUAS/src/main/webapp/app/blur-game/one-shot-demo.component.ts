import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { saveAs } from 'file-saver';
import { generate } from 'shortid';

const SeededShuffle = require('./seededshuffle.js');
// import h337 from 'heatmap.js/build/heatmap.js';
const h337 = require('heatmap.js/build/heatmap.js');

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
    OneShotAnswerV2,
    DemoAspect,
    DemoImage,
    DemoScoreInput,
    HeatMapData,
    DemoSave
} from 'app/shared/model/global-explanation.model';
import { PixelateFilter } from 'app/shared/xai/xai.pixelatefilter';
import { JhiEventManager } from 'ng-jhipster';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { Account, LoginModalService, Principal } from '../core';
import { XAIService } from '../shared/xai/xai.service';
import { TabMenu } from 'primeng/tabmenu';

@Component({
    selector: 'jhi-one-shot-demo',
    templateUrl: './one-shot-demo.component.html',
    providers: [MessageService],
    styleUrls: ['one-shot-demo.scss']
})
export class OneShotDemoComponent implements OnInit, OnDestroy {
    account: Account;
    modalRef: NgbModalRef;

    sessionId = '';
    loadComplete = false;
    showProgressSpinner = false;
    progressSpinnerMessage = '';
    maxResults = 32;
    showSaveHistory = false;
    saveHistory: DemoSave[] = [];
    examples: DemoSave[] = [];

    exampleImages = [
        {
            id: 501,
            name: 'Yak-42',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Yak-42/0104604.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 5286,
            name: 'Tornado',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Tornado/0880063.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 726,
            name: 'Spitfire',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Spitfire/0597780.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 365,
            name: 'Saab_2000',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Saab_2000/0454814.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 304,
            name: 'Il-76',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Il-76/0523228.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 5467,
            name: 'Global_Express',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Global_Express/0422687.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 886,
            name: 'FA-18',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/FA-18/1085151.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 536,
            name: 'DR-400',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/DR-400/0482762.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 6737,
            name: 'Dornier_328',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Dornier_328/0143367.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 852,
            name: 'DHC-1',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/DHC-1/0653292.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 580,
            name: 'DH-82',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/DH-82/0548757.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 5634,
            name: 'DC-10',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/DC-10/0065834.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 2800,
            name: 'CRJ-900',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/CRJ-900/1237704.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 945,
            name: 'Cessna_172',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Cessna_172/0890644.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 4913,
            name: 'C-130',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/C-130/0606131.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 634,
            name: 'C-47',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/C-47/0174884.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 3411,
            name: 'Beechcraft_1900',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/Beechcraft_1900/0048339.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 645,
            name: 'BAE-125',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/BAE-125/0297025.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: true
        },
        {
            id: 8473,
            name: 'ATR-42',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/ATR-42/0114437.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        },
        {
            id: 8897,
            name: 'An-12',
            image_path: '../../../evaluation_dataset/one_shot_data/aircraft_data/An-12/0582365.jpg',
            score: 0,
            b64_image: '',
            in_aspect: false,
            include: false
        }
    ];
    exportMenuItems = [
        {
            label: 'Export All Aspects',
            icon: 'fas fa-file-download',
            command: () => {
                this.downloadAllAspects();
            }
        },
        {
            label: 'Export Score Inputs',
            icon: 'fas fa-file-download',
            command: () => {
                this.downloadScoreInputs();
            }
        },
        {
            label: 'Export Score Results',
            icon: 'fas fa-file-download',
            command: () => {
                this.calcScore(true);
            }
        },
        {
            label: 'Save As Example',
            icon: 'fas fa-chalkboard-teacher',
            command: () => {
                this.saveAsExample();
            }
        }
        // {
        //     label: 'Score Test Data',
        //     icon: 'fas fa-chart-line',
        //     command: () => {
        //         this.calcScoreTest();
        //     }
        // }
    ];
    heatmap = undefined;
    brushColor = 'red';
    brushRadius = 6;

    autoUpdateTimeout;
    autoUpdateSpinner = false;
    demoResponse: DemoImage[] = [];
    showCanidates: true;
    // aspects: DemoAspect[] = [];
    // selectedAspect: DemoAspect;
    aspect = {
        display: true,
        newAspect: new DemoAspect(),
        all: new Array<DemoAspect>(),
        selected: new DemoAspect(),
        count: 1,
        exampleImages: this.exampleImages,
        initalImages: JSON.parse(JSON.stringify(this.exampleImages)),
        parent: this,
        rename: false,
        init(route) {
            const id = route.snapshot.queryParams['id'] ? route.snapshot.queryParams['id'] : '';
            if (id) {
                for (const img of this.initalImages) {
                    if (id === img.id.toString()) {
                        this.makeDefault(img);
                    }
                }
                this.accept();
            }
        },
        open() {
            this.initalImages = JSON.parse(JSON.stringify(this.exampleImages));
            this.newAspect = new DemoAspect();
            if (this.selected) {
                const defaultImage: DemoImage = JSON.parse(JSON.stringify(this.selected.images[0]));
                defaultImage.heatmapData = new HeatMapData();
                defaultImage.b64_image = '';
                this.newAspect.images.push(defaultImage);
            }
            this.newAspect.id = this.all.length;
            this.newAspect.name = 'My Aspect #' + this.count;
            this.display = true;
            this.selectAspectText();
        },
        accept() {
            if (this.all.length === 0) {
                this.all.push(this.newAspect);
                this.count += 1;
                this.selectAspectText();
                this.selected = this.newAspect;
            } else {
                this.display = false;
                const index = this.all.indexOf(this.newAspect, 0);
                if (index === -1) {
                    this.count += 1;
                    this.all.push(this.newAspect);
                }
                this.selected = this.newAspect;
            }
        },
        cancel() {
            this.display = false;
        },
        deleteAspect(aspect: DemoAspect, confirmationService: ConfirmationService) {
            confirmationService.confirm({
                message: 'Are you sure you want to delete the aspect (' + aspect.name + ')?',
                accept: () => {
                    const index = this.all.indexOf(aspect, 0);
                    if (index > -1) {
                        this.all.splice(index, 1);
                        if (index > 0) {
                            this.selected = this.all[index - 1];
                        } else {
                            this.selected = this.all[index];
                        }
                        this.parent.class_features_demo();
                    }
                }
            });
        },
        makeDefault(image: DemoImage) {
            this.newAspect.images.forEach(element => {
                this.removeFromAspect(element);
            });
            this.addToAspect(image);
        },
        toggleAspect(image: DemoImage) {
            if (!image.in_aspect) {
                this.addToAspect(image);
            } else {
                this.removeFromAspect(image);
            }
        },
        addToAspect(image: DemoImage) {
            if (!image.in_aspect) {
                image.in_aspect = true;
                this.newAspect.images.push(image);
            }
        },
        removeFromAspect(image: DemoImage) {
            const index = this.newAspect.images.indexOf(image, 0);
            if (index > -1) {
                this.newAspect.images.splice(index, 1);
                image.in_aspect = false;
            }
        },
        selectAspectText() {
            setTimeout(() => {
                const input = <HTMLInputElement>document.getElementById('txtAspect');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 150);
        }
    };

    recallChart = {
        display: false,
        data: {
            labels: [],
            datasets: [
                // {
                //     label: 'Recall',
                //     data: [],
                //     backgroundColor: [],
                //     fill: false,
                //     borderColor: '#36a2eb',
                //     pointRadius: 0,
                //     lineTension: 0
                // }
                {
                    label: 'Precision',
                    data: [],
                    backgroundColor: [],
                    fill: false,
                    borderColor: '#F26E1D',
                    // pointRadius: 0,
                    lineTension: 0
                },
                {
                    label: 'True Positives',
                    data: [],
                    backgroundColor: [],
                    fill: false,
                    borderColor: 'green',
                    // pointRadius: 0,
                    lineTension: 0,
                    hidden: true
                },
                {
                    label: 'False Positives',
                    data: [],
                    backgroundColor: [],
                    fill: false,
                    borderColor: 'yellow',
                    // pointRadius: 0,
                    lineTension: 0,
                    hidden: true
                }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'AUC'
            },
            legend: {
                display: false,
                position: 'bottom'
            },
            tooltips: {
                displayColors: false,
                callbacks: {
                    label: (tooltipItem, data) => {
                        const lines = [];
                        // lines.push('Recall: ' + data.labels[tooltipItem.index]);
                        lines.push('Precision: ' + data.datasets[0].data[tooltipItem.index].toFixed(3));
                        lines.push('True Positives: ' + data.datasets[1].data[tooltipItem.index]);
                        lines.push('False Positives: ' + data.datasets[2].data[tooltipItem.index]);
                        return lines;
                    },
                    title: (tooltipItem, data) => {
                        return 'Recall: ' + data.labels[tooltipItem[0].index];
                    }
                }
            },
            scales: {
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                            // max: 1,
                            min: 0
                            // stepSize: 1
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Precision'
                        }
                    }
                ],
                xAxes: [
                    {
                        // ticks: {
                        //     //beginAtZero: true,
                        //     callback: (value, index, values) => {
                        //       return value.toFixed(3);
                        //     }
                        //   }
                        // ticks: {
                        //     beginAtZero: true,
                        //     // max: 1,
                        //     min: 0
                        //     // stepSize: 1
                        // },
                        ticks: { autoSkip: true, stepSize: 0.1, max: 0, min: 1 },
                        scaleLabel: {
                            display: true,
                            labelString: 'Recall'
                        }
                    }
                ]
            }
        }
    };
    // recallChartInstance = JSON.parse(JSON.stringify(this.recallChart));
    items = [
        { label: 'Home', icon: 'pi pi-fw pi-home' },
        { label: 'Calendar', icon: 'pi pi-fw pi-calendar' },
        { label: 'Edit', icon: 'pi pi-fw pi-pencil' },
        { label: 'Documentation', icon: 'pi pi-fw pi-file' },
        { label: 'Settings', icon: 'pi pi-fw pi-cog' }
    ];

    @HostListener('window:beforeunload', ['$event'])
    saveOnBrowserClose($event) {
        // Warn user when closing via browser exit
        $event.returnValue = 'There are unsaved changes';
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
        public confirmationService: ConfirmationService
    ) {}

    ngOnDestroy() {}

    ngOnInit() {
        try {
            if ('sessionId' in localStorage === false) {
                localStorage.setItem('sessionId', generate());
            }
            this.sessionId = localStorage.getItem('sessionId');
            this.loadComplete = true;
            this.aspect.init(this.route);
        } catch (e) {
            this.logError(e);
        }

        this.principal.identity().then(account => {
            this.account = account;
        });

        this.registerAuthenticationSuccess();
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

    getWorkerId() {
        return this.sessionId;
    }

    smoothScrollToElement(elementId: string) {
        if (document.getElementById(elementId)) {
            const element = <HTMLElement>document.getElementById(elementId);
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showSpinner(message: string) {
        this.showProgressSpinner = true;
        this.progressSpinnerMessage = message;
    }

    hideSpinner() {
        this.showProgressSpinner = false;
        this.progressSpinnerMessage = '';
    }

    addToAspect(image: DemoImage) {
        this.aspect.selected.images.push(JSON.parse(JSON.stringify(image)));
        this.refreshExcluded();
    }

    removeFromAspect(image: DemoImage) {
        const index = this.aspect.selected.images.indexOf(image, 0);
        if (index === 0) {
            this.confirmationService.confirm({
                message: 'The default image for the aspect can not be removed',
                icon: 'pi pi-info-circle',
                key: 'Info',
                acceptLabel: 'OK',
                rejectVisible: false,
                accept: () => {}
            });
        } else {
            if (this.aspect.selected.images.length > 1) {
                this.confirmationService.confirm({
                    message: 'Are you sure you want to remove the aircraft (' + image.name + ' - Id:' + image.id + ') from the aspect?',
                    accept: () => {
                        const index = this.aspect.selected.images.indexOf(image, 0);
                        if (index > -1) {
                            this.aspect.selected.images.splice(index, 1);
                            this.refreshExcluded();
                            this.refreshCandidates();
                        }
                    }
                });
            } else {
                this.confirmationService.confirm({
                    message: 'The last image of the aspect can not be removed',
                    icon: 'pi pi-info-circle',
                    key: 'Info',
                    acceptLabel: 'OK',
                    rejectVisible: false,
                    accept: () => {}
                });
            }
        }
    }

    refreshExcluded() {
        const uniqueIds = [];
        for (const aspectImage of this.aspect.selected.images) {
            uniqueIds.push(aspectImage.id);
        }
        for (const canidateImage of this.demoResponse) {
            if (uniqueIds.includes(canidateImage.id)) {
                canidateImage.in_aspect = true;
            } else {
                canidateImage.in_aspect = false;
            }
        }
    }

    refreshCandidates() {
        if (this.autoUpdateTimeout) {
            clearTimeout(this.autoUpdateTimeout);
        }
        this.autoUpdateTimeout = setTimeout(() => {
            this.class_features_demo();
        }, 1000);
    }

    class_features_demo(): void {
        const maxResultForm = <HTMLFormElement>document.getElementById('maxResultForm');
        if (maxResultForm.reportValidity()) {
            this.autoUpdateSpinner = true;
            this.globalExplanationService.class_features_demo(this.aspect.selected, this.maxResults).subscribe(response => {
                this.demoResponse = response.body;
                this.refreshExcluded();
                // this.smoothScrollToElement('listOfCanidates');

                this.autoUpdateSpinner = false;
            });
        }
    }

    itemClick(tabMenu: any): void {
        if (tabMenu.activeItem !== this.aspect.selected) {
            this.aspect.selected = tabMenu.activeItem;
            this.class_features_demo();
        }
    }

    blobToFile(theBlob: Blob, fileName: string): File {
        // var b: any = theBlob;
        // //A Blob() is almost a File() - it's just missing the two properties below which we will add
        // b.lastModifiedDate = new Date();
        // b.name = fileName;

        // //Cast to a File() type
        // return <File>theBlob;
        return new File([theBlob], fileName);
    }

    dataURItoBlob(dataURI) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI
            .split(',')[0]
            .split(':')[1]
            .split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);

        // create a view into the buffer
        var ia = new Uint8Array(ab);

        // set the bytes of the buffer to the correct values
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var blob = new Blob([ab], { type: mimeString });
        return blob;
    }

    getScoreInputs() {
        const demoScoreInput = new DemoScoreInput();
        demoScoreInput.id = this.aspect.selected.images[0].id;
        demoScoreInput.class = this.aspect.selected.images[0].name;
        for (const aspect of this.aspect.all) {
            if (!aspect.excluded) {
                demoScoreInput.aspects[aspect.id.toString()] = {
                    name: aspect.name,
                    data: aspect.images
                };
            }
        }
        return demoScoreInput;
    }

    validateScoreInputs(scoreInput: DemoScoreInput): boolean {
        let aspectCount = 0;
        for (const aspect of this.aspect.all) {
            if (!aspect.excluded) {
                aspectCount += 1;
                for (const img of aspect.images) {
                    if (img.heatmapData.data.length === 0) {
                        this.confirmationService.confirm({
                            message:
                                'Aircraft (' +
                                img.name +
                                ' - Id:' +
                                img.id +
                                ') in aspect (' +
                                aspect.name +
                                ') has not been annotated with the paint tool.  Either annotate or remove this aircraft prior to scoring.',
                            key: 'Info',
                            acceptLabel: 'OK',
                            rejectVisible: false,
                            accept: () => {}
                        });
                        return false;
                    }
                }
            }
        }

        if (aspectCount === 0) {
            this.confirmationService.confirm({
                message: 'At least one aspect needs to be included prior to scoring.',
                key: 'Info',
                acceptLabel: 'OK',
                rejectVisible: false,
                accept: () => {}
            });
            return false;
        }
        return true;
    }

    calcScore(download: boolean) {
        this.showSpinner('Calculating Score...');
        const scoringInputs = this.getScoreInputs();
        if (this.validateScoreInputs(scoringInputs)) {
            this.globalExplanationService.class_scores_demo(scoringInputs).subscribe(
                response => {
                    // this.recallResult = response;
                    if (!download) {
                        this.plotScore(response.body);
                    } else {
                        saveAs(
                            new Blob([JSON.stringify(response.body, null, 2)], { type: 'text' }),
                            response.body.id + '-' + scoringInputs.class + '-score-results.json'
                        );
                    }
                    this.hideSpinner();
                },
                response => {
                    this.hideSpinner();
                    this.confirmationService.confirm({
                        message: 'Error encountered during scoring: ' + JSON.stringify(response.error.message),
                        key: 'Info',
                        acceptLabel: 'OK',
                        rejectVisible: false,
                        accept: () => {}
                    });
                }
            );
        } else {
            this.hideSpinner();
        }
    }

    calcScoreTest() {
        this.showSpinner('Calculating Score...');
        this.globalExplanationService.class_scores_demo_test().subscribe(
            response => {
                this.plotScore(response);
                this.hideSpinner();
            },
            response => {
                this.hideSpinner();
            }
        );
    }

    plotScore(recallResult) {
        // this.recallChartInstance = JSON.parse(JSON.stringify(this.recallChart));
        this.recallChart.data.labels.length = 0;
        this.recallChart.data.datasets[0].data.length = 0;
        this.recallChart.data.datasets[1].data.length = 0;
        this.recallChart.data.datasets[2].data.length = 0;

        const aucRounded = Math.round(recallResult.auc * 1000 + Number.EPSILON) / 1000;
        this.recallChart.options.title.text =
            'Class: ' + this.aspect.selected.images[0].name + ' - ID: ' + recallResult.id + ' AUC (' + aucRounded + ')';

        let lastX = 0;
        recallResult.recall.reverse();
        recallResult.precision.reverse();
        recallResult.tp.reverse();
        recallResult.fp.reverse();
        for (let index = 0; index < recallResult.recall.length; index++) {
            const recall = recallResult.recall[index];
            const precision = recallResult.precision[index];
            const tp = recallResult.tp[index];
            const fp = recallResult.fp[index];

            const currentX = recall.toFixed(3); // Toss out values if the recall doesn't change by at least a precision of 3... maybe even 2?
            // if (lastX !== currentX) {
            //     lastX = currentX;
            this.recallChart.data.labels.push(currentX);
            this.recallChart.data.datasets[0].data.push(precision);

            this.recallChart.data.datasets[1].data.push(tp);
            this.recallChart.data.datasets[2].data.push(fp);
            // }
        }
        this.recallChart.display = true;
    }
    getDefaultName() {
        let name = this.aspect.all[0].images[0].name;
        let aspectNames = ' (';
        this.aspect.all.forEach(element => {
            aspectNames += element.name + ', ';
        });
        aspectNames = aspectNames.slice(0, -2);
        aspectNames += ')';
        name += aspectNames;
        return name;
    }
    saveDemoState() {
        this.showSpinner('Saving Aspects...');
        const name = this.getDefaultName();
        this.globalExplanationService.save_demo_state(this.aspect.all, this.sessionId, name).subscribe(
            response => {
                setTimeout(() => {
                    this.hideSpinner();
                }, 500);
            },
            response => {
                this.hideSpinner();
            }
        );
    }
    saveAsExample() {
        let name = this.getDefaultName();
        name = prompt('What name would you like to name this example?', name);
        if (name != null && name !== '') {
            this.showSpinner('Saving Example...');
            this.globalExplanationService.save_demo_state(this.aspect.all, 'example', name).subscribe(
                response => {
                    setTimeout(() => {
                        this.hideSpinner();
                    }, 500);
                },
                response => {
                    this.hideSpinner();
                }
            );
        }
    }
    getMySaves() {
        this.showSpinner('Getting My Saves...');
        this.globalExplanationService.my_one_shot_demo_saves(this.sessionId).subscribe(
            response => {
                this.saveHistory.length = 0;
                this.examples.length = 0;
                for (let index = response.body.length - 1; index >= 0; index--) {
                    const save = response.body[index];
                    if (save.sessionId === 'example') {
                        this.examples.push(save);
                    } else {
                        this.saveHistory.push(save);
                    }
                }
                // this.saveHistory = response.body.reverse();
                this.showSaveHistory = true;
                this.hideSpinner();
            },
            response => {
                this.hideSpinner();
            }
        );
    }

    promptOpenSave(demoSave: DemoSave) {
        if (this.aspect.all.length === 0) {
            this.aspect.display = false;
            this.openSave(demoSave);
        } else {
            this.confirmationService.confirm({
                message:
                    'Are you sure you want to open (' + demoSave.name + ')?  Any unsaved changes to the current aircraft will be lost.',
                accept: () => {
                    this.aspect.display = false;
                    this.openSave(demoSave);
                }
            });
        }
    }
    openSave(demoSave: DemoSave) {
        this.showSpinner('Opening Save...');
        this.globalExplanationService.get_one_shot_demo_save(demoSave['_id']).subscribe(
            response => {
                this.showSaveHistory = false;
                const demoSave = response.body;
                try {
                    this.showSpinner('Loading Aspects...');
                    this.loadComplete = false;
                    this.aspect.all.length = 0;
                    this.aspect.all = demoSave.aspects;
                    this.aspect.selected = this.aspect.all[0];
                } catch (error) {
                    this.confirmationService.confirm({
                        message: 'Error encountered during opening: ' + JSON.stringify(error.message),
                        key: 'Info',
                        acceptLabel: 'OK',
                        rejectVisible: false,
                        accept: () => {}
                    });
                }
                setTimeout(() => {
                    this.loadComplete = true;
                    this.hideSpinner();
                    this.refreshCandidates();
                }, 1000);
            },
            response => {
                this.hideSpinner();
            }
        );
    }

    searchTimeout;
    recover_images_by_class(query_str: string) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            // this.showSpinner('Searching...');
            this.globalExplanationService.recover_images_by_class(query_str).subscribe(
                response => {
                    this.aspect.initalImages.length = 0;
                    for (let img of response.body) {
                        img.image_path = img.image_path.replace('aircraft_data_test', 'aircraft_data');
                        this.aspect.initalImages.push(img);
                    }
                },
                response => {
                    this.hideSpinner();
                }
            );
        }, 1000);
    }

    downloadScoreInputs() {
        const results = this.getScoreInputs();
        saveAs(new Blob([JSON.stringify(results, null, 2)], { type: 'text' }), results.id + '-' + results.class + '-score-inputs.json');
    }

    downloadAllAspects() {
        const image = this.aspect.selected.images[0];
        saveAs(new Blob([JSON.stringify(this.aspect.all, null, 2)], { type: 'text' }), image.id + '-' + image.name + '-all-aspects.json');
    }

    importAspects(importControlEvent, importControl) {
        importControlEvent.files.forEach(file => {
            const fileReader = new FileReader();
            fileReader.onloadend = (() => {
                return event => {
                    const fileContents = event.target.result;
                    const error = event.target.error;
                    if (error != null) {
                        switch (error.code) {
                            case error.ENCODING_ERR:
                                console.log('File read encoding error.');
                                break;
                            case error.NOT_FOUND_ERR:
                                console.log('The file could not be found at the time the read was processed.');
                                break;
                            case error.NOT_READABLE_ERR:
                                console.log('The file could not be read.');
                                break;
                            case error.SECURITY_ERR:
                                console.log('Security error with file.');
                                break;
                            default:
                                console.log('Uncategorized file read error: ' + event.target.error.name + '.');
                        }
                    } else {
                        this.importAspects2(fileContents);
                    }
                };
            })();
            fileReader.readAsText(file);
        });
        importControl.clear(); // Reset control
    }

    importAspects2(fileContents: string) {
        try {
            this.aspect.display = false;
            this.showSaveHistory = false;
            this.showSpinner('Loading Aspects...');
            this.loadComplete = false;
            this.aspect.all.length = 0;
            this.aspect.all = JSON.parse(fileContents);
            this.aspect.selected = this.aspect.all[0];
        } catch (error) {
            this.confirmationService.confirm({
                message: 'Error encountered during import: ' + JSON.stringify(error.message),
                key: 'Info',
                acceptLabel: 'OK',
                rejectVisible: false,
                accept: () => {}
            });
        }
        setTimeout(() => {
            this.loadComplete = true;
            this.hideSpinner();
            this.refreshCandidates();
        }, 1000);
    }
}
