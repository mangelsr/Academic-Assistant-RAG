import { Component } from '@angular/core';
import { RagChatComponent } from './components/rag-chat/rag-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RagChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly title = 'Academic Assistant RAG';
}
