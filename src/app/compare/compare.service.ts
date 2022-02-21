import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

import { CompareData } from './compare-data.model';
import { AuthService } from '../user/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false);
  dataIsLoading = new BehaviorSubject<boolean>(false);
  dataLoaded = new Subject<CompareData[]>();
  dataLoadFailed = new Subject<boolean>();
  userData: CompareData;
  constructor(private http: Http,
              private authService: AuthService,
              private router: Router) {
  }

  onStoreData(data: CompareData) {
    this.dataLoadFailed.next(false);
    this.dataIsLoading.next(true);
    this.dataEdited.next(false);
    this.userData = data;
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        return;
      }
      this.http.post('https://e1xij73ua0.execute-api.ap-southeast-2.amazonaws.com/dev/compare-yourself', data, {
        headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
      })
        .subscribe(
          (result) => {
            this.dataLoadFailed.next(false);
            this.dataIsLoading.next(false);
            this.dataEdited.next(true);
          },
          (error) => {
            this.dataIsLoading.next(false);
            this.dataLoadFailed.next(true);
            this.dataEdited.next(false);
          }
        );
    });
      
  }
  onRetrieveData(all = true) {
    this.dataLoaded.next(null);
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.log(err);
        return;
      }
      const queryParam = '?accessToken=' + session.getAccessToken().getJwtToken();
      let urlParam = 'all';
      if (!all) {
        urlParam = 'single';
      }
      this.http.get('https://e1xij73ua0.execute-api.ap-southeast-2.amazonaws.com/dev/compare-yourself/' + urlParam + queryParam, {
        headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
      })
        .map(
          (response: Response) => response.json()
        )
        .subscribe(
          (data) => {
            if (all) {
              this.dataLoaded.next(data);
            } else {
              console.log(data);
              if (!data) {
                this.dataLoadFailed.next(true);
                console.log(data);
                return;
              }
              this.userData = data[0];
              this.dataEdited.next(true);
            }
          },
          (error) => {
            this.dataLoadFailed.next(true);
            this.dataLoaded.next(null);
          }
        );

    });
  }
  onDeleteData() {
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.log(err);
        return;
      }
      this.http.delete('https://e1xij73ua0.execute-api.ap-southeast-2.amazonaws.com/dev/compare-yourself', {
        headers: new Headers({'Authorization': session.getIdToken().getJwtToken()})
      })
        .subscribe(
          (data) => {
            console.log(data);
            this.userData = undefined;
            this.dataEdited.next(false);
          },
          (error) => this.dataLoadFailed.next(true)
        );
    });
  }

  onLogout() {
    this.userData = undefined;
    this.dataEdited.next(false);
  }
}
