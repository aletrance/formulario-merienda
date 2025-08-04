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

  // DEBUG: en vez de enviar el fetch, devolvemos el contenido recibido y el payload
  return {
    statusCode: 200,
    body: JSON.stringify({
      debug: true,
      recibido: { body, files },
      payload
    })
  };
};
