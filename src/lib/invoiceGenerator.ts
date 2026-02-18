import { formatINR } from "@/lib/utils";
import { format } from "date-fns";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export function generateInvoicePDF(data: InvoiceData): void {
  // Create invoice HTML
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .invoice-container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #8B4513; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #8B4513; }
        .logo span { color: #333; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 28px; color: #333; margin-bottom: 5px; }
        .invoice-title p { color: #666; font-size: 14px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .bill-to, .invoice-info { width: 48%; }
        .section-title { font-weight: 600; color: #8B4513; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
        .address p { margin: 4px 0; font-size: 14px; }
        .invoice-info p { margin: 6px 0; font-size: 14px; }
        .invoice-info strong { display: inline-block; width: 120px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .items-table th { background: #8B4513; color: white; padding: 12px; text-align: left; font-weight: 600; }
        .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        .text-right { text-align: right; }
        .totals { margin-left: auto; width: 300px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .totals-row.total { border-top: 2px solid #8B4513; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 15px; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        .payment-badge { display: inline-block; background: #e7f3e7; color: #2e7d32; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
        @media print {
          body { padding: 20px; }
          .header { border-bottom-width: 2px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo">Guna<span>Woodcraft</span></div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p>${data.invoiceNumber}</p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="bill-to">
            <p class="section-title">Bill To</p>
            <div class="address">
              <p><strong>${data.customerName}</strong></p>
              <p>${data.shippingAddress.address_line1}</p>
              ${data.shippingAddress.address_line2 ? `<p>${data.shippingAddress.address_line2}</p>` : ''}
              <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postal_code}</p>
              <p>Phone: ${data.shippingAddress.phone}</p>
              <p>Email: ${data.customerEmail}</p>
            </div>
          </div>
          <div class="invoice-info">
            <p class="section-title">Invoice Details</p>
            <p><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
            <p><strong>Order No:</strong> ${data.orderNumber}</p>
            <p><strong>Date:</strong> ${format(new Date(data.orderDate), 'dd MMM yyyy')}</p>
            <p><strong>Payment:</strong> <span class="payment-badge">${data.paymentMethod}</span></p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatINR(item.price)}</td>
                <td class="text-right">${formatINR(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatINR(data.subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>Shipping</span>
            <span>${data.shipping === 0 ? 'Free' : formatINR(data.shipping)}</span>
          </div>
          ${data.discount > 0 ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-${formatINR(data.discount)}</span>
          </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total</span>
            <span>${formatINR(data.total)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Guna Woodcraft!</p>
          <p style="margin-top: 8px;">For any queries, contact us at support@gunawoodcraft.com</p>
          <p style="margin-top: 8px; font-size: 10px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
