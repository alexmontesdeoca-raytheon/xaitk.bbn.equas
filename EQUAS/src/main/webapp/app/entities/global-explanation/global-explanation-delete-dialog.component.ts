import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { JhiEventManager } from 'ng-jhipster';

import { IGlobalExplanation } from 'app/shared/model/global-explanation.model';
import { GlobalExplanationService } from './global-explanation.service';

@Component({
    selector: 'jhi-global-explanation-delete-dialog',
    templateUrl: './global-explanation-delete-dialog.component.html'
})
export class GlobalExplanationDeleteDialogComponent {
    globalExplanation: IGlobalExplanation;

    constructor(
        private globalExplanationService: GlobalExplanationService,
        public activeModal: NgbActiveModal,
        private eventManager: JhiEventManager
    ) {}

    clear() {
        this.activeModal.dismiss('cancel');
    }

    confirmDelete(id: string) {
        this.globalExplanationService.delete(id).subscribe(response => {
            this.eventManager.broadcast({
                name: 'globalExplanationListModification',
                content: 'Deleted an globalExplanation'
            });
            this.activeModal.dismiss(true);
        });
    }
}

@Component({
    selector: 'jhi-global-explanation-delete-popup',
    template: ''
})
export class GlobalExplanationDeletePopupComponent implements OnInit, OnDestroy {
    private ngbModalRef: NgbModalRef;

    constructor(private activatedRoute: ActivatedRoute, private router: Router, private modalService: NgbModal) {}

    ngOnInit() {
        this.activatedRoute.data.subscribe(({ globalExplanation }) => {
            setTimeout(() => {
                this.ngbModalRef = this.modalService.open(GlobalExplanationDeleteDialogComponent as Component, {
                    size: 'lg',
                    backdrop: 'static'
                });
                this.ngbModalRef.componentInstance.globalExplanation = globalExplanation;
                this.ngbModalRef.result.then(
                    result => {
                        this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true, queryParamsHandling: 'merge' });
                        this.ngbModalRef = null;
                    },
                    reason => {
                        this.router.navigate([{ outlets: { popup: null } }], { replaceUrl: true, queryParamsHandling: 'merge' });
                        this.ngbModalRef = null;
                    }
                );
            }, 0);
        });
    }

    ngOnDestroy() {
        this.ngbModalRef = null;
    }
}
