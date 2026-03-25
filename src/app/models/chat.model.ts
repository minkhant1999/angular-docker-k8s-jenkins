export interface Conversation {
  id: string;
  carId: string;
  carName: string;
  customerId: string;
  customerName: string;
  ownerId: string;
  ownerName: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}
