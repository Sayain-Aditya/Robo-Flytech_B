const Twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

let client = null;
if (accountSid && authToken) {
  client = Twilio(accountSid, authToken);
}

const ensureWhatsAppNumber = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
};

const formatOrderMessage = (order, user) => {
  const customerName = user?.name || 'Unknown Customer';
  const customerPhone = user?.phone || order.shippingAddress?.phone || 'Not provided';
  const address = order.shippingAddress;
  const shippingLine = address
    ? `${address.address || ''}${address.city ? `, ${address.city}` : ''}${address.pin ? `, ${address.pin}` : ''}${address.state ? `, ${address.state}` : ''}${address.country ? `, ${address.country}` : ''}`.replace(/^,\s*/, '')
    : 'No address provided';

  const itemsText = order.items.map((item) => {
    const itemTotal = item.price != null && item.quantity != null ? `₹${item.price * item.quantity}` : '';
    return `• ${item.name || 'Item'} x${item.quantity || 0} @ ₹${item.price || 0} ${itemTotal ? `= ${itemTotal}` : ''}`;
  }).join('\n');

  return `🎉 *You have a new order placed!*

📦 *Order Details:*
Order ID: ${order._id}
Customer: ${customerName}
Phone: ${customerPhone}
Payment Method: ${order.paymentMethod || 'N/A'}
Status: ${order.status || 'Pending'}

📍 *Shipping Address:*
${shippingLine}

🛒 *Order Items:*
${itemsText}

💰 *Payment Summary:*
Items Total: ₹${order.itemsPrice || 0}
Shipping: ₹${order.shippingPrice || 0}
Discount: -₹${order.discount || 0}
*Grand Total: ₹${order.totalPrice || 0}*

Thank you for your business! 🙏
`;
};

exports.sendWhatsAppOrderNotification = async (order, user) => {
  if (!client) {
    console.warn('WhatsApp notifier not initialized: missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    return;
  }

  if (!fromNumber || !adminNumber) {
    console.warn('WhatsApp notifier skipped: missing TWILIO_WHATSAPP_FROM or ADMIN_WHATSAPP_NUMBER');
    return;
  }

  const from = ensureWhatsAppNumber(fromNumber);
  const to = ensureWhatsAppNumber(adminNumber);

  if (!from || !to) {
    console.warn('WhatsApp notifier skipped: invalid WhatsApp phone number format');
    return;
  }

  const messagePayload = {
    from,
    to,
    body: formatOrderMessage(order, user)
  };

  try {
    await client.messages.create(messagePayload);
    console.log('WhatsApp notification sent successfully');
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error.message);
  }
};
