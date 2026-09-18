export async function sendSms({ phone, message, flowId, variables = [] }) {
  if (!process.env.MSG91_AUTH_KEY) {
    console.warn("SMS provider not configured:", phone, message);
    return false;
  }
  const body = flowId
    ? {
        template_id: flowId,
        mobiles: String(phone),
        VAR1: variables[0] || message,
      }
    : { recipients: [{ mobiles: String(phone) }], message };
  const url = flowId
    ? "https://control.msg91.com/api/v5/flow/"
    : "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/";
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch (e) {
    console.error("SMS error", e);
    return false;
  }
}
export const sendOtpSms = (phone, code) =>
  sendSms({
    phone,
    message: `Your NutriSphere OTP is ${code}.`,
    flowId: process.env.MSG91_OTP_FLOW_ID,
    variables: [code],
  });
export const sendNearDeliverySms = (phone, orderNumber) =>
  sendSms({
    phone,
    message: `Your NutriSphere order #${orderNumber} is about 5 minutes away. Please be available to receive your order.`,
    flowId: process.env.MSG91_NEAR_DELIVERY_FLOW_ID,
    variables: [orderNumber],
  });
export const sendCancellationPromptSms = (phone) =>
  sendSms({
    phone,
    message:
      "Your NutriSphere yearly diet subscription is awaiting your continuation decision. Open the app to continue, change, or stop it.",
    flowId: process.env.MSG91_CANCELLATION_FLOW_ID,
  });
