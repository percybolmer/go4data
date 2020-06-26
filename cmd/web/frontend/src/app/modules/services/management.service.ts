import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ManagementService {

  private appURL = 'http://localhost:8080/getapplications';

  constructor(private http: HttpClient) { }

  loadApplications() {
    return this.http.get(this.appURL);
  }
}
