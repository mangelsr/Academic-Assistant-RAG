import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramStateService } from '../../services/program-state.service';
import { LucideAngularModule, GraduationCap, ChevronDown, BookOpen, Sparkles, Check, Search } from 'lucide-angular';

@Component({
  selector: 'app-program-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="relative w-full">
      <!-- Selector Card / Trigger -->
      <button 
        (click)="toggleDropdown()" 
        type="button"
        class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl shadow-lg transition-all duration-200 group text-left backdrop-blur-md">
        
        <div class="flex items-center gap-3 min-w-0">
          <div class="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-colors border border-indigo-500/30 shrink-0">
            <lucide-icon [img]="GraduationCapIcon" class="w-5 h-5"></lucide-icon>
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Programa Académico</span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                <lucide-icon [img]="BookOpenIcon" class="w-3 h-3 mr-1"></lucide-icon>
                {{ programState.selectedCareer()?.total_chunks || 0 }} Chunks
              </span>
            </div>
            <div class="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-200 transition-colors">
              {{ programState.selectedCareer()?.name || 'Cargando programa...' }}
            </div>
          </div>
        </div>

        <lucide-icon [img]="ChevronDownIcon" class="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-transform duration-200 shrink-0" [class.rotate-180]="isOpen()"></lucide-icon>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="absolute left-0 right-0 mt-2 z-50 bg-slate-900/95 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          
          <!-- Search input -->
          <div class="p-2.5 border-b border-slate-800 bg-slate-950/50">
            <div class="relative">
              <lucide-icon [img]="SearchIcon" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Buscar carrera o código..." 
                class="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <!-- Options List -->
          <div class="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            @for (career of filteredCareers(); track career.code) {
              <button 
                (click)="selectCareer(career.code)" 
                class="w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors duration-150"
                [class.bg-indigo-600\/20]="career.code === programState.selectedCareerCode()"
                [class.text-indigo-200]="career.code === programState.selectedCareerCode()"
                [class.hover:bg-slate-800\/80]="career.code !== programState.selectedCareerCode()"
                [class.text-slate-300]="career.code !== programState.selectedCareerCode()">
                
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="font-medium truncate">{{ career.name }}</span>
                  <span class="text-[10px] font-mono text-slate-400">{{ career.code }}</span>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {{ career.total_chunks || 0 }} vector chunks
                  </span>
                  @if (career.code === programState.selectedCareerCode()) {
                    <lucide-icon [img]="CheckIcon" class="w-4 h-4 text-indigo-400"></lucide-icon>
                  }
                </div>
              </button>
            } @empty {
              <div class="py-4 text-center text-xs text-slate-400">
                No se encontraron carreras coincidentes.
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ProgramSelectorComponent {
  readonly programState = inject(ProgramStateService);

  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly GraduationCapIcon = GraduationCap;
  readonly ChevronDownIcon = ChevronDown;
  readonly BookOpenIcon = BookOpen;
  readonly SparklesIcon = Sparkles;
  readonly CheckIcon = Check;
  readonly SearchIcon = Search;

  readonly filteredCareers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.programState.careers();
    if (!query) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.code.toLowerCase().includes(query)
    );
  });

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectCareer(code: string): void {
    this.programState.selectCareer(code);
    this.isOpen.set(false);
  }
}
