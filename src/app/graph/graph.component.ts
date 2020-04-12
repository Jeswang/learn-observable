import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core';

import { GraphService } from '../graph.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
  @Input() tab;
  @Input() name;

  graph$;

  constructor(
    private graphService : GraphService
  ) { }

  ngOnInit() {
    this.graph$ = this.graphService.getGraph(this.tab, this.name)
  }

}