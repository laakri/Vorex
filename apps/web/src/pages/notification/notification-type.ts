export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    order?: {
      id: string;
      status: string;
      customerName: string;
      totalAmount: number;
    };
  }