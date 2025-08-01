import fetch from "node-fetch";

export const handler = async (event) => {
  const body   = JSON.parse(event.body || "{}");
  const files  = event.files || [];

  if (body.secret !== process.env.FLYER_KEY)          // seguridad básica
    return { statusCode: 401, body: "unauthorized" };

  if (!files.length)                                  // no llegó archivo
    return { statusCode: 400, body: "no file" };

  const payload = {
    flyer_url: files[0].url,          // URL pública segura de Netlify
    categoria: body.categoria || "merienda"
  };

  await fetch("https://n8n.srv750784.hstgr.cloud/webhook-test/wa-inbound", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { statusCode: 200, body: "ok" };
};
