import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { CareerInfo } from '../models/academic.models';

@Injectable({
  providedIn: 'root'
})
export class ProgramStateService {
  private apiService = inject(ApiService);

  // Angular Signals for reactive state
  readonly careers = signal<CareerInfo[]>([]);
  readonly selectedCareerCode = signal<string>('CI013_CIENCIAS_DE_LA_COMPUTACION');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Computed signals
  readonly selectedCareer = computed(() => {
    const list = this.careers();
    const code = this.selectedCareerCode();
    return list.find(c => c.code === code) || (list.length > 0 ? list[0] : null);
  });

  readonly totalChunksIndexed = computed(() => {
    return this.careers().reduce((acc, curr) => acc + (curr.total_chunks || 0), 0);
  });

  constructor() {
    this.loadCareers();
  }

  loadCareers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getCareers().subscribe({
      next: (res) => {
        this.careers.set(res.careers);
        this.isLoading.set(false);
        // Default selection if current selected code is not in list
        if (res.careers.length > 0 && !res.careers.some(c => c.code === this.selectedCareerCode())) {
          this.selectedCareerCode.set(res.careers[0].code);
        }
      },
      error: (err) => {
        console.error('[ProgramStateService] Failed to load careers:', err);
        this.errorMessage.set('Error al cargar la lista de carreras.');
        this.isLoading.set(false);
      }
    });
  }

  selectCareer(code: string): void {
    this.selectedCareerCode.set(code);
  }
}
