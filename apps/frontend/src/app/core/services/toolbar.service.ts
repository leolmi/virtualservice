import { Injectable, signal } from '@angular/core';
import { ToolbarCommand } from '../models/toolbar-command.model';

@Injectable({ providedIn: 'root' })
export class ToolbarService {
  private _commands = signal<ToolbarCommand[]>([]);
  readonly commands = this._commands.asReadonly();

  set(cmds: ToolbarCommand[]): void {
    this._commands.set(cmds);
  }

  clear(): void {
    this._commands.set([]);
  }
}
