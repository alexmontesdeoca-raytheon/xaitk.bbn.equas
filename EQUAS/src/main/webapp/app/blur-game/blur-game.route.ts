import { Route, Routes } from '@angular/router';

import { BlurGameComponent } from './blur-game.component';
import { BlurGameExploreComponent } from './blur-game-explore.component';
import { BlurExporterComponent } from './blur-exporter.component';
import { OneShotComponent } from './one-shot.component';
import { OneShotCurateComponent } from './one-shot-curate.component';
import { OneShotV2Component } from './one-shot-v2.component';
import { OneShotV3Component } from './one-shot-v3.component';
import { OneShotDemoComponent } from './one-shot-demo.component';

export const BLUR_GAME_ROUTE: Routes = [
    {
        path: 'blur-game',
        component: BlurGameComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'blur-game-curate',
        component: BlurGameExploreComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'blur-exporter',
        component: BlurExporterComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'oneshot',
        component: OneShotComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'oneshotv2',
        component: OneShotV2Component,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'oneshotv3',
        component: OneShotV3Component,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'oneshotdemo',
        component: OneShotDemoComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    },
    {
        path: 'oneshotcurate',
        component: OneShotCurateComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    }
];
