import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';
import { UserRouteAccessService } from 'app/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlobalExplanation } from 'app/shared/model/global-explanation.model';
import { GlobalExplanationService } from './global-explanation.service';
import { GlobalExplanationComponent } from './global-explanation.component';
import { GlobalExplanationDetailComponent } from './global-explanation-detail.component';
import { GlobalExplanationUpdateComponent } from './global-explanation-update.component';
import { GlobalExplanationDeletePopupComponent } from './global-explanation-delete-dialog.component';
import { IGlobalExplanation } from 'app/shared/model/global-explanation.model';

@Injectable({ providedIn: 'root' })
export class GlobalExplanationResolve implements Resolve<IGlobalExplanation> {
    constructor(private service: GlobalExplanationService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const id = route.params['id'] ? route.params['id'] : null;
        if (id) {
            return this.service.find(id).pipe(map((globalExplanation: HttpResponse<GlobalExplanation>) => globalExplanation.body));
        }
        return of(new GlobalExplanation());
    }
}

export const globalExplanationRoute: Routes = [
    {
        path: 'global-explanation',
        component: GlobalExplanationComponent,
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'global-explanation/:filter',
        component: GlobalExplanationComponent,
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'global-explanation/:id/view',
        component: GlobalExplanationDetailComponent,
        // resolve: {
        //     globalExplanation: GlobalExplanationResolve
        // },
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'global-explanation/new',
        component: GlobalExplanationUpdateComponent,
        resolve: {
            globalExplanation: GlobalExplanationResolve
        },
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'global-explanation/:id/edit',
        component: GlobalExplanationUpdateComponent,
        resolve: {
            globalExplanation: GlobalExplanationResolve
        },
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService]
    }
];

export const globalExplanationPopupRoute: Routes = [
    {
        path: 'global-explanation/:id/delete',
        component: GlobalExplanationDeletePopupComponent,
        resolve: {
            globalExplanation: GlobalExplanationResolve
        },
        data: {
            authorities: ['ROLE_USER'],
            pageTitle: 'equasApp.globalExplanation.home.title'
        },
        canActivate: [UserRouteAccessService],
        outlet: 'popup'
    }
];
