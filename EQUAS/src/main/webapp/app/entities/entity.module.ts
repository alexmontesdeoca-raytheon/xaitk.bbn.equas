import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { EquasGlobalExplanationModule } from './global-explanation/global-explanation.module';
/* jhipster-needle-add-entity-module-import - JHipster will add entity modules imports here */

@NgModule({
    // prettier-ignore
    imports: [
        EquasGlobalExplanationModule,
        /* jhipster-needle-add-entity-module - JHipster will add entity modules here */
    ],
    declarations: [],
    entryComponents: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EquasEntityModule {}
