const busboy = require('busboy');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
    });

    let fields = {};
    let files = [];

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      let fileData = [];
      file.on('data', (data) => {
        fileData.push(data);
      });
      file.on('end', () => {
        files.push({
          fieldname,
          filename,
          encoding,
          mimetype,
          data: Buffer.concat(fileData).toString('base64')
        });
      });
    });

    bb.on('finish', async () => {
      if (fields.secret !== "TOKENSECRETO123") {
        return resolve({ statusCode: 401, body: "unauthorized, secret recibido: " + fields.secret });
      }
      if (!files.length) {
        return resolve({ statusCode: 400, body: "no file" });
      }

      const payload = {
        flyer_filename: files[0].filename,
        flyer_mimetype: files[0].mimetype,
        flyer_base64: files[0].data,
        categoria: fields.categoria || "merienda"
      };

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

      resolve({
        statusCode: 200,
        body: JSON.stringify({
          enviado: true,
          payload,
          webhookResult
        })
      });
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
};
