import { Injectable } from '@angular/core';
import { Workflow, Processor } from '../interfaces/workflow';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ManagementService {

  private workflowURL = "https://localhost:8080/workflows";
  private processorURL = "https://localhost:8080/processors";
  private toggleProcessorRunURL = "https://localhost:8080/processors/run";
  private deleteProcessorURL = "https://localhost:8080/processors/delete";
  constructor(private http: HttpClient) { }

  loadWorkflow() {
    return this.http.get(this.workflowURL);
  }

  loadProcessors() {
    return this.http.get(this.processorURL);
  }

  addProcessor(workflow: string, p: Processor) {
    return this.http.post(this.processorURL, {workflow: workflow, processor: p}).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null){
          this.handleError(err)
        }
      }
    )
  }

  configureProcessor(workflow: string, p: Processor) {
    return this.http.patch(this.processorURL, {workflow: workflow, processor: p}).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null){
          this.handleError(err);
        }
      }
    )
  }

  startWorkflow(work: Workflow) {
    return this.http.patch(this.workflowURL, work).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null){
          this.handleError(err)
        }
      }
    )
  }
  // Startprocessor will send the workflow name and a processor to start 
  startProcessor(workflow: Workflow, proc: Processor) {
    return this.http.post(this.toggleProcessorRunURL, { workflow: workflow.name, processor: proc } ).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null) {
          this.handleError(err)
        }
      }
    )
  }

  deleteProcessor(workflow: Workflow, proc: Processor) {
    return this.http.post(this.deleteProcessorURL, {workflow: workflow, processor: proc }).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null) {
          this.handleError(err)
        }
      }
    )
  }

  addWorkflow(work: Workflow){
    return this.http.post(this.workflowURL, work).subscribe(
      (err : HttpErrorResponse) => {
        if (err !== null){
          this.handleError(err)
        }
      }
    )
  }


  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };
}
