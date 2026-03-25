import { Component, OnInit } from '@angular/core';
import { Conversation } from '../../models/chat.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css'],
})
export class InboxComponent implements OnInit {
  conversations: Conversation[] = [];
  loading = true;

  constructor(private data: DataService, public auth: AuthService) {}

  ngOnInit(): void {
    const id = this.auth.user?.id;
    if (!id) return;
    this.data.getConversationsForUser(id).subscribe((c) => {
      this.conversations = c;
      this.loading = false;
    });
  }

  otherParty(c: Conversation): string {
    const u = this.auth.user;
    if (!u) return '';
    return u.id === c.customerId ? c.ownerName : c.customerName;
  }
}
