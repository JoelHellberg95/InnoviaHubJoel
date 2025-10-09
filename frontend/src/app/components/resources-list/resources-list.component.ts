// resources-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourceItem } from '../ResourceMenu/models/Resource';
import { ButtonComponent } from '../button/button.component';
import { ResourceType } from '../ResourceMenu/Services/ResourceTypeService.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-resources-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resources-list.component.html',
})
export class ResourcesListComponent {
  @Input() resources: ResourceItem[] = [];
  @Input() loading: boolean = false;
  @Input() error: string = '';

  @Input() types: ResourceType[] = [];
  @Input() selectedTypeId: number | null = null;
  @Output() typeChange = new EventEmitter<number>();
  @Output() edit = new EventEmitter<ResourceItem>();
  @Output() remove = new EventEmitter<ResourceItem>();
}
