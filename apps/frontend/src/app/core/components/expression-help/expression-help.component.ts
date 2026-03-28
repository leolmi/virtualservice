import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExpressionHelpContext } from '../../models/expression-help.model';

@Component({
  selector: 'vs-expression-help',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './expression-help.component.html',
  styleUrl: './expression-help.component.scss',
})
export class ExpressionHelpComponent {
  readonly context = input<ExpressionHelpContext | null>(null);
}
