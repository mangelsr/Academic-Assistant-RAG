import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Citation } from '../../models/academic.models';
import { LucideAngularModule, FileText, ExternalLink, Copy, Check, ChevronDown, Award } from 'lucide-angular';

@Component({
  selector: 'app-citation-cards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-3 mt-4">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <lucide-icon [img]="FileTextIcon" class="w-3.5 h-3.5 text-indigo-400"></lucide-icon>
          Fuentes de Sílabos Citadas ({{ citations().length }})
        </h4>
        <span class="text-[10px] text-slate-400">Verificado con Amazon OpenSearch Serverless</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @for (cit of citations(); track $index) {
          <div class="bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 shadow-md transition-all duration-200 flex flex-col justify-between backdrop-blur-sm group">
            <div>
              <!-- Badge Row -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                  {{ cit.course_code || 'SÍLABO' }}
                </span>

                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  [ngClass]="{
                    'bg-emerald-950/80 text-emerald-300 border-emerald-700/60': cit.score >= 0.85,
                    'bg-cyan-950/80 text-cyan-300 border-cyan-700/60': cit.score >= 0.70 && cit.score < 0.85,
                    'bg-amber-950/80 text-amber-300 border-amber-700/60': cit.score < 0.70
                  }">
                  <lucide-icon [img]="AwardIcon" class="w-3 h-3 mr-1"></lucide-icon>
                  {{ (cit.score * 100) | number:'1.1-1' }}% Relevancia
                </span>
              </div>

              <!-- Course Name -->
              <h5 class="text-xs font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors">
                {{ cit.course_name }}
              </h5>

              <!-- Career / Document type -->
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                {{ cit.career.replace('_', ' ') }} &bull; {{ cit.document_type }}
              </p>

              <!-- Snippet Excerpt -->
              <div class="mt-2.5 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed relative">
                <p [class.line-clamp-3]="!isExpanded($index)" class="transition-all">
                  "{{ cit.snippet }}"
                </p>
                
                @if (cit.snippet.length > 120) {
                  <button 
                    (click)="toggleExpand($index)" 
                    type="button"
                    class="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-0.5">
                    <span>{{ isExpanded($index) ? 'Mostrar menos' : 'Leer extracto completo' }}</span>
                    <lucide-icon [img]="ChevronDownIcon" class="w-3 h-3 transition-transform" [class.rotate-180]="isExpanded($index)"></lucide-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Footer / S3 URI & Actions -->
            <div class="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span class="font-mono truncate max-w-[180px] text-slate-500" title="{{ cit.s3_uri }}">
                {{ cit.s3_uri || 's3://espol-academic-syllabi' }}
              </span>

              <button 
                (click)="copySnippet(cit.snippet, $index)" 
                type="button" 
                class="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50">
                <lucide-icon [img]="copiedIndex() === $index ? CheckIcon : CopyIcon" class="w-3 h-3 text-indigo-400"></lucide-icon>
                <span>{{ copiedIndex() === $index ? 'Copiado' : 'Copiar' }}</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CitationCardsComponent {
  // Angular Signal input
  readonly citations = input<Citation[]>([]);

  readonly expandedIndices = signal<Set<number>>(new Set());
  readonly copiedIndex = signal<number | null>(null);

  readonly FileTextIcon = FileText;
  readonly ExternalLinkIcon = ExternalLink;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;
  readonly ChevronDownIcon = ChevronDown;
  readonly AwardIcon = Award;

  isExpanded(index: number): boolean {
    return this.expandedIndices().has(index);
  }

  toggleExpand(index: number): void {
    this.expandedIndices.update(set => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  copySnippet(snippet: string, index: number): void {
    navigator.clipboard.writeText(snippet);
    this.copiedIndex.set(index);
    setTimeout(() => {
      if (this.copiedIndex() === index) {
        this.copiedIndex.set(null);
      }
    }, 2000);
  }
}
