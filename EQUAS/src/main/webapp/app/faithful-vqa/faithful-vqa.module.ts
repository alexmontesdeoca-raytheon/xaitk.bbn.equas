import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { EquasSharedModule } from '../shared';
import { FAITHFUL_VQA_ROUTE, FaithfulVqaComponent } from './';

@NgModule({
    imports: [EquasSharedModule, RouterModule.forChild(FAITHFUL_VQA_ROUTE)],
    declarations: [],
    entryComponents: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FaithfulVqaModule {}
