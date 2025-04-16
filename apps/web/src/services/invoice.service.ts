import api from "@/lib/axios";

export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  paymentMethod: string;
}

class InvoiceService {
  async getInvoiceData(orderId: string): Promise<InvoiceData> {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response.data;
  }

  async downloadInvoice(orderId: string): Promise<void> {
    try {
      const response = await api.get(`/orders/${orderId}/invoice/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService(); 