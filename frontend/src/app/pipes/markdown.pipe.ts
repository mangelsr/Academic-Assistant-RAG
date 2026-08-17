import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdownSanitize',
  standalone: true
})
export class MarkdownSanitizePipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | undefined | null): SafeHtml {
    if (!value) return '';

    let html = this.escapeHtml(value);

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
      return `<pre class="bg-slate-950/80 border border-slate-800 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto my-2"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-700">$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-indigo-300 mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>');

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');
    
    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

    // Bullet lists
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
