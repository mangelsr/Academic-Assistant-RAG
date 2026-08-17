import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ProgramStateService } from '../../services/program-state.service';
import { ChatMessage, Citation } from '../../models/academic.models';
import { MarkdownSanitizePipe } from '../../pipes/markdown.pipe';
import { CitationCardsComponent } from '../citation-cards/citation-cards.component';
import { ProgramSelectorComponent } from '../program-selector/program-selector.component';
import { 
  LucideAngularModule, 
  Send, 
  Sparkles, 
  Trash2, 
  Cpu, 
  Sliders, 
  Bot, 
  User, 
  Zap, 
  RefreshCw, 
  HelpCircle, 
  BookOpen,
  Info,
  ShieldCheck
} from 'lucide-angular';

@Component({
  selector: 'app-rag-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MarkdownSanitizePipe, 
    CitationCardsComponent, 
    ProgramSelectorComponent,
    LucideAngularModule
  ],
  template: `
    <div class="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      <!-- Top Navigation Header -->
      <header class="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl shrink-0 flex items-center justify-between gap-4 z-40">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <lucide-icon [img]="SparklesIcon" class="w-5 h-5 animate-pulse"></lucide-icon>
          </div>
          <div>
            <h1 class="text-base font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Asistente Académico Universitario
            </h1>
            <p class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>RAG Serverless en AWS Bedrock & OpenSearch</span>
            </p>
          </div>
        </div>

        <!-- Right Header Actions & Stats -->
        <div class="flex items-center gap-2">
          <button 
            (click)="toggleSettings()" 
            type="button"
            class="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
            <lucide-icon [img]="SlidersIcon" class="w-3.5 h-3.5 text-indigo-400"></lucide-icon>
            <span>Configuración LLM</span>
          </button>

          <button 
            (click)="clearHistory()" 
            [disabled]="messages().length === 0"
            type="button"
            class="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/70 hover:border-rose-800/50 text-slate-400 hover:text-rose-300 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Limpiar historial de conversación">
            <lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </header>

      <!-- Main Layout Content -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        <!-- Sidebar Controls / Parameters Panel -->
        <aside 
          class="w-full md:w-80 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 shrink-0 overflow-y-auto space-y-5 custom-scrollbar"
          [class.hidden]="!showSettings() && isMobile()">
          
          <!-- Program Selector Section -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Selección de Carrera
            </label>
            <app-program-selector></app-program-selector>
          </div>

          <!-- Model Parameter Controls -->
          <div class="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <lucide-icon [img]="CpuIcon" class="w-4 h-4 text-violet-400"></lucide-icon>
                Modelo de Lenguaje (Bedrock)
              </span>
            </div>

            <!-- Complex Model Toggle -->
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-xs font-medium text-slate-200">Razonamiento Complejo</div>
                <div class="text-[10px] text-slate-400">
                  {{ useComplexModel() ? 'Claude 3.5 Sonnet (Alta precisión)' : 'Claude 3 Haiku (Respuestas rápidas)' }}
                </div>
              </div>
              <button 
                (click)="useComplexModel.set(!useComplexModel())" 
                type="button"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                [class.bg-indigo-600]="useComplexModel()"
                [class.bg-slate-700]="!useComplexModel()">
                <span 
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  [class.translate-x-5]="useComplexModel()"
                  [class.translate-x-0]="!useComplexModel()"></span>
              </button>
            </div>

            <!-- Top-K Retrieval Slider -->
            <div class="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Extractos a Recuperar (Top-K)</span>
                <span class="font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-800/50">
                  {{ topK() }}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                [ngModel]="topK()" 
                (ngModelChange)="topK.set($event)"
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              <div class="flex justify-between text-[9px] font-mono text-slate-400">
                <span>1 (Rápido)</span>
                <span>15 (Profundo)</span>
              </div>
            </div>
          </div>

          <!-- Architecture & Security Badge Card -->
          <div class="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-900/30 rounded-xl p-3.5 space-y-2 text-xs">
            <div class="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <lucide-icon [img]="ShieldCheckIcon" class="w-4 h-4 text-emerald-400"></lucide-icon>
              Garantía de Fundamentación
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              Las respuestas están estrictamente limitadas al contenido oficial de los sílabos mediante filtrado por metadatos (<code class="text-indigo-300">career={{ programState.selectedCareerCode() }}</code>).
            </p>
          </div>
        </aside>

        <!-- Chat Conversation Container -->
        <main class="flex-1 flex flex-col min-w-0 bg-slate-950/50 overflow-hidden">
          
          <!-- Message Stream Area -->
          <div 
            #chatContainer 
            class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            
            @if (messages().length === 0) {
              <!-- Welcome & Quick Prompts Panel -->
              <div class="max-w-2xl mx-auto py-8 px-4 text-center space-y-6">
                <div class="inline-flex p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-xl">
                  <lucide-icon [img]="BookOpenIcon" class="w-10 h-10"></lucide-icon>
                </div>
                
                <div>
                  <h2 class="text-xl font-bold text-slate-100">
                    ¿En qué puedo ayudarte hoy sobre tus asignaturas?
                  </h2>
                  <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Selecciona una pregunta rápida o escribe tu consulta sobre fechas, temas de parciales, políticas de asistencia o porcentajes de calificación.
                  </p>
                </div>

                <!-- Quick Prompt Suggestion Chips -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                  @for (prompt of quickPrompts; track prompt) {
                    <button 
                      (click)="sendQuickPrompt(prompt)"
                      type="button"
                      class="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-300 hover:text-white transition-all duration-200 group flex items-start gap-2 shadow-sm">
                      <lucide-icon [img]="SparklesIcon" class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"></lucide-icon>
                      <span>{{ prompt }}</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Active Messages List -->
            @for (msg of messages(); track msg.id) {
              <div 
                class="flex gap-3 md:gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
                [class.flex-row-reverse]="msg.role === 'user'">
                
                <!-- Avatar Icon -->
                <div 
                  class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-md"
                  [class.bg-indigo-600]="msg.role === 'user'"
                  [class.text-white]="msg.role === 'user'"
                  [class.bg-slate-800]="msg.role === 'assistant'"
                  [class.text-indigo-400]="msg.role === 'assistant'"
                  [class.border]="msg.role === 'assistant'"
                  [class.border-slate-700]="msg.role === 'assistant'">
                  @if (msg.role === 'user') {
                    <lucide-icon [img]="UserIcon" class="w-4 h-4"></lucide-icon>
                  } @else {
                    <lucide-icon [img]="BotIcon" class="w-4 h-4"></lucide-icon>
                  }
                </div>

                <!-- Message Bubble -->
                <div 
                  class="flex-1 max-w-3xl rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-lg overflow-hidden"
                  [class.bg-indigo-600]="msg.role === 'user'"
                  [class.text-white]="msg.role === 'user'"
                  [class.rounded-tr-none]="msg.role === 'user'"
                  [class.bg-slate-900\/90]="msg.role === 'assistant'"
                  [class.text-slate-200]="msg.role === 'assistant'"
                  [class.border]="msg.role === 'assistant'"
                  [class.border-slate-800]="msg.role === 'assistant'"
                  [class.rounded-tl-none]="msg.role === 'assistant'">
                  
                  @if (msg.role === 'user') {
                    <p class="whitespace-pre-wrap">{{ msg.text }}</p>
                  } @else {
                    <!-- Assistant Rendered Markdown -->
                    <div [innerHTML]="msg.text | markdownSanitize"></div>

                    <!-- Latency Badge -->
                    @if (msg.execution_time_ms) {
                      <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <lucide-icon [img]="ZapIcon" class="w-3 h-3 text-amber-400"></lucide-icon>
                        <span>Latencia Bedrock: {{ msg.execution_time_ms }} ms</span>
                      </div>
                    }

                    <!-- Citation Cards Sub-component -->
                    @if (msg.citations && msg.citations.length > 0) {
                      <app-citation-cards [citations]="msg.citations"></app-citation-cards>
                    }
                  }
                </div>
              </div>
            }

            <!-- Loading Typing Indicator -->
            @if (isQuerying()) {
              <div class="flex gap-3 max-w-4xl mx-auto animate-pulse">
                <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                  <lucide-icon [img]="BotIcon" class="w-4 h-4"></lucide-icon>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-3 shadow-md">
                  <lucide-icon [img]="RefreshCwIcon" class="w-4 h-4 animate-spin text-indigo-400"></lucide-icon>
                  <span>Vectorizando consulta y consultando Amazon Bedrock...</span>
                </div>
              </div>
            }
          </div>

          <!-- Bottom Prompt Input Bar -->
          <div class="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md shrink-0">
            <div class="max-w-4xl mx-auto relative">
              <form (ngSubmit)="sendQuery()" class="relative flex items-center">
                <textarea 
                  [(ngModel)]="queryInput"
                  name="queryInput"
                  (keydown.enter)="onKeyDown($event)"
                  rows="2"
                  placeholder="Haz una pregunta sobre el sílabo de tu carrera (ej. ¿Qué temas se evalúan en el primer parcial?)..."
                  class="w-full pr-12 pl-4 py-3 bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none custom-scrollbar transition-all"></textarea>
                
                <button 
                  type="submit" 
                  [disabled]="!queryInput().trim() || isQuerying()"
                  class="absolute right-2 bottom-2.5 p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white shadow-md shadow-indigo-600/30 transition-all">
                  <lucide-icon [img]="SendIcon" class="w-4 h-4"></lucide-icon>
                </button>
              </form>
              <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1 font-mono">
                <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
                <span>Carrera activa: {{ programState.selectedCareerCode() }}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class RagChatComponent implements AfterViewChecked {
  private apiService = inject(ApiService);
  readonly programState = inject(ProgramStateService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  // Angular Signals
  readonly messages = signal<ChatMessage[]>([]);
  readonly queryInput = signal<string>('');
  readonly isQuerying = signal<boolean>(false);
  readonly useComplexModel = signal<boolean>(false);
  readonly topK = signal<number>(5);
  readonly showSettings = signal<boolean>(false);

  readonly quickPrompts: string[] = [
    '¿Cuáles son los temas evaluados en el primer parcial?',
    '¿Qué porcentaje de calificación corresponde al proyecto final?',
    '¿Cuál es la política de asistencia requerida para aprobar?',
    '¿Cuáles son los requisitos previos del sílabo?'
  ];

  readonly SparklesIcon = Sparkles;
  readonly SlidersIcon = Sliders;
  readonly Trash2Icon = Trash2;
  readonly CpuIcon = Cpu;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly BookOpenIcon = BookOpen;
  readonly UserIcon = User;
  readonly BotIcon = Bot;
  readonly ZapIcon = Zap;
  readonly RefreshCwIcon = RefreshCw;
  readonly SendIcon = Send;

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleSettings(): void {
    this.showSettings.update(v => !v);
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  onKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendQuery();
    }
  }

  sendQuickPrompt(promptText: string): void {
    this.queryInput.set(promptText);
    this.sendQuery();
  }

  sendQuery(): void {
    const prompt = this.queryInput().trim();
    if (!prompt || this.isQuerying()) return;

    const currentCareerCode = this.programState.selectedCareerCode();

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: prompt,
      career: currentCareerCode,
      timestamp: new Date()
    };

    this.messages.update(prev => [...prev, userMsg]);
    this.queryInput.set('');
    this.isQuerying.set(true);

    // 2. Call API Service
    this.apiService.sendQuery({
      query: prompt,
      career: currentCareerCode,
      top_k: this.topK(),
      use_complex_model: this.useComplexModel()
    }).subscribe({
      next: (res) => {
        const assistantMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          text: res.answer,
          career: res.career,
          citations: res.citations,
          execution_time_ms: res.execution_time_ms,
          timestamp: new Date()
        };
        this.messages.update(prev => [...prev, assistantMsg]);
        this.isQuerying.set(false);
      },
      error: (err) => {
        console.error('[RagChatComponent] Error querying backend:', err);
        const errorMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          text: '⚠️ **Error de Comunicación:** No se pudo establecer conexión con Amazon API Gateway. Verifica que el servidor FastAPI backend esté corriendo en local o AWS.',
          timestamp: new Date(),
          isError: true
        };
        this.messages.update(prev => [...prev, errorMsg]);
        this.isQuerying.set(false);
      }
    });
  }

  clearHistory(): void {
    this.messages.set([]);
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (_e) {
      // ignore
    }
  }
}
