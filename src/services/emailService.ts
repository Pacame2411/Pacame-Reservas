interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  customerName: string;
  reservationId: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  phone: string;
  specialRequests?: string;
  assignedTable?: string;
  confirmationUrl?: string;
  cancellationUrl?: string;
}

class EmailService {
  private apiEndpoint = 'https://api.emailjs.com/api/v1.0/email/send'; // Ejemplo con EmailJS
  private serviceId = 'service_restaurant'; // Configurar en EmailJS
  private templateIds = {
    confirmation: 'template_confirmation',
    reminder: 'template_reminder',
    cancellation: 'template_cancellation',
    modification: 'template_modification'
  };

  // Enviar email de confirmación inmediato
  async sendConfirmationEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.generateConfirmationTemplate(emailData);
      
      const result = await this.sendEmail({
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'confirmation'
      });

      if (result.success) {
        console.log(`✅ Email de confirmación enviado a ${emailData.to}`);
        this.logEmailSent('confirmation', emailData);
      }

      return result;
    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
      return { success: false, error: 'Error al enviar email de confirmación' };
    }
  }

  // Enviar email recordatorio el mismo día
  async sendReminderEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.generateReminderTemplate(emailData);
      
      const result = await this.sendEmail({
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'reminder'
      });

      if (result.success) {
        console.log(`✅ Email recordatorio enviado a ${emailData.to}`);
        this.logEmailSent('reminder', emailData);
      }

      return result;
    } catch (error) {
      console.error('Error enviando email recordatorio:', error);
      return { success: false, error: 'Error al enviar email recordatorio' };
    }
  }

  // Enviar email de cancelación
  async sendCancellationEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.generateCancellationTemplate(emailData);
      
      const result = await this.sendEmail({
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'cancellation'
      });

      if (result.success) {
        console.log(`✅ Email de cancelación enviado a ${emailData.to}`);
        this.logEmailSent('cancellation', emailData);
      }

      return result;
    } catch (error) {
      console.error('Error enviando email de cancelación:', error);
      return { success: false, error: 'Error al enviar email de cancelación' };
    }
  }

  // Enviar email de modificación
  async sendModificationEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.generateModificationTemplate(emailData);
      
      const result = await this.sendEmail({
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        type: 'modification'
      });

      if (result.success) {
        console.log(`✅ Email de modificación enviado a ${emailData.to}`);
        this.logEmailSent('modification', emailData);
      }

      return result;
    } catch (error) {
      console.error('Error enviando email de modificación:', error);
      return { success: false, error: 'Error al enviar email de modificación' };
    }
  }

  // Función principal para enviar emails
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    type: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // En un entorno real, aquí usarías un servicio como:
      // - EmailJS (frontend)
      // - SendGrid, Mailgun, AWS SES (backend)
      // - Nodemailer (backend)
      
      // Simulación para desarrollo
      if (this.isDevelopmentMode()) {
        return this.simulateEmailSend(params);
      }

      // Implementación real con EmailJS (ejemplo)
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: this.serviceId,
          template_id: this.templateIds[params.type as keyof typeof this.templateIds],
          user_id: 'YOUR_USER_ID', // Configurar en EmailJS
          template_params: {
            to_email: params.to,
            subject: params.subject,
            html_content: params.html,
            text_content: params.text
          }
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Error del servicio de email' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Simular envío de email en desarrollo
  private simulateEmailSend(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    type: string;
  }): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`📧 [SIMULADO] Email ${params.type} enviado:`);
        console.log(`   Para: ${params.to}`);
        console.log(`   Asunto: ${params.subject}`);
        console.log(`   Contenido: ${params.text.substring(0, 100)}...`);
        
        // Always succeed in development mode
        const success = true;
        
        if (success) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Error simulado de envío' });
        }
      }, 1000 + Math.random() * 2000); // Delay realista
    });
  }

  // Generar template de confirmación
  private generateConfirmationTemplate(data: EmailData): EmailTemplate {
    const subject = `✅ Reserva Confirmada - ${data.restaurantName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reserva Confirmada</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header .divider { width: 60px; height: 2px; background-color: #f59e0b; margin: 15px auto; }
          .content { padding: 40px 30px; }
          .confirmation-box { background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .confirmation-box h2 { color: #15803d; margin: 0 0 10px 0; font-size: 24px; }
          .reservation-id { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #f59e0b; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .detail-item { padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          .detail-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
          .detail-value { font-size: 16px; color: #1e293b; font-weight: 500; }
          .special-requests { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .actions { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; }
          .btn-primary { background-color: #1e293b; color: white; }
          .btn-secondary { background-color: #e2e8f0; color: #1e293b; }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          .contact-info { margin: 20px 0; }
          .contact-info a { color: #1e293b; text-decoration: none; }
          @media (max-width: 600px) {
            .details-grid { grid-template-columns: 1fr; }
            .content { padding: 20px; }
            .header { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.restaurantName}</h1>
            <div class="divider"></div>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Cocina Mediterránea Contemporánea</p>
          </div>
          
          <div class="content">
            <div class="confirmation-box">
              <h2>¡Reserva Confirmada!</h2>
              <p style="margin: 10px 0 0 0; color: #374151;">Número de reserva:</p>
              <div class="reservation-id">#${data.reservationId}</div>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Estimado/a <strong>${data.customerName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Nos complace confirmar su reserva en <strong>${data.restaurantName}</strong>. 
              Esperamos ofrecerle una experiencia gastronómica excepcional.
            </p>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Fecha</div>
                <div class="detail-value">${this.formatDate(data.date)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Hora</div>
                <div class="detail-value">${data.time}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Comensales</div>
                <div class="detail-value">${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Teléfono</div>
                <div class="detail-value">${data.phone}</div>
              </div>
            </div>
            
            ${data.assignedTable ? `
              <div class="detail-item" style="margin: 20px 0;">
                <div class="detail-label">Mesa Asignada</div>
                <div class="detail-value">Mesa ${data.assignedTable}</div>
              </div>
            ` : ''}
            
            ${data.specialRequests ? `
              <div class="special-requests">
                <div class="detail-label">Peticiones Especiales</div>
                <div style="color: #92400e; font-weight: 500;">${data.specialRequests}</div>
              </div>
            ` : ''}
            
            <div class="actions">
              ${data.confirmationUrl ? `<a href="${data.confirmationUrl}" class="btn btn-primary">Ver Reserva</a>` : ''}
              ${data.cancellationUrl ? `<a href="${data.cancellationUrl}" class="btn btn-secondary">Modificar/Cancelar</a>` : ''}
            </div>
            
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Información Importante:</h3>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Le enviaremos un recordatorio el día de su reserva</li>
                <li>Para cancelaciones, contáctenos con al menos 24 horas de antelación</li>
                <li>Llegue puntualmente para garantizar su mesa</li>
                <li>Para grupos de más de 6 personas, se requiere confirmación telefónica</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div class="contact-info">
              <strong>${data.restaurantName}</strong><br>
              C/ Gran Vía 123, Madrid<br>
              <a href="tel:+34912345678">+34 912 345 678</a> | 
              <a href="mailto:reservas@bellavista.com">reservas@bellavista.com</a>
            </div>
            <p style="margin: 15px 0 0 0; font-size: 12px;">
              © 2024 ${data.restaurantName}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ✅ RESERVA CONFIRMADA - ${data.restaurantName}
      
      Estimado/a ${data.customerName},
      
      Nos complace confirmar su reserva:
      
      📅 Fecha: ${this.formatDate(data.date)}
      🕐 Hora: ${data.time}
      👥 Comensales: ${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}
      📞 Teléfono: ${data.phone}
      🎫 Número de reserva: #${data.reservationId}
      ${data.assignedTable ? `🪑 Mesa: ${data.assignedTable}` : ''}
      ${data.specialRequests ? `📝 Peticiones especiales: ${data.specialRequests}` : ''}
      
      INFORMACIÓN IMPORTANTE:
      • Le enviaremos un recordatorio el día de su reserva
      • Para cancelaciones, contáctenos con al menos 24 horas de antelación
      • Llegue puntualmente para garantizar su mesa
      
      ${data.restaurantName}
      C/ Gran Vía 123, Madrid
      📞 +34 912 345 678
      ✉️ reservas@bellavista.com
      
      ¡Esperamos verle pronto!
    `;

    return { subject, html, text };
  }

  // Generar template de recordatorio
  private generateReminderTemplate(data: EmailData): EmailTemplate {
    const subject = `🔔 Recordatorio: Su reserva es hoy - ${data.restaurantName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Reserva</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header .divider { width: 60px; height: 2px; background-color: white; margin: 15px auto; }
          .content { padding: 40px 30px; }
          .reminder-box { background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .reminder-box h2 { color: #92400e; margin: 0 0 10px 0; font-size: 24px; }
          .time-highlight { font-size: 32px; font-weight: bold; color: #d97706; margin: 15px 0; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .detail-item { padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          .detail-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
          .detail-value { font-size: 16px; color: #1e293b; font-weight: 500; }
          .directions { background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .directions h3 { color: #0369a1; margin: 0 0 15px 0; font-size: 18px; }
          .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
          .contact-info { margin: 20px 0; }
          .contact-info a { color: #1e293b; text-decoration: none; }
          @media (max-width: 600px) {
            .details-grid { grid-template-columns: 1fr; }
            .content { padding: 20px; }
            .header { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.restaurantName}</h1>
            <div class="divider"></div>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Su reserva es hoy</p>
          </div>
          
          <div class="content">
            <div class="reminder-box">
              <h2>🔔 ¡Su reserva es hoy!</h2>
              <div class="time-highlight">${data.time}</div>
              <p style="margin: 0; color: #92400e; font-weight: 500;">No olvide su cita con nosotros</p>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Estimado/a <strong>${data.customerName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Le recordamos que tiene una reserva confirmada para hoy en <strong>${data.restaurantName}</strong>. 
              ¡Esperamos verle muy pronto!
            </p>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Fecha</div>
                <div class="detail-value">Hoy, ${this.formatDate(data.date)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Hora</div>
                <div class="detail-value">${data.time}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Comensales</div>
                <div class="detail-value">${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Reserva #</div>
                <div class="detail-value">${data.reservationId}</div>
              </div>
            </div>
            
            ${data.assignedTable ? `
              <div class="detail-item" style="margin: 20px 0;">
                <div class="detail-label">Mesa Asignada</div>
                <div class="detail-value">Mesa ${data.assignedTable}</div>
              </div>
            ` : ''}
            
            <div class="directions">
              <h3>📍 Cómo llegar</h3>
              <p style="margin: 0; color: #0369a1; line-height: 1.6;">
                <strong>Dirección:</strong> C/ Gran Vía 123, Madrid<br>
                <strong>Metro:</strong> Gran Vía (Líneas 1 y 5)<br>
                <strong>Parking:</strong> Parking público en C/ Montera, 50m
              </p>
            </div>
            
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Importante:</h3>
              <ul style="color: #dc2626; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Llegue puntualmente para garantizar su mesa</li>
                <li>Si va a llegar tarde, llámenos al +34 912 345 678</li>
                <li>Para cancelaciones de último momento, contacte cuanto antes</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div class="contact-info">
              <strong>${data.restaurantName}</strong><br>
              C/ Gran Vía 123, Madrid<br>
              <a href="tel:+34912345678">+34 912 345 678</a> | 
              <a href="mailto:reservas@bellavista.com">reservas@bellavista.com</a>
            </div>
            <p style="margin: 15px 0 0 0; font-size: 12px;">
              ¡Gracias por elegir ${data.restaurantName}!
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      🔔 RECORDATORIO - ${data.restaurantName}
      
      Estimado/a ${data.customerName},
      
      ¡Su reserva es HOY!
      
      🕐 Hora: ${data.time}
      👥 Comensales: ${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}
      🎫 Reserva #: ${data.reservationId}
      ${data.assignedTable ? `🪑 Mesa: ${data.assignedTable}` : ''}
      
      📍 DIRECCIÓN:
      C/ Gran Vía 123, Madrid
      Metro: Gran Vía (Líneas 1 y 5)
      
      ⚠️ IMPORTANTE:
      • Llegue puntualmente para garantizar su mesa
      • Si va a llegar tarde, llámenos al +34 912 345 678
      • Para cancelaciones de último momento, contacte cuanto antes
      
      ¡Esperamos verle muy pronto!
      
      ${data.restaurantName}
      📞 +34 912 345 678
    `;

    return { subject, html, text };
  }

  // Generar template de cancelación
  private generateCancellationTemplate(data: EmailData): EmailTemplate {
    const subject = `❌ Reserva Cancelada - ${data.restaurantName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reserva Cancelada</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .cancellation-box { background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.restaurantName}</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Reserva Cancelada</p>
          </div>
          
          <div class="content">
            <div class="cancellation-box">
              <h2 style="color: #dc2626; margin: 0;">❌ Reserva Cancelada</h2>
              <p style="margin: 10px 0 0 0; color: #7f1d1d;">Reserva #${data.reservationId}</p>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Estimado/a <strong>${data.customerName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Su reserva para el ${this.formatDate(data.date)} a las ${data.time} ha sido cancelada exitosamente.
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Esperamos poder atenderle en una próxima ocasión. Para realizar una nueva reserva, 
              no dude en contactarnos.
            </p>
          </div>
          
          <div class="footer">
            <div>
              <strong>${data.restaurantName}</strong><br>
              C/ Gran Vía 123, Madrid<br>
              +34 912 345 678 | reservas@bellavista.com
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ❌ RESERVA CANCELADA - ${data.restaurantName}
      
      Estimado/a ${data.customerName},
      
      Su reserva #${data.reservationId} para el ${this.formatDate(data.date)} a las ${data.time} ha sido cancelada exitosamente.
      
      Esperamos poder atenderle en una próxima ocasión.
      
      ${data.restaurantName}
      📞 +34 912 345 678
    `;

    return { subject, html, text };
  }

  // Generar template de modificación
  private generateModificationTemplate(data: EmailData): EmailTemplate {
    const subject = `✏️ Reserva Modificada - ${data.restaurantName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reserva Modificada</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .modification-box { background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .detail-item { padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          .detail-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
          .detail-value { font-size: 16px; color: #1e293b; font-weight: 500; }
          .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.restaurantName}</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Reserva Modificada</p>
          </div>
          
          <div class="content">
            <div class="modification-box">
              <h2 style="color: #0369a1; margin: 0;">✏️ Reserva Modificada</h2>
              <p style="margin: 10px 0 0 0; color: #0369a1;">Reserva #${data.reservationId}</p>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Estimado/a <strong>${data.customerName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Su reserva ha sido modificada exitosamente. Aquí están los nuevos detalles:
            </p>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Nueva Fecha</div>
                <div class="detail-value">${this.formatDate(data.date)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Nueva Hora</div>
                <div class="detail-value">${data.time}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Comensales</div>
                <div class="detail-value">${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Teléfono</div>
                <div class="detail-value">${data.phone}</div>
              </div>
            </div>
            
            ${data.assignedTable ? `
              <div class="detail-item" style="margin: 20px 0;">
                <div class="detail-label">Mesa Asignada</div>
                <div class="detail-value">Mesa ${data.assignedTable}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>
              <strong>${data.restaurantName}</strong><br>
              C/ Gran Vía 123, Madrid<br>
              +34 912 345 678 | reservas@bellavista.com
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ✏️ RESERVA MODIFICADA - ${data.restaurantName}
      
      Estimado/a ${data.customerName},
      
      Su reserva #${data.reservationId} ha sido modificada:
      
      📅 Nueva fecha: ${this.formatDate(data.date)}
      🕐 Nueva hora: ${data.time}
      👥 Comensales: ${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}
      ${data.assignedTable ? `🪑 Mesa: ${data.assignedTable}` : ''}
      
      ${data.restaurantName}
      📞 +34 912 345 678
    `;

    return { subject, html, text };
  }

  // Programar recordatorio para el día de la reserva
  scheduleReminderEmail(emailData: EmailData): void {
    const reservationDate = new Date(emailData.date);
    const reminderTime = new Date(reservationDate);
    reminderTime.setHours(10, 0, 0, 0); // Enviar a las 10:00 AM del día de la reserva

    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.sendReminderEmail(emailData);
      }, timeUntilReminder);

      console.log(`📅 Recordatorio programado para ${reminderTime.toLocaleString()}`);
      
      // Guardar recordatorio programado
      this.saveScheduledReminder(emailData, reminderTime);
    } else {
      console.log('⚠️ La fecha de la reserva ya pasó, no se programará recordatorio');
    }
  }

  // Guardar recordatorio programado en localStorage
  private saveScheduledReminder(emailData: EmailData, reminderTime: Date): void {
    const reminders = this.getScheduledReminders();
    reminders.push({
      reservationId: emailData.reservationId,
      email: emailData.to,
      customerName: emailData.customerName,
      reminderTime: reminderTime.toISOString(),
      sent: false
    });
    
    localStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
  }

  // Obtener recordatorios programados
  private getScheduledReminders(): any[] {
    const stored = localStorage.getItem('scheduled_reminders');
    return stored ? JSON.parse(stored) : [];
  }

  // Verificar y enviar recordatorios pendientes (llamar al iniciar la aplicación)
  async checkAndSendPendingReminders(): Promise<void> {
    const reminders = this.getScheduledReminders();
    const now = new Date();
    
    for (const reminder of reminders) {
      if (!reminder.sent && new Date(reminder.reminderTime) <= now) {
        // Buscar la reserva actual
        const reservations = JSON.parse(localStorage.getItem('restaurant_reservations') || '[]');
        const reservation = reservations.find((r: any) => r.id === reminder.reservationId);
        
        if (reservation && reservation.status !== 'cancelled') {
          const emailData: EmailData = {
            to: reminder.email,
            customerName: reminder.customerName,
            reservationId: reminder.reservationId,
            restaurantName: 'Bella Vista',
            date: reservation.date,
            time: reservation.time,
            guests: reservation.guests,
            phone: reservation.phone,
            specialRequests: reservation.specialRequests,
            assignedTable: reservation.assignedTable
          };
          
          await this.sendReminderEmail(emailData);
          
          // Marcar como enviado
          reminder.sent = true;
        }
      }
    }
    
    // Guardar estado actualizado
    localStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
  }

  // Verificar si es modo desarrollo
  private isDevelopmentMode(): boolean {
    return import.meta.env.DEV;
  }

  // Formatear fecha
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Log de emails enviados
  private logEmailSent(type: string, emailData: EmailData): void {
    const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
    logs.push({
      type,
      to: emailData.to,
      reservationId: emailData.reservationId,
      customerName: emailData.customerName,
      sentAt: new Date().toISOString()
    });
    
    // Mantener solo los últimos 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('email_logs', JSON.stringify(logs));
  }

  // Obtener historial de emails
  getEmailHistory(): any[] {
    return JSON.parse(localStorage.getItem('email_logs') || '[]');
  }

  // Configurar servicio de email (para producción)
  configureEmailService(config: {
    provider: 'emailjs' | 'sendgrid' | 'mailgun';
    apiKey: string;
    serviceId?: string;
    templateIds?: Record<string, string>;
  }): void {
    // Guardar configuración de email
    localStorage.setItem('email_service_config', JSON.stringify(config));
    console.log('✅ Servicio de email configurado:', config.provider);
  }
}

export const emailService = new EmailService();