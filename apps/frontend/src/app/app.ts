import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from './core/components/toolbar/toolbar.component';

@Component({
  imports: [RouterModule, ToolbarComponent],
  selector: 'vs-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
