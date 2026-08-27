import nodemailer from "nodemailer";

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a real OTP email to the recipient's email address.
 * @param {string} toEmail - recipient email
 * @param {string} otp - 6-digit OTP code
 */
export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your MyStore OTP — valid for 10 minutes`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f7fb; padding: 0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a56db 0%, #4338ca 100%); padding: 36px 40px 28px; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
            🛍️ MyStore
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">India's fastest growing fashion store</p>
        </div>

        <!-- Body -->
        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: 0;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 22px; font-weight: 800;">Verify Your Identity</h2>
          <p style="color: #6b7280; margin: 0 0 30px; font-size: 15px;">
            Use the OTP below to log in to your MyStore account. This code expires in <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #f0f4ff; border: 2px dashed #1a56db; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
            <p style="margin: 0 0 6px; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your One-Time Password</p>
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1a56db; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>

          <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; padding-top: 20px; margin: 0;">
            ⚠️ <strong>Never share this OTP with anyone.</strong> MyStore will never ask for your OTP via phone or message.
            If you did not request this, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 40px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: 0;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
            © 2026 MyStore. All rights reserved. &nbsp;|&nbsp; 
            <a href="#" style="color: #6b7280; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send password changed email.
 * @param {string} toEmail
 */
export const sendPasswordChangedEmail = async (toEmail) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your password has been changed",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:600px; margin:0 auto; background:#f4f7fb; padding:20px;">
        <h1 style="color:#1a56db;">Password Changed</h1>
        <p>Your MyStore account password was successfully updated.</p>
        <p>If you did not initiate this change, please contact support immediately.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send order placed email to user.
 * @param {string} toEmail - recipient email
 * @param {object} order - order document (populated with needed fields)
 */
export const sendOrderPlacedEmail = async (toEmail, order) => {
  const transporter = createTransporter();
  const itemsHtml = order.orderItems
    .map(
      (item) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">${item.name}</td>
          <td style="padding:8px; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; text-align:right;">₹${item.price}</td>
        </tr>`
    )
    .join('');

  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your order #${order._id} has been placed!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin:0 auto; background:#f4f7fb; padding:0;">
        <div style="background:linear-gradient(135deg,#1a56db 0%,#4338ca 100%); padding:36px 40px 28px; border-radius:16px 16px 0 0;">
          <h1 style="margin:0; color:#fff; font-size:26px; font-weight:900;">🛍️ MyStore</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">Thank you for shopping with us!</p>
        </div>
        <div style="background:#fff; padding:40px; border:1px solid #e5e7eb; border-top:0;">
          <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:800;">Order Summary</h2>
          <p style="color:#6b7280; margin:0 0 20px; font-size:15px;">Order ID: <strong>${order._id}</strong></p>
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
              <tr style="border-bottom:2px solid #e5e7eb; background:#f9fafb;">
                <th style="padding:8px; text-align:left;">Product</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px; text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="text-align:right; font-size:18px; font-weight:600; color:#111827;">Total: ₹${order.totalAmount}</p>
          <p style="color:#6b7280; font-size:14px; margin-top:20px;">Payment Method: ${order.paymentMethod}<br/>Shipping to: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}</p>
        </div>
        <div style="background:#f9fafb; padding:20px 40px; border-radius:0 0 16px 16px; border:1px solid #e5e7eb; border-top:0;">
          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">© 2026 MyStore. All rights reserved.</p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send order status update email.
 * @param {string} toEmail
 * @param {string} orderId
 * @param {string} newStatus
 */
export const sendOrderStatusEmail = async (toEmail, orderId, newStatus) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your order #${orderId} status: ${newStatus}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:600px; margin:0 auto; background:#f4f7fb; padding:0;">
        <div style="background:linear-gradient(135deg,#1a56db 0%,#4338ca 100%); padding:36px 40px 28px; border-radius:16px 16px 0 0;">
          <h1 style="margin:0; color:#fff; font-size:26px; font-weight:900;">🛍️ MyStore</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">Your order is progressing.</p>
        </div>
        <div style="background:#fff; padding:40px; border:1px solid #e5e7eb; border-top:0;">
          <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:800;">Order Status Update</h2>
          <p style="color:#6b7280; margin:0 0 20px; font-size:15px;">Order ID: <strong>${orderId}</strong></p>
          <p style="font-size:18px; font-weight:600; color:#111827;">Current Status: <span style='color:#1a56db;'>${newStatus}</span></p>
        </div>
        <div style="background:#f9fafb; padding:20px 40px; border-radius:0 0 16px 16px; border:1px solid #e5e7eb; border-top:0;">
          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">© 2026 MyStore. All rights reserved.</p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send order cancellation email.
 * @param {string} toEmail
 * @param {object} order
 */
