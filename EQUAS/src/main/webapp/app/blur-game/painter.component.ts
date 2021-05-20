import {
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    AfterViewInit,
    Output,
    EventEmitter
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { GlobalExplanationService } from 'app/entities/global-explanation';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { saveAs } from 'file-saver';
import { generate } from 'shortid';

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
    HeatMapData,
    HeatMapCoordinates
} from 'app/shared/model/global-explanation.model';
import { PixelateFilter } from 'app/shared/xai/xai.pixelatefilter';
import { JhiEventManager } from 'ng-jhipster';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { Account, LoginModalService, Principal } from '../core';
import { XAIService } from '../shared/xai/xai.service';

@Component({
    selector: 'jhi-painter',
    templateUrl: './painter.component.html',
    providers: [MessageService],
    styleUrls: ['one-shot-demo.scss']
})
export class PainterComponent implements OnInit, OnDestroy {
    @Input() demoImage = new DemoImage();
    @Input() imageIndex = 0;
    @Input() brushRadius = 10;
    @Input() brushColor = 'red';
    @Output() remove: EventEmitter<any> = new EventEmitter();
    @Output() maskUpdated: EventEmitter<any> = new EventEmitter();
    heatmapId = generate();
    heatmap = undefined;
    isDirty = false;
    undoStack: HeatMapData[] = [];
    redoStack: HeatMapData[] = [];

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
    ) {}

    ngOnDestroy() {}

    ngOnInit() {}

    ngAfterViewInit() {
        this.initHeatmap();
    }

    initHeatmap(): void {
        if (this.heatmap) {
            const canvas = this.heatmap._renderer.canvas;
            canvas.remove();
            this.heatmap = undefined;
        }
        const heatmapContainer = document.getElementById(this.heatmapId);
        this.heatmap = h337.create({
            container: heatmapContainer,
            radius: 15,
            opacity: 0.7,
            blur: 0.6,
            gradient: {
                // enter n keys between 0 and 1 here
                // for gradient color customization
                '0': this.brushColor
                // '.8': 'red',
                // '.95': 'red'
            }
            // gradient: {
            //     0     : '#00f',
            //     0.2   : '#00f',
            //     0.2001: '#0ff',
            //     0.4   : '#0ff',
            //     0.4001: '#0f0',
            //     0.6   : '#0f0',
            //     0.6001: '#ff0',
            //     0.8   : '#ff0',
            //     0.8001: '#f00',
            //     1     : '#f00'
            // }
        });
        const heatmapCanvas: HTMLCanvasElement = <HTMLCanvasElement>heatmapContainer.getElementsByClassName('heatmap-canvas')[0];
        heatmapCanvas.style.pointerEvents = 'none';
        heatmapCanvas.style.width = '100%';
        heatmapCanvas.style.height = '100%';
        if (this.demoImage.heatmapData) {
            this.heatmap.setData(this.demoImage.heatmapData);
            this.demoImage.b64_image = this.heatmap.getDataURL();
        } else {
            this.heatmap.setData(new HeatMapData());
            this.demoImage.heatmapData = this.heatmap.getData();
            this.demoImage.b64_image = this.heatmap.getDataURL();
        }
        this.undoStack.push(this.heatmap.getData());
    }

    clearHeatMap(): void {
        if (this.heatmap) {
            this.isDirty = true;
            this.heatmap.setData(new HeatMapData());
            this.updateHeatmap();
        }
    }

    paintWholeImage(): void {
        if (this.heatmap) {
            this.isDirty = true;
            this.heatmap.setData(new HeatMapData());
            this.heatmap.addData({
                x: 1,
                y: 1,
                radius: 999,
                value: 1
            });
            this.updateHeatmap();
        }
    }

    toggleNegative(): void {
        if (this.imageIndex > 0) {
            if (this.demoImage.negative) {
                this.demoImage.negative = false;
            } else {
                this.demoImage.negative = true;
            }
            this.maskUpdated.emit();
        } else {
            this.confirmationService.confirm({
                message: 'The default image must be a positive example.',
                icon: 'pi pi-info-circle',
                key: 'Info',
                acceptLabel: 'OK',
                rejectVisible: false,
                accept: () => {}
            });
        }
    }

    undo(): void {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack[this.undoStack.length - 1]);
            this.undoStack.pop();
            const heatmapData = this.undoStack[this.undoStack.length - 1];

            this.heatmap.setData(heatmapData);
            this.demoImage.b64_image = this.heatmap.getDataURL();
            this.demoImage.heatmapData = heatmapData;
            this.maskUpdated.emit();
        }
    }

    redo(): void {
        if (this.redoStack.length > 0) {
            const heatmapData = this.redoStack[this.redoStack.length - 1];
            this.undoStack.push(heatmapData);
            this.redoStack.pop();

            this.heatmap.setData(heatmapData);
            this.demoImage.b64_image = this.heatmap.getDataURL();
            this.demoImage.heatmapData = heatmapData;
            this.maskUpdated.emit();
        }
    }

    paintHeatMap(event): void {
        this.heatmap.addData({
            x: event.layerX,
            y: event.layerY,
            radius: this.brushRadius,
            value: 1
        });
        this.isDirty = true;
    }

    removeData(event) {
        var value;
        var radius = 100;
        var x = event.layerX;
        var y = event.layerY;
        var data = this.heatmap._store._data;

        if (data[x] && data[x][y]) {
            this.heatmap._store._radi[x][y] = undefined;
            this.heatmap._store._radi[x] = undefined;
            this.heatmap._store._data[x][y] = undefined;
            this.heatmap._store._data[x] = undefined;
            this.heatmap.repaint();
            // return data[x][y];
        } else {
            var values = [];
            // radial search for datapoints based on default radius
            for (var distance = 1; distance < radius; distance++) {
                var neighbors = distance * 2 + 1;
                var startX = x - distance;
                var startY = y - distance;

                for (var i = 0; i < neighbors; i++) {
                    for (var o = 0; o < neighbors; o++) {
                        if (i == 0 || i == neighbors - 1 || (o == 0 || o == neighbors - 1)) {
                            if (data[startY + i] && data[startY + i][startX + o]) {
                                values.push(data[startY + i][startX + o]);
                            }
                        } else {
                            continue;
                        }
                    }
                }
            }
            if (values.length > 0) {
                return Math.max.apply(Math, values);
            }
        }
        return false;
    }

    paintHeatMapContinuous(event): void {
        if (this.heatmap) {
            // console.log(event.buttons);
            if (event.buttons === 1) {
                this.paintHeatMap(event);
            } else if (event.buttons === 2) {
                // this.paintHeatMap(event, -1);
                // console.log('removeData: ' + this.removeData(event));
            }
        }
    }

    resizeImage(img, width, height) {
        // create an off-screen canvas
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        // set its dimension to target size
        canvas.width = width;
        canvas.height = height;

        // draw source image into the off-screen canvas:
        ctx.drawImage(img, 0, 0, width, height);

        // encode image to data-uri with base64 version of compressed image
        return canvas.toDataURL();
    }

    updateHeatmap(): void {
        const newDataUri = this.heatmap.getDataURL();
        // const newHeatMapData = this.heatmap.getData();
        if (this.isDirty && this.demoImage.b64_image !== newDataUri) {
            this.isDirty = false;
            this.demoImage.heatmapData = this.heatmap.getData();
            this.demoImage.b64_image = newDataUri;
            if (this.undoStack.length > 0) {
                const previousChange = this.undoStack[this.undoStack.length - 1];
                if (previousChange.data.length !== this.demoImage.heatmapData.data.length) {
                    //Assume the data is the same if it has the same number of elements
                    this.undoStack.push(this.demoImage.heatmapData);
                    this.redoStack.length = 0;
                    this.maskUpdated.emit();
                }
            } else {
                this.undoStack.push(this.demoImage.heatmapData);
                this.redoStack.length = 0;
                this.maskUpdated.emit();
            }

            console.log(this.demoImage.id + ' - mask updated');
        }
    }

    removeFromAspect() {
        this.remove.emit();
    }

    // saveHeatmap(): void {
    //     const originalSizeImage = this.heatmap.getDataURL();
    //     var img = new Image;
    //     // img.onload = this.resizeImage;
    //     img.src = originalSizeImage

    //     setTimeout(() => {
    //         var newDataUri = this.resizeImage(img, 256, 256);
    //         saveAs(this.dataURItoBlob(newDataUri), this.exampleImages[this.exampleImageIndex].name + '-heatmap.png');
    //     }, 100);
    // }
}
