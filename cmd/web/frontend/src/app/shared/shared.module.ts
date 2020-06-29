import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DrawerRailModule } from 'angular-material-rail-drawer';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule }  from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule} from '@angular/material/table';
import { MatPaginatorModule} from '@angular/material/paginator';
import { MatSidenavModule} from "@angular/material/sidenav";
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { MatTreeModule} from '@angular/material/tree';
import { MatDialogModule} from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout'
import { RouterModule } from '@angular/router';
import { AreaComponent } from './widgets/area/area.component';
import { MatCheckboxModule} from "@angular/material/checkbox";
import { HighchartsChartModule } from 'highcharts-angular';
import { CardComponent } from './widgets/card/card.component';
import { PieComponent } from './widgets/pie/pie.component';
import { TableComponent } from './widgets/table/table.component';
import { WorkflowtreeComponent } from './widgets/workflowtree/workflowtree.component';
import { ManagementtreeComponent } from './widgets/managementtree/managementtree.component';
import { AddapplicationdialogComponent } from './widgets/addapplicationdialog/addapplicationdialog.component';

import {FormsModule} from '@angular/forms';
import {ReactiveFormsModule} from '@angular/forms';
@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AreaComponent,
    CardComponent,
    PieComponent,
    TableComponent,
    WorkflowtreeComponent,
    ManagementtreeComponent,
    AddapplicationdialogComponent,
  ],
  imports: [
    CommonModule,
    MatDividerModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    MatTableModule,
    MatTreeModule,
    MatInputModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatPaginatorModule,
    RouterModule,
    FormsModule,
    FlexLayoutModule,
    HighchartsChartModule,
    DrawerRailModule,
  ],

  exports: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AreaComponent,
    CardComponent,
    PieComponent,
    TableComponent,
    WorkflowtreeComponent,
    ManagementtreeComponent,
    AddapplicationdialogComponent,
    MatFormFieldModule, MatInputModule,
  ]
})
export class SharedModule { }
