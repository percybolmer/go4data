import { Injectable } from '@angular/core';
import { Application } from '../interfaces/workflow';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ManagementService {

  private applicationURL = 'http://localhost:8080/applications';

  constructor(private http: HttpClient) { }

  loadApplications() {
    return this.http.get(this.applicationURL);
  }

  addApplication(app: Application){
    return this.http.post(this.applicationURL, app).subscribe(
      (err : HttpErrorResponse) => {
        this.handleError(err)
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
