import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  AfterContentInit,
  ContentChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
})
export class ButtonComponent implements OnInit, AfterContentInit {
  @Input() label: string | null = null;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() buttonStyle: 'filled' | 'outlined' = 'filled';
  @Input()
  borderRadius: 'br-full' | 'br-light' | 'br-none' | 'br-full-right' | 'br-full-left' =
    'br-full';
  @Input() bgColor = 'var(--color-primary)';
  @Input() textColor?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;

  @Output() click = new EventEmitter<MouseEvent>();
  // Backwards-compatible output name used across the codebase
  @Output() onClick = new EventEmitter<MouseEvent>();

  cssClasses = '';

  // Detect projected content so we can decide whether to show label or ng-content
  @ContentChildren(ElementRef, { descendants: true }) projectedNodes!: QueryList<ElementRef>;
  hasProjectedContent = false;

  ngOnInit(): void {
    this.textColor = this.textColor ?? (this.buttonStyle === 'outlined' ? 'var(--color-primary)' : '#fff');
    this.cssClasses = ['button', this.buttonStyle, this.borderRadius, this.size].join(' ');
  }

  ngAfterContentInit(): void {
    this.hasProjectedContent = !!(this.projectedNodes && this.projectedNodes.length > 0);
  }

  handleClick(e: MouseEvent) {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    this.click.emit(e);
    this.onClick.emit(e);
  }
}
