import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component'
import { DashboardComponent } from '../../modules/dashboard/dashboard.component';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { MatSidenavModule} from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { DrawerRailModule } from 'angular-material-rail-drawer';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule }  from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { FlexLayoutModule } from '@angular/flex-layout';
import {ManagementComponent} from "../../modules/management/management.component";
@NgModule({
  declarations: [
    DefaultComponent,
    DashboardComponent,
    ManagementComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatIconModule,
    DrawerRailModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    FlexLayoutModule,
    MatTableModule,
    MatCardModule
  ],
  providers: [
  ]
})
export class DefaultModule { }
