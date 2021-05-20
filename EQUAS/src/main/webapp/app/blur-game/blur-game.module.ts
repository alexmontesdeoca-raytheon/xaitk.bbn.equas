import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { EquasSharedModule } from '../shared';
import { BLUR_GAME_ROUTE } from './blur-game.route';

const ENTITY_STATES = [...BLUR_GAME_ROUTE];

@NgModule({
    imports: [RouterModule.forChild(ENTITY_STATES)],
    declarations: [],
    entryComponents: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BlurGameModule {}
