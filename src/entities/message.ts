export interface Message {
  id: string;
  userId: string;
  request: string;
  response: string | null;
  createdAt: number;
  updatedAt: number;
}
