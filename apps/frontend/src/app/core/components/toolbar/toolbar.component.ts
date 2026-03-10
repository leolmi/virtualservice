import { Component, computed, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUser } from '../../../auth/store/auth.selectors';
import { ToolbarService } from '../../services/toolbar.service';

@Component({
  selector: 'vs-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private breakpoints = inject(BreakpointObserver);
  private store = inject(Store);
  private toolbarService = inject(ToolbarService);

  isNarrow = toSignal(
    this.breakpoints.observe('(max-width: 800px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  user = this.store.selectSignal(selectUser);

  commands = this.toolbarService.commands;

  visibleCommands = computed(() =>
    this.commands().filter((c) => c.visible !== false),
  );

  buttonCommands = computed(() =>
    this.visibleCommands().filter((c) => c.type !== 'separator'),
  );
}
