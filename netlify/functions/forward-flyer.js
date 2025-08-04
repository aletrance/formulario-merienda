const busboy = require('busboy');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  return await new Promise((resolve) => {
    let fields = {};
    let fileBuffer = Buffer.alloc(0);
    let fileInfo = {};
    let hasFile = false;
    let errorSent = false;

    const bb = busboy({ headers: event.headers });

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      hasFile = true;
      fileInfo = { filename, encoding, mimetype };
      file.on('data', (data) => {
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });
      file.on('limit', () => {
        if (!errorSent) {
          errorSent = true;
          resolve({
            statusCode: 413,
            body: JSON.stringify({ error: 'Archivo demasiado grande' }),
          });
        }
      });
    });

    bb.on('finish', async () => {
      if (errorSent) return;
      // Validar secreto
      if (fields.secreto !== 'TOKENSECRETO123') {
        resolve({
          statusCode: 403,
          body: JSON.stringify({ error: 'Secreto inválido' }),
        });
        return;
      }
      if (!hasFile || !fileInfo.filename) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: 'No se recibió archivo' }),
        });
        return;
      }
      const payload = {
        ...fields,
        file: {
          filename: fileInfo.filename,
          mimetype: fileInfo.mimetype,
          encoding: fileInfo.encoding,
          data: fileBuffer.toString('base64'),
        },
      };
      try {
        const response = await fetch('https://n8n.srv750784.hstgr.cloud/webhook/wa-inbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const respText = await response.text();
        // Redirigir a la página de éxito
        resolve({
          statusCode: 302,
          headers: {
            Location: '/enviado.html'
          },
          body: ''
        });
      } catch (err) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error enviando al webhook', details: err.message }),
        });
      }
    });

    bb.on('error', (err) => {
      if (!errorSent) {
        errorSent = true;
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error procesando el formulario', details: err.message }),
        });
      }
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
};
