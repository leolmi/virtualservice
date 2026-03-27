import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ToolbarService } from '../core/services/toolbar.service';

@Component({
  selector: 'vs-legal',
  standalone: true,
  imports: [],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.scss',
})
export class LegalComponent implements OnInit, OnDestroy {
  private readonly location = inject(Location);
  private readonly toolbar = inject(ToolbarService);

  ngOnInit(): void {
    this.toolbar.setForceLow(true);
    this.toolbar.set([
      {
        id: 'back',
        icon: 'undo',
        tooltip: 'Back',
        action: () => this.location.back(),
      },
    ]);
  }

  ngOnDestroy(): void {
    this.toolbar.setForceLow(false);
    this.toolbar.clear();
  }
}
