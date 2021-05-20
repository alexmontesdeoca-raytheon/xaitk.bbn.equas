import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IGlobalExplanation } from 'app/shared/model/global-explanation.model';
import { GlobalExplanationService } from './global-explanation.service';

@Component({
    selector: 'jhi-global-explanation-update',
    templateUrl: './global-explanation-update.component.html'
})
export class GlobalExplanationUpdateComponent implements OnInit {
    private _globalExplanation: IGlobalExplanation;
    isSaving: boolean;

    constructor(private globalExplanationService: GlobalExplanationService, private activatedRoute: ActivatedRoute) {}

    ngOnInit() {
        this.isSaving = false;
        this.activatedRoute.data.subscribe(({ globalExplanation }) => {
            this.globalExplanation = globalExplanation;
        });
    }

    previousState() {
        window.history.back();
    }

    save() {
        this.isSaving = true;
        if (this.globalExplanation.id !== undefined) {
            this.subscribeToSaveResponse(this.globalExplanationService.update(this.globalExplanation));
        } else {
            this.subscribeToSaveResponse(this.globalExplanationService.create(this.globalExplanation));
        }
    }

    private subscribeToSaveResponse(result: Observable<HttpResponse<IGlobalExplanation>>) {
        result.subscribe((res: HttpResponse<IGlobalExplanation>) => this.onSaveSuccess(), (res: HttpErrorResponse) => this.onSaveError());
    }

    private onSaveSuccess() {
        this.isSaving = false;
        this.previousState();
    }

    private onSaveError() {
        this.isSaving = false;
    }
    get globalExplanation() {
        return this._globalExplanation;
    }

    set globalExplanation(globalExplanation: IGlobalExplanation) {
        this._globalExplanation = globalExplanation;
    }
}
