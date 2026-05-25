export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  features: string[];
}

export interface Order {
  id: string;
  orderId?: string;
  uid: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: "paid" | "unpaid";
  discount?: number;
  subtotal?: number;
}

export interface Customer {
  uid: string;
  email: string;
  displayName: string;
  lastVisit: string;
  visitCount: number;
  cartItems?: OrderItem[];
}
