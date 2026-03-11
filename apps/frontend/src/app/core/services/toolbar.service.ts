import { Injectable, signal } from '@angular/core';
import { ToolbarCommand } from '../models/toolbar-command.model';

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  private _commands = signal<ToolbarCommand[]>([]);
  private _forceLow = signal(false);

  readonly commands = this._commands.asReadonly();
  readonly forceLow = this._forceLow.asReadonly();

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
