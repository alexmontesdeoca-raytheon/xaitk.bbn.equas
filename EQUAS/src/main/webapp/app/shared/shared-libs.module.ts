import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgJhipsterModule } from 'ng-jhipster';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CookieModule } from 'ngx-cookie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { FieldsetModule } from 'primeng/fieldset';
import { CardModule } from 'primeng/card';
// import { TreeTableModule } from 'primeng/treetable';
import { TreeModule } from 'primeng/tree';
// import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuModule } from 'primeng/menu';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { GrowlModule } from 'primeng/growl';
import { TabViewModule } from 'primeng/tabview';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SidebarModule } from 'primeng/sidebar';
import { SliderModule } from 'primeng/slider';
import { SpinnerModule } from 'primeng/spinner';
import { DropdownModule } from 'primeng/dropdown';
import { VirtualScrollerModule } from 'primeng/virtualscroller';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TreeTableModule } from 'primeng/treetable';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
// import { PickListModule } from 'primeng/picklist';
import { ListboxModule } from 'primeng/listbox';
import { CalendarModule } from 'primeng/calendar';
import { OrderListModule } from 'primeng/orderlist';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FileUploadModule } from 'primeng/fileupload';
import { TabMenuModule } from 'primeng/tabmenu';
@NgModule({
    imports: [
        NgbModule.forRoot(),
        NgJhipsterModule.forRoot({
            // set below to true to make alerts look like toast
            alertAsToast: false,
            i18nEnabled: true,
            defaultI18nLang: 'en'
        }),
        InfiniteScrollModule,
        CookieModule.forRoot(),
        FontAwesomeModule,
        // BrowserAnimationsModule,
        PanelModule,
        InputTextModule,
        FieldsetModule,
        CardModule,
        // TreeTableModule,
        TreeModule,
        ButtonModule,
        SplitButtonModule,
        MenuModule,
        AccordionModule,
        TooltipModule,
        GrowlModule,
        TabViewModule,
        CheckboxModule,
        RadioButtonModule,
        SelectButtonModule,
        OverlayPanelModule,
        DataViewModule,
        DialogModule,
        TableModule,
        SidebarModule,
        SliderModule,
        ChartModule,
        ProgressSpinnerModule,
        SpinnerModule,
        DropdownModule,
        VirtualScrollerModule,
        ProgressBarModule,
        AutoCompleteModule,
        TreeTableModule,
        ToastModule,
        InputSwitchModule,
        MessagesModule,
        MessageModule,
        // PickListModule,
        ListboxModule,
        CalendarModule,
        OrderListModule,
        ConfirmDialogModule,
        DragDropModule,
        FileUploadModule,
        TabMenuModule
    ],
    exports: [
        FormsModule,
        CommonModule,
        NgbModule,
        NgJhipsterModule,
        InfiniteScrollModule,
        FontAwesomeModule,
        // BrowserAnimationsModule,
        PanelModule,
        InputTextModule,
        FieldsetModule,
        CardModule,
        // TreeTableModule,
        TreeModule,
        ButtonModule,
        SplitButtonModule,
        MenuModule,
        AccordionModule,
        TooltipModule,
        GrowlModule,
        TabViewModule,
        CheckboxModule,
        RadioButtonModule,
        SelectButtonModule,
        OverlayPanelModule,
        DataViewModule,
        DialogModule,
        TableModule,
        SidebarModule,
        SliderModule,
        ChartModule,
        ProgressSpinnerModule,
        SpinnerModule,
        DropdownModule,
        VirtualScrollerModule,
        ProgressBarModule,
        AutoCompleteModule,
        TreeTableModule,
        ToastModule,
        InputSwitchModule,
        MessagesModule,
        MessageModule,
        // PickListModule,
        ListboxModule,
        CalendarModule,
        OrderListModule,
        ConfirmDialogModule,
        DragDropModule,
        FileUploadModule,
        TabMenuModule
    ]
})
export class EquasSharedLibsModule {}
