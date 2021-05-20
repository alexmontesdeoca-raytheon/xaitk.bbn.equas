import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { Annotation, AnnotationDialogModel, GlobalExplanationDataset } from 'app/shared/model/global-explanation.model';
import { PixelateFilter } from 'app/shared/xai/xai.pixelatefilter';
import { saveAs } from 'file-saver';
import { JhiEventManager } from 'ng-jhipster';
import { MessageService } from 'primeng/api';
import { Account, LoginModalService, Principal } from '../core';
import { XAIService } from '../shared/xai/xai.service';

@Component({
    selector: 'jhi-blur-exporter',
    templateUrl: './blur-exporter.component.html',
    providers: [MessageService],
    styleUrls: ['blur-game.scss']
})
export class BlurExporterComponent implements OnInit {
    account: Account;
    modalRef: NgbModalRef;

    batchBlurIndex = 0;
    blurMax = 96;
    blurAmount = this.blurMax;
    blurStep = 0.02;
    pixelateFilter = new PixelateFilter();
    blurStrategy = 'Downsample';
    blurSmoothing = 100;
    @ViewChild('imgBlurGaussian') imgBlurGaussian: ElementRef;
    globalExplanationDataset = new GlobalExplanationDataset();
    gefilter = 'blur-game';
    // questionsCompleted = 1;
    annotationIndex = 0;
    currentAnnotation = new Annotation();
    loadComplete = false;
    blurLimit = 30;
    // Componenent explanations
    @ViewChild('downSampleCanvas') componentOverlay: ElementRef;
    showComponentOverlay = true;

    annotationDialogModel = new AnnotationDialogModel();
    batchBlurLevel = 98;
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
        private router: Router
    ) {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        setTimeout(() => {
            // Give the GUI/Spinner time to draw before building dataset
            this.getGlobalExplanationDataset();
        }, 400);
    }
    ngOnInit() {
        try {
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

    getGlobalExplanationDataset() {
        console.log('Get Global Explanation - ' + this.gefilter);
        this.loadComplete = false;

        this.globalExplanationService.getBlurGameQuestions().subscribe(response => {
            this.annotationDialogModel.annotations = response.body;
            this.currentAnnotation = this.annotationDialogModel.annotations[0];
            this.loadComplete = true;

            setTimeout(() => {
                // give the image time to load
                this.blurMax = 98;
                this.blurStep = 2;
                this.blurLimit = 1;
                this.blurAmount = this.blurMax;
            }, 1000);
        });
    }

    getImageNameNoExt() {
        return this.currentAnnotation.imageName.replace(/\.[^/.]+$/, '');
    }

    guassianEstimation() {
        // return (this.pixelateFilter.originalPixelCount() / (this.blurAmount * 2 )) / this.pixelateFilter.originalPixelCount()
        return 1 / this.blurAmount;
    }

    getBlurStyle() {
        // dividing by window.devicePixelRatio accounts for the browser zoom level
        this.applyPixelateFilter(false);
        return 'blur(' + this.pixelateFilter.blurRadius / window.devicePixelRatio + 'px)';
    }

    deBlur() {
        // const frameCount = 15;
        // const targetBlurAmount = Number(Number(this.blurAmount - this.blurAmount * this.blurStep).toPrecision(2));
        // this.deBlurAnimate(targetBlurAmount, targetBlurAmount / frameCount);
        const newblurAmount = this.blurAmount - this.blurStep * 100;
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

    saveBlurryImage() {
        const canvas = document.getElementById('imgBlurDownsample') as HTMLCanvasElement;
        const imageName = this.currentAnnotation.imageName.replace('.jpg', '');
        canvas.toBlob(blob => {
            saveAs(blob, imageName + '-' + this.blurAmount + '.png');
        });
    }

    batchSaveBlurryImages() {
        this.batchBlurIndex = 0;
        this.currentAnnotation = this.annotationDialogModel.annotations[this.batchBlurIndex];
        setTimeout(() => {
            // give the image time to load
            this.blurAmount = 98;
            this.deblurAndSave(this.blurAmount);
        }, 1000);
    }

    deblurAndSave(blurLevel) {
        this.pixelateFilter.apply('sourceImage', 'imgBlurDownsample', this.blurAmount, this.blurSmoothing, true);
        const canvas = document.getElementById('imgBlurDownsample') as HTMLCanvasElement;
        const imageName = this.currentAnnotation.imageName.replace('.jpg', '');
        canvas.toBlob(blob => {
            saveAs(blob, imageName + '-' + this.blurAmount + '.jpg');
            if (this.blurAmount > 80) {
                this.blurAmount -= 2;
                this.deblurAndSave(this.blurAmount);
            } else {
                this.batchBlurIndex += 1;
                if (this.batchBlurIndex < 4) {
                    this.currentAnnotation = this.annotationDialogModel.annotations[this.batchBlurIndex];
                    setTimeout(() => {
                        // give the image time to load
                        this.blurAmount = 98;
                        this.deblurAndSave(this.blurAmount);
                    }, 1000);
                }
            }
        });
    }
}
