import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage } from '../../models/chat.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  conversationId = '';
  messages: ChatMessage[] = [];
  draft = '';
  loading = true;
  private poll?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private data: DataService
  ) {}

  ngOnInit(): void {
    this.conversationId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.conversationId) {
      this.router.navigate(['/inbox']);
      return;
    }
    this.refresh();
    this.poll = setInterval(() => this.refresh(), 2000);
  }

  ngOnDestroy(): void {
    if (this.poll) clearInterval(this.poll);
  }

  refresh(): void {
    this.data.getMessages(this.conversationId).subscribe((m) => {
      this.messages = m;
      this.loading = false;
    });
  }

  send(): void {
    const t = this.draft.trim();
    if (!t) return;
    this.data.sendMessage(this.conversationId, t).subscribe({
      next: () => {
        this.draft = '';
        this.refresh();
      },
      error: () => alert('Could not send'),
    });
  }

  isMine(m: ChatMessage): boolean {
    return m.senderId === this.auth.user?.id;
  }
}
