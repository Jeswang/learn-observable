import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core';

import { GraphService } from '../graph.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit {
  @Input() tab;
  @Input() name;

  filter$;

  constructor(
    private graphService : GraphService
  ) { }

  ngOnInit() {
    this.filter$ = this.graphService.getFilter(this.tab, this.name);
  }

  select(value) {
    this.graphService.setSelect(this.tab, this.name, value)
  }
}