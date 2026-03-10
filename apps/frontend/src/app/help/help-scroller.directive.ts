import { Directive, ElementRef, HostListener, OnInit, inject, input, output } from '@angular/core';

export interface SectionElement {
  id: string;
  y: number;
  image?: string;
}

@Directive({
  selector: '[vsScroller]',
  standalone: true,
})
export class HelpScrollerDirective implements OnInit {
  readonly idMap = input<string[]>([]);
  readonly offset = input<number | string>(0);
  readonly current = output<SectionElement | null>();

  private readonly _ele = inject(ElementRef);
  private _offset = 0;
  private _map: SectionElement[] = [];
  private _last: SectionElement | null = null;

  private _resolveOffset(): void {
    const o = this.offset();
    if (typeof o === 'string') {
      if (/^\d+%$/.test(o)) {
        const perc = parseInt(o, 10);
        this._offset =
          (this._ele.nativeElement as HTMLElement).getBoundingClientRect()
            .height *
          (perc / 100);
      } else {
        this._offset = parseInt(o, 10) || 0;
      }
    } else if (typeof o === 'number') {
      this._offset = Math.abs(o);
    } else {
      this._offset = 0;
    }
  }

  private _buildMap(): void {
    this._map = [];
    for (const id of this.idMap()) {
      if (!id) continue;
      const ele = document.getElementById(id);
      if (!ele) continue;
      const rect = ele.getBoundingClientRect();
      const scrollParent = ele.offsetParent as HTMLElement | null;
      this._map.push({
        id,
        y: rect.y + (scrollParent?.scrollTop ?? 0) - this._offset,
        image: (ele.dataset as Record<string, string>)['image'],
      });
    }
  }

  private _getCurrent(top: number): SectionElement | null {
    let found: SectionElement | null = null;
    for (const se of this._map) {
      const dist = top - se.y;
      if (dist >= 0 && (!found || top - found.y > dist)) {
        found = se;
      }
    }
    return found;
  }

  private _toggleClass(e: SectionElement | null, add = false): void {
    if (!e) return;
    document.getElementById(e.id)?.classList.toggle('current-help-element', add);
  }

  @HostListener('scroll', ['$event'])
  onScroll(e: Event): void {
    const scrollTop = (e.target as HTMLElement).scrollTop;
    this._resolveOffset();
    this._buildMap();
    const section = this._getCurrent(scrollTop);
    if (!section || !this._last || this._last.id !== section.id) {
      this._toggleClass(this._last);
      this._last = section;
      this._toggleClass(this._last, true);
      this.current.emit(this._last);
    }
  }

  ngOnInit(): void {
    this._resolveOffset();
    this._buildMap();
  }
}
