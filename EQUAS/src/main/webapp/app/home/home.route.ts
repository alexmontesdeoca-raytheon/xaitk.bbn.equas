import { Route } from '@angular/router';

import { HomeComponent } from './';

export const HOME_ROUTE: Route = {
    path: 'hiecoatten-vqa',
    component: HomeComponent,
    data: {
        authorities: [],
        pageTitle: 'home.title'
    }
};
