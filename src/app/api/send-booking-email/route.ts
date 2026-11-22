import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientEmail,
      clientName,
      businessName,
      businessAddress,
      businessPhone,
      serviceName,
      servicePrice,
      serviceDuration,
      proName,
      scheduledDate,
      scheduledTime,
      reservationCode,
    } = body;

    if (!clientEmail || !clientEmail.includes("@")) {
      return NextResponse.json({ success: false, message: "No email provided" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromSender = process.env.EMAIL_FROM || "Skedly <onboarding@resend.dev>";

    // Generar plantilla de correo electrónico moderna, premium y profesional
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Confirmación de Reserva - ${businessName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f8fb;
      color: #1a1e28;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border: 1px solid #eef2f6;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .badge-status {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .ticket-card {
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      margin-bottom: 24px;
    }
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .code-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .detail-grid {
      display: table;
      width: 100%;
    }
    .detail-row {
      display: table-row;
    }
    .detail-cell {
      display: table-cell;
      width: 50%;
      padding: 10px 0;
      vertical-align: top;
    }
    .detail-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .detail-text {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
    .detail-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .price-highlight {
      color: #2563eb;
      font-size: 16px;
    }
    .notice-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 12px 12px 0;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .notice-box p {
      margin: 0;
      font-size: 12px;
      color: #1e40af;
      line-height: 1.5;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #eef2f6;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge-status">Cita Confirmada</div>
      <h1>${businessName}</h1>
      <p>Confirmación oficial de tu servicio agendado</p>
    </div>

    <div class="content">
      <p class="greeting">
        Hola <strong>${clientName}</strong>,<br>
        ¡Tu reserva ha sido confirmada con éxito! A continuación te compartimos los detalles completos de tu cita:
      </p>

      <div class="ticket-card">
        <div class="ticket-header">
          <div>
            <div class="code-label">Código de Reserva</div>
            <div class="code-val">${reservationCode}</div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-row">
            <div class="detail-cell">
              <div class="detail-title">Servicio</div>
              <div class="detail-text">${serviceName}</div>
              <div class="detail-sub">${serviceDuration} minutos</div>
            </div>
            <div class="detail-cell">
              <div class="detail-title">Especialista</div>
              <div class="detail-text">${proName}</div>
              <div class="detail-sub">Atención profesional</div>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-cell" style="padding-top: 16px;">
              <div class="detail-title">Fecha y Hora</div>
              <div class="detail-text">${scheduledDate}</div>
              <div class="detail-sub">${scheduledTime} hrs (Puntual)</div>
            </div>
            <div class="detail-cell" style="padding-top: 16px;">
              <div class="detail-title">Monto a Liquidar</div>
              <div class="detail-text price-highlight">$${servicePrice} MXN</div>
              <div class="detail-sub">Pago directo en local</div>
            </div>
          </div>
        </div>

        ${
          businessAddress
            ? `
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
          <div class="detail-title">Ubicación</div>
          <div class="detail-text" style="font-weight: 500; font-size: 13px;">${businessAddress}</div>
        </div>
        `
            : ""
        }
      </div>

      <div class="notice-box">
        <p>
          <strong>Importante:</strong> Te recomendamos llegar 5 minutos antes de la hora fijada. Si requieres reprogramar o cancelar, por favor comunícate con el negocio con antelación.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">
        ¿Preguntas sobre tu cita? Contacto directo: <strong>${businessPhone || "Recepción"}</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">Este correo fue generado automáticamente por <strong>Skedly</strong> para ${businessName}.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ${businessName} · Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    if (resendApiKey) {
      // Enviar vía Resend API
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromSender,
          to: [clientEmail],
          subject: `Confirmación de Cita: ${serviceName} en ${businessName} (${scheduledDate})`,
          html: emailHtml,
        }),
      });

      const resData = await res.json();
      console.log("Resend API response:", resData);

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: resData, sent: false, provider: "resend" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, sent: true, data: resData, provider: "resend" });
    } else {
      // Proveedor no configurado aún en .env.local
      console.warn("AVISO: RESEND_API_KEY no está configurada en .env.local. El correo no pudo enviarse.");
      return NextResponse.json({
        success: true,
        sent: false,
        warning: "RESEND_API_KEY no configurada en las variables de entorno (.env.local)",
      });
    }
  } catch (error: any) {
    console.error("Error sending booking email:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

