import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpScrollerDirective, SectionElement } from './help-scroller.directive';
import { ToolbarService } from '../core/services/toolbar.service';

const DEFAULT_IMAGE = 'assets/help/cloud.png';

const SECTION_IDS = [
  'services',
  'editor',
  'editor-call',
  'editor-test',
  'editor-database',
  'timed-function',
  'expression-editor',
  'monitor',
];

@Component({
  selector: 'vs-help',
  standalone: true,
  imports: [HelpScrollerDirective, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
})
export class HelpComponent implements OnInit, OnDestroy {
  private readonly location = inject(Location);
  private readonly toolbar = inject(ToolbarService);
  private readonly bp = inject(BreakpointObserver);

  readonly isWide = toSignal(
    this.bp.observe('(min-width: 800px)').pipe(map((r) => r.matches)),
    { initialValue: true }
  );

  readonly sectionIds = SECTION_IDS;
  readonly imageUrl = signal(DEFAULT_IMAGE);

  readonly code = {
    db_samples: `const db = {};\ndb.categories = samples.northwind.categories;\nreturn db;`,
    db_generating: `const db = { records: [] };\n// generate 10000 records\nfor (let i = 0; i < 10000; i++) {\n  db.records.push({\n    name: \`record-\${i}\`,\n    value: (100 + i) / 0.15\n  });\n}\nreturn db;`,
    deferred: `return new Promise(res =>\n  setTimeout(() =>\n    res({ waiting: '2000 milliseconds' }), 2000));`,
  };

  ngOnInit(): void {
    this.toolbar.setForceLow(true);
    this.toolbar.set([
      {
        id: 'back',
        icon: 'arrow_back',
        tooltip: 'Back',
        action: () => this.location.back(),
      },
    ]);
  }

  ngOnDestroy(): void {
    this.toolbar.setForceLow(false);
    this.toolbar.clear();
  }

  handleCurrent(section: SectionElement | null): void {
    this.imageUrl.set(section?.image ?? DEFAULT_IMAGE);
  }

  goTo(target: string): void {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }
}
