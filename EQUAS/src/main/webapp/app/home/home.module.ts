import { GlobalExplanationComponent } from './../entities/global-explanation/global-explanation.component';
import { EquasGlobalExplanationModule } from './../entities/global-explanation/global-explanation.module';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { EquasSharedModule } from '../shared';
import { HOME_ROUTE, HomeComponent } from './';

@NgModule({
    imports: [EquasSharedModule, RouterModule.forChild([HOME_ROUTE])],
    declarations: [
        HomeComponent
        // GlobalExplanationComponent
    ],
    entryComponents: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EquasHomeModule {}
