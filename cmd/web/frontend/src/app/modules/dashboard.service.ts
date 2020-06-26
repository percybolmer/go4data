import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Workflow } from 'src/app/shared/interfaces/workflow';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private workflowURL = 'http://localhost:8080/getworkflows';

  constructor(private http: HttpClient) { }

  loadWorkFlowData() {
    return this.http.get(this.workflowURL);
  }
  
}
