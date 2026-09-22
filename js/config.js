// =============================================
// CONFIGURAÇÕES DA BARBEARIA
// =============================================

const CONFIG = {
  // --- NOME DA BARBEARIA ---
  barbershopName: "Barbearia Paulista",
  barbershopPhone: "554791136576", // número com DDI+DDD para o link do WhatsApp

  // --- GOOGLE CALENDAR API ---
  // Passo 1: Acesse https://console.cloud.google.com
  // Passo 2: Crie um projeto > Ative "Google Calendar API"
  // Passo 3: Crie credenciais > Chave de API (restrinja ao seu domínio)
  // Passo 4: Compartilhe sua agenda do Google com acesso público de leitura
  // Passo 5: Cole os valores abaixo
  googleApiKey: "AIzaSyAeoVhtqgNrcSuA4gsyCMq7nQzBMtezves",
  calendarId: "a04cdfc5f361d180a909c930042a0eb9376e61ccd977f104449088a813608cd9@group.calendar.google.com", // ex: seuemail@gmail.com ou ID da agenda
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbymyARrpgzUhRdFoq0cS94O75Jh768MOgGi0y2xQbZiielFetzI5ZZAvXusZUe_F4j6/exec",
  // --- JANELAS DE HORÁRIO ---
  // Formato: { diaSemana: [[horaInicio, horaFim], ...] }
  // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  workingHours: {
    0: [],                              // Domingo - fechado
    1: [[13, 20]],                      // Segunda: 13h–20h
    2: [[8, 12], [13, 20]],             // Terça: 8h–12h e 13h–20h
    3: [[8, 12], [13, 20]],             // Quarta: 8h–12h e 13h–20h
    4: [[8, 12], [13, 20]],             // Quinta: 8h–12h e 13h–20h
    5: [[8, 12], [13, 20]],             // Sexta: 8h–12h e 13h–20h
    6: [[8, 13]],                       // Sábado: 8h–13h
  },

  // Duração de cada janela em minutos
  slotDuration: 30,

  // Quantos dias à frente o cliente pode agendar
  maxDaysAhead: 120,
};