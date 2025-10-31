import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/app-config.service';

export interface ResourceType {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ResourceTypeService {

  constructor(private http: HttpClient, private cfg: AppConfigService) {
    console.log('ResourceTypeService cfg.apiUrl:', this.cfg.apiUrl);
  }

  getAll(): Observable<ResourceType[]> {
    const url = `${this.cfg.apiUrl}/api/resourcetype`;
    console.log('ResourceTypeService making request to:', url);
    return this.http.get<ResourceType[]>(url);
  }
}
