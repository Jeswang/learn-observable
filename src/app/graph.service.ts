import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, share, publish, shareReplay, publishBehavior, switchMap, delay, startWith } from 'rxjs/operators';

export class Filter {
  name;
  values;
  selected;
}

@Injectable()
export class GraphService {

  // Cache the end filter results for each tab in a map.
  filters: Map<string, Observable<Array<Filter>>> = new Map();

  // Cache the selected filter values in nested map. this is from user input.
  selectedFilterValues: Map<string, Map<string, string>> = new Map();

  // Emit whenever above selectedFilterValues changes to cause filters and graphs to load.
  observableFilterValues: Map<string, BehaviorSubject<Map<string, string>>> = new Map();

  // Cache the graph so that whenever there are multiple requests to the same graph, we don't
  // trigger multiple requests.
  // This is optional for us as we don't actaully have multiple places asking the same graph.
  observableGraphs: Map<{tab: string, name: string}, Observable<string>> = new Map();

  getFilter(tab, name) {
    if(!this.filters.has(tab)) {
      console.log("creat new filter");
      this.filters.set(tab, this.fetchFilters(tab));
    }
  
    return this.filters.get(tab).pipe(map(filterArray => {
        for (let filter of filterArray) {
          if (filter.name == name) {
            return filter;
          }
        }
      }));
  }

  getGraph(tab, name) {
    const key = {tab: tab, name: name}
    if (!this.observableGraphs.has(key)){
      return this.fetchFilters(tab).pipe(
        // Use distinctUntilChanged to avoid duplicated request
        // https://www.learnrxjs.io/learn-rxjs/operators/filtering/distinctuntilchanged
        startWith(null),
        switchMap(selected => {
          console.log("request new graph with ", selected);
          return this.http.get("/assets/graph.json").pipe(delay(2000)).pipe(
            startWith(null)
          )
        }),
        map(x => x ? x.data: ""),
        shareReplay(1)
     )
    }

    return this.observableGraphs.get(key);
  }

  setSelect(tab : string, name : string, value : string) {
      var values = this.getSelectedFilterValues(tab);
      values.set(name, value);
  
      this.getObservableFilterValues(tab).next(values);
  }

  private getSelectedFilterValues(tab) {
      if (!this.selectedFilterValues.has(tab)) {
        this.selectedFilterValues.set(tab, new Map<string, string>());
      }
      return this.selectedFilterValues.get(tab);
  }

  private getObservableFilterValues(tab) {
    if (!this.observableFilterValues.has(tab)) {
      var values = this.getSelectedFilterValues(tab);
      this.observableFilterValues.set(tab, new BehaviorSubject(values));
    }

    return this.observableFilterValues.get(tab)
  }

  private fetchFilters(tab) {
    const selected = this.getObservableFilterValues(tab)
    return selected.pipe(
      switchMap(selectedValue => {
        const request = this.http.get("/assets/filter.json").pipe(
          shareReplay(1)
        );
        return combineLatest(
          request, 
          selected,
          (response, selected) => {
          for(let filter of response) {
           if (selected.has(filter.name)) {
             filter.selected = selected.get(filter.name)
           } else {
             filter.selected = filter.values[0]
           }
          }
          return response
        })
      }),
    )
  }

  constructor(
    private http: HttpClient
  ) { }

}