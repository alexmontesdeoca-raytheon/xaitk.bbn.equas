import { Route, Routes } from '@angular/router';

import { FaithfulVqaComponent } from './';

export const FAITHFUL_VQA_ROUTE: Routes = [
    {
        path: '',
        component: FaithfulVqaComponent,
        data: {
            authorities: [],
            pageTitle: 'home.title'
        }
    }
];
