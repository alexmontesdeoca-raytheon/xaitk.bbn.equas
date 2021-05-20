import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EquasSharedModule } from 'app/shared';

import {
    // GlobalExplanationComponent,
    // GlobalExplanationDetailComponent,
    GlobalExplanationUpdateComponent,
    GlobalExplanationDeletePopupComponent,
    GlobalExplanationDeleteDialogComponent,
    globalExplanationRoute,
    globalExplanationPopupRoute
} from './';

const ENTITY_STATES = [...globalExplanationRoute, ...globalExplanationPopupRoute];

@NgModule({
    imports: [EquasSharedModule, RouterModule.forChild(ENTITY_STATES)],
    declarations: [
        // GlobalExplanationComponent,
        // GlobalExplanationDetailComponent,
        GlobalExplanationUpdateComponent,
        GlobalExplanationDeleteDialogComponent,
        GlobalExplanationDeletePopupComponent
    ],
    entryComponents: [
        // GlobalExplanationComponent,
        GlobalExplanationUpdateComponent,
        GlobalExplanationDeleteDialogComponent,
        GlobalExplanationDeletePopupComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EquasGlobalExplanationModule {}