export const sendOrderCancelledEmail = async (toEmail, order) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your order #${order._id} has been cancelled`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:600px; margin:0 auto; background:#f4f7fb; padding:0;">
        <div style="background:linear-gradient(135deg,#1a56db 0%,#4338ca 100%); padding:36px 40px 28px; border-radius:16px 16px 0 0;">
          <h1 style="margin:0; color:#fff; font-size:26px; font-weight:900;">🛍️ MyStore</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">Your order was cancelled.</p>
        </div>
        <div style="background:#fff; padding:40px; border:1px solid #e5e7eb; border-top:0;">
          <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:800;">Cancellation Confirmation</h2>
          <p style="color:#6b7280; margin:0 0 20px; font-size:15px;">Order ID: <strong>${order._id}</strong></p>
          <p style="font-size:15px; color:#111827;">If you have any questions, reply to this email or contact support.</p>
        </div>
        <div style="background:#f9fafb; padding:20px 40px; border-radius:0 0 16px 16px; border:1px solid #e5e7eb; border-top:0;">
          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">© 2026 MyStore. All rights reserved.</p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send order shipped email.
 * @param {string} toEmail
 * @param {object} order
 */
export const sendOrderShippedEmail = async (toEmail, order) => {
  const transporter = createTransporter();
  const itemsHtml = order.orderItems
    .map(
      (item) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">${item.name}</td>
          <td style="padding:8px; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; text-align:right;">₹${item.price}</td>
        </tr>`
    )
    .join('');
  const trackingInfo = order.trackingHistory && order.trackingHistory.length
    ? `<p style="color:#6b7280; font-size:15px; margin:0 0 20px;">Latest Tracking: ${order.trackingHistory[order.trackingHistory.length - 1].status} - ${order.trackingHistory[order.trackingHistory.length - 1].description}</p>`
    : '';
  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your order #${order._id} has been shipped!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin:0 auto; background:#f4f7fb; padding:0;">
        <div style="background:linear-gradient(135deg,#1a56db 0%,#4338ca 100%); padding:36px 40px 28px; border-radius:16px 16px 0 0;">
          <h1 style="margin:0; color:#fff; font-size:26px; font-weight:900;">🛍️ MyStore</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">Your order is on its way!</p>
        </div>
        <div style="background:#fff; padding:40px; border:1px solid #e5e7eb; border-top:0;">
          <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:800;">Order Shipped</h2>
          <p style="color:#6b7280; margin:0 0 20px; font-size:15px;">Order ID: <strong>${order._id}</strong></p>
          ${trackingInfo}
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
              <tr style="border-bottom:2px solid #e5e7eb; background:#f9fafb;">
                <th style="padding:8px; text-align:left;">Product</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px; text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="text-align:right; font-size:18px; font-weight:600; color:#111827;">Total: ₹${order.totalAmount}</p>
          <p style="color:#6b7280; font-size:14px; margin-top:20px;">Shipping to: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}</p>
        </div>
        <div style="background:#f9fafb; padding:20px 40px; border-radius:0 0 16px 16px; border:1px solid #e5e7eb; border-top:0;">
          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">© 2026 MyStore. All rights reserved.</p>
        </div>
      </div>`,
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send order delivered email.
 * @param {string} toEmail
 * @param {object} order
 */
export const sendOrderDeliveredEmail = async (toEmail, order) => {
  const transporter = createTransporter();
  const itemsHtml = order.orderItems
    .map(
      (item) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">${item.name}</td>
          <td style="padding:8px; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; text-align:right;">₹${item.price}</td>
        </tr>`
    )
    .join('');
  const trackingInfo = order.trackingHistory && order.trackingHistory.length
    ? `<p style="color:#6b7280; font-size:15px; margin:0 0 20px;">Tracking details: ${order.trackingHistory.map(t => t.status + ' at ' + t.date.toLocaleDateString()).join(' → ')}</p>`
    : '';
  const mailOptions = {
    from: `"MyStore 🛍️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your order #${order._id} has been delivered!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin:0 auto; background:#f4f7fb; padding:0;">
        <div style="background:linear-gradient(135deg,#1a56db 0%,#4338ca 100%); padding:36px 40px 28px; border-radius:16px 16px 0 0;">
          <h1 style="margin:0; color:#fff; font-size:26px; font-weight:900;">🛍️ MyStore</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">Your order has arrived.</p>
        </div>
        <div style="background:#fff; padding:40px; border:1px solid #e5e7eb; border-top:0;">
          <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:800;">Order Delivered</h2>
          <p style="color:#6b7280; margin:0 0 20px; font-size:15px;">Order ID: <strong>${order._id}</strong></p>
          ${trackingInfo}
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
              <tr style="border-bottom:2px solid #e5e7eb; background:#f9fafb;">
                <th style="padding:8px; text-align:left;">Product</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px; text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="text-align:right; font-size:18px; font-weight:600; color:#111827;">Total: ₹${order.totalAmount}</p>
        </div>
        <div style="background:#f9fafb; padding:20px 40px; border-radius:0 0 16px 16px; border:1px solid #e5e7eb; border-top:0;">
          <p style="margin:0; color:#9ca3af; font-size:12px; text-align:center;">© 2026 MyStore. All rights reserved.</p>
        </div>
      </div>`,
  };
  await transporter.sendMail(mailOptions);
};
