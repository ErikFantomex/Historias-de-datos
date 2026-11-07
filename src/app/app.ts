import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RecordRow {
  condition: string;
  year: number;
  state: string;
  age: number;
  men: number;
  women: number;
  unknown: number;
}

interface SummaryRow {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly records = signal<RecordRow[]>([]);
  readonly selectedYear = signal('Todos');
  readonly selectedState = signal('Todos');
  readonly selectedCondition = signal('Todos');
  readonly activeView = signal<'dashboard' | 'analysis'>('dashboard');

  readonly years = computed(() => ['Todos', ...new Set(this.records().map((row) => row.year).sort((a, b) => b - a).map(String))]);
  readonly states = computed(() => ['Todos', ...new Set(this.records().map((row) => row.state).sort())]);
  readonly conditions = computed(() => ['Todos', ...new Set(this.records().map((row) => row.condition))]);
  readonly filtered = computed(() => this.records().filter((row) =>
    (this.selectedYear() === 'Todos' || String(row.year) === this.selectedYear()) &&
    (this.selectedState() === 'Todos' || row.state === this.selectedState()) &&
    (this.selectedCondition() === 'Todos' || row.condition === this.selectedCondition()),
  ));
  readonly total = computed(() => this.filtered().reduce((sum, row) => sum + row.men + row.women + row.unknown, 0));
  readonly women = computed(() => this.filtered().reduce((sum, row) => sum + row.women, 0));
  readonly men = computed(() => this.filtered().reduce((sum, row) => sum + row.men, 0));
  readonly located = computed(() => this.filtered().filter((row) => row.condition !== 'DESAPARECIDAS Y NO LOCALIZADAS')
    .reduce((sum, row) => sum + row.men + row.women + row.unknown, 0));
  readonly locatedRate = computed(() => this.total() ? Math.round((this.located() / this.total()) * 100) : 0);

  readonly yearsChart = computed(() => {
    const values = new Map<number, number>();
    this.filtered().forEach((row) => values.set(row.year, (values.get(row.year) ?? 0) + row.men + row.women + row.unknown));
    const rows = [...values.entries()].sort(([a], [b]) => a - b);
    const max = Math.max(...rows.map(([, value]) => value), 1);
    return rows.map(([year, value]) => ({ year, value, height: Math.max(4, Math.round((value / max) * 100)) }));
  });
  readonly stateChart = computed<SummaryRow[]>(() => {
    const values = new Map<string, number>();
    this.filtered().forEach((row) => values.set(row.state, (values.get(row.state) ?? 0) + row.men + row.women + row.unknown));
    return [...values.entries()].sort(([, a], [, b]) => b - a).slice(0, 8)
      .map(([label, value], index) => ({ label, value, color: ['#ff6b4a', '#f4b942', '#4ab5a5', '#7478f5', '#e27bb7', '#7eb7d8', '#b9c56d', '#a49acb'][index] }));
  });
  readonly ageChart = computed(() => {
    const groups = [{ label: '0–12', min: 0, max: 12 }, { label: '13–17', min: 13, max: 17 }, { label: '18–29', min: 18, max: 29 }, { label: '30–44', min: 30, max: 44 }, { label: '45–59', min: 45, max: 59 }, { label: '60+', min: 60, max: 200 }];
    const values = groups.map((group) => ({ label: group.label, value: this.filtered().filter((row) => row.age >= group.min && row.age <= group.max).reduce((sum, row) => sum + row.men + row.women + row.unknown, 0) }));
    const max = Math.max(...values.map((item) => item.value), 1);
    return values.map((item) => ({ ...item, height: Math.max(4, Math.round((item.value / max) * 100)) }));
  });
  readonly genderSummary = computed(() => [
    { label: 'Mujeres', value: this.women(), color: '#f074a8' },
    { label: 'Hombres', value: this.men(), color: '#5d75ef' },
    { label: 'Indeterminado', value: this.filtered().reduce((sum, row) => sum + row.unknown, 0), color: '#a7afc3' },
  ]);
  readonly topStates = computed(() => this.stateChart().slice(0, 5));

  constructor() {
    fetch('data/dashboard-data.json')
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el archivo de datos.');
        return response.json() as Promise<RecordRow[]>;
      })
      .then((data) => {
        this.records.set(data);
        this.loading.set(false);
      })
      .catch((error: Error) => {
        this.loadError.set(error.message);
        this.loading.set(false);
      });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX').format(value);
  }

  setFilter(filter: 'year' | 'state' | 'condition', value: string): void {
    if (filter === 'year') this.selectedYear.set(value);
    if (filter === 'state') this.selectedState.set(value);
    if (filter === 'condition') this.selectedCondition.set(value);
  }

  clearFilters(): void {
    this.selectedYear.set('Todos');
    this.selectedState.set('Todos');
    this.selectedCondition.set('Todos');
  }

  setView(view: 'dashboard' | 'analysis'): void {
    this.activeView.set(view);
  }
}
