import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd } from '@angular/router';
import { JhiLanguageHelper, Principal } from 'app/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'jhi-main',
    templateUrl: './main.component.html'
})
export class JhiMainComponent implements OnInit, OnDestroy {
    hideNavBar = false;
    subscription: Subscription;

    constructor(private jhiLanguageHelper: JhiLanguageHelper, public route: ActivatedRoute, private principal: Principal) {}

    private getPageTitle(routeSnapshot: ActivatedRouteSnapshot) {
        let title: string = routeSnapshot.data && routeSnapshot.data['pageTitle'] ? routeSnapshot.data['pageTitle'] : 'equasApp';
        if (routeSnapshot.firstChild) {
            title = this.getPageTitle(routeSnapshot.firstChild) || title;
        }
        return title;
    }

    ngOnInit() {}

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    isMTurk() {
        const assignmentId = this.route.snapshot.queryParams['assignmentId'];
        if (assignmentId === undefined) {
            return false;
        }
        return true;
    }
    isAuthenticated() {
        return this.principal.isAuthenticated();
    }
}
