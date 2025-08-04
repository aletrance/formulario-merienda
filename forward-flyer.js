import fetch from "node-fetch";

export const handler = async (event) => {
  const body   = JSON.parse(event.body || "{}" );
  const files  = event.files || [];

  // Seguridad básica
  if (body.secret !== process.env.FLYER_KEY)
    return { statusCode: 401, body: "unauthorized, secret recibido: " + body.secret };

  // No llegó archivo
  if (!files.length)
    return { statusCode: 400, body: "no file" };

  const payload = {
    flyer_url: files[0].url,
    categoria: body.categoria || "merienda"
  };

  // ENVÍA AL WEBHOOK DE N8N
  let webhookResult;
  try {
    const response = await fetch("https://n8n.srv750784.hstgr.cloud/webhook/wa-inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    webhookResult = await response.text();
  } catch (err) {
    webhookResult = `Error enviando al webhook: ${err}`;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      enviado: true,
      payload,
      webhookResult
    })
  };
};
