import { NgModule } from '@angular/core';

import { EquasSharedLibsModule, FindLanguageFromKeyPipe, SafePipe, JhiAlertComponent, JhiAlertErrorComponent } from './';

@NgModule({
    imports: [EquasSharedLibsModule],
    declarations: [FindLanguageFromKeyPipe, SafePipe, JhiAlertComponent, JhiAlertErrorComponent],
    exports: [EquasSharedLibsModule, FindLanguageFromKeyPipe, SafePipe, JhiAlertComponent, JhiAlertErrorComponent]
})
export class EquasSharedCommonModule {}
