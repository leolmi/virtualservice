import { inject, Injectable, signal } from '@angular/core';
import { ToolbarCommand } from '../models/toolbar-command.model';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private _commands = signal<ToolbarCommand[]>([]);
  private _forceLow = signal(false);

  readonly commands = this._commands.asReadonly();
  readonly forceLow = this._forceLow.asReadonly();
  readonly helpContext = signal<string>('');

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.route.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route.snapshot.data;
        }),
      )
      .subscribe((data) =>
        this.helpContext.set(data['helpContext'] || ''),
      );
  }

  set(cmds: ToolbarCommand[]): void {
    this._commands.set(cmds);
  }

  clear(): void {
    this._commands.set([]);
  }

  setForceLow(value: boolean): void {
    this._forceLow.set(value);
  }
}
