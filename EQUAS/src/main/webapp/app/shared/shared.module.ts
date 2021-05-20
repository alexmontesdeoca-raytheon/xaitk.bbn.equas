import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';

import { NgbDateMomentAdapter } from './util/datepicker-adapter';
import { EquasSharedLibsModule, EquasSharedCommonModule, JhiLoginModalComponent, HasAnyAuthorityDirective } from './';
import { GlobalExplanationDetailComponent, GlobalExplanationComponent } from 'app/entities/global-explanation';
import { FaithfulVqaComponent } from 'app/faithful-vqa';
import { BlurGameComponent, BlurGameExploreComponent, BlurExporterComponent } from 'app/blur-game';
import { OneShotComponent } from 'app/blur-game/one-shot.component';
import { OneShotCurateComponent } from 'app/blur-game/one-shot-curate.component';
import { OneShotV2Component } from 'app/blur-game/one-shot-v2.component';
import { OneShotV3Component } from 'app/blur-game/one-shot-v3.component';
import { OneShotDemoComponent } from 'app/blur-game/one-shot-demo.component';
import { PainterComponent } from 'app/blur-game/painter.component';

@NgModule({
    imports: [EquasSharedLibsModule, EquasSharedCommonModule],
    declarations: [
        JhiLoginModalComponent,
        HasAnyAuthorityDirective,
        FaithfulVqaComponent,
        BlurGameComponent,
        BlurGameExploreComponent,
        OneShotComponent,
        OneShotV2Component,
        OneShotV3Component,
        OneShotDemoComponent,
        PainterComponent,
        OneShotCurateComponent,
        BlurExporterComponent,
        GlobalExplanationComponent,
        GlobalExplanationDetailComponent
    ],
    providers: [{ provide: NgbDateAdapter, useClass: NgbDateMomentAdapter }],
    entryComponents: [
        JhiLoginModalComponent,
        FaithfulVqaComponent,
        BlurGameComponent,
        OneShotComponent,
        OneShotV2Component,
        OneShotV3Component,
        OneShotDemoComponent,
        PainterComponent,
        OneShotCurateComponent,
        BlurGameExploreComponent,
        BlurExporterComponent,
        GlobalExplanationComponent,
        GlobalExplanationDetailComponent
    ],
    exports: [
        EquasSharedCommonModule,
        JhiLoginModalComponent,
        HasAnyAuthorityDirective,
        FaithfulVqaComponent,
        BlurGameComponent,
        OneShotComponent,
        OneShotV2Component,
        OneShotV3Component,
        OneShotDemoComponent,
        PainterComponent,
        OneShotCurateComponent,
        BlurGameExploreComponent,
        BlurExporterComponent,
        GlobalExplanationComponent,
        GlobalExplanationDetailComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EquasSharedModule {}
