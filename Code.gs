// =============================================
// GOOGLE APPS SCRIPT — Barbearia
// Cole este código em script.google.com
//
// COMO IMPLANTAR:
// 1. Acesse script.google.com e crie um novo projeto
// 2. Cole este código substituindo tudo
// 3. Clique em "Implantar" > "Nova implantação"
// 4. Tipo: "App da Web"
// 5. Executar como: "Eu (seu e-mail)"
// 6. Quem tem acesso: "Qualquer pessoa" (anônimo)
// 7. Copie a URL gerada e cole em js/config.js → appsScriptUrl
//
// IMPORTANTE: a cada alteração no código, crie uma
// NOVA implantação (não edite a existente) para que
// a URL pública reflita as mudanças.
// =============================================

// =============================================
// HORÁRIOS VÁLIDOS — espelha js/config.js
// Validação server-side para impedir agendamentos
// fora do horário mesmo se alguém manipular o JS
// =============================================
const WORKING_HOURS = {
  0: [],                        // Domingo - fechado
  1: [[13, 20]],                // Segunda
  2: [[8, 12], [13, 20]],       // Terça
  3: [[8, 12], [13, 20]],       // Quarta
  4: [[8, 12], [13, 20]],       // Quinta
  5: [[8, 12], [13, 20]],       // Sexta
  6: [[8, 13]],                 // Sábado
};

const SLOT_DURATION_MIN = 30;

// =============================================
// doGet — ponto de entrada (GET + no-cors)
// =============================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === "create") {
    return handleCreate(e.parameter);
  }

  // Ação desconhecida
  return jsonResponse({ success: false, error: "Ação desconhecida." });
}

// =============================================
// doPost — mantido por compatibilidade
// =============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleCreate(data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// =============================================
// handleCreate — cria o evento com validações
// =============================================
function handleCreate(params) {
  try {
    const clientName = (params.clientName || "").trim();
    const startISO   = params.start;
    const endISO     = params.end;

    // --- Validação básica de parâmetros ---
    if (!clientName || !startISO || !endISO) {
      return jsonResponse({ success: false, error: "Parâmetros incompletos." });
    }

    const startDate = new Date(startISO);
    const endDate   = new Date(endISO);

    // --- Valida se a data é futura ---
    if (startDate <= new Date()) {
      return jsonResponse({ success: false, error: "Não é possível agendar no passado." });
    }

    // --- Valida se está dentro do horário permitido ---
    if (!isWithinWorkingHours(startDate, endDate)) {
      return jsonResponse({ success: false, error: "Horário fora do expediente." });
    }

    // --- Verifica conflito com eventos existentes ---
    const calendar = CalendarApp.getDefaultCalendar();
    const existing = calendar.getEvents(startDate, endDate);
    if (existing.length > 0) {
      return jsonResponse({ success: false, error: "conflict", message: "Horário já ocupado." });
    }

    // --- Cria o evento ---
    calendar.createEvent(
      `✂ ${clientName}`,
      startDate,
      endDate,
      {
        description: `Cliente: ${clientName}\nAgendado via site`,
        // Bloqueia o horário para mostrar como ocupado a outros usuários
        status: CalendarApp.GuestStatus.YES,
      }
    );

    return jsonResponse({ success: true });

  } catch (err) {
    Logger.log("Erro em handleCreate: " + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// =============================================
// isWithinWorkingHours — validação server-side
// Verifica se start/end caem dentro de um slot válido
// =============================================
function isWithinWorkingHours(startDate, endDate) {
  const dayOfWeek = startDate.getDay(); // 0=Dom … 6=Sáb
  const ranges = WORKING_HOURS[dayOfWeek];

  if (!ranges || ranges.length === 0) return false; // dia fechado

  const startH = startDate.getHours();
  const startM = startDate.getMinutes();
  const startTotal = startH * 60 + startM; // minutos desde meia-noite

  // O slot de início deve cair dentro de um dos intervalos
  // e a duração deve ser exatamente SLOT_DURATION_MIN
  const durationMin = (endDate - startDate) / 60000;
  if (Math.round(durationMin) !== SLOT_DURATION_MIN) return false;

  // Minutos devem ser 00 ou 30 (slots de meia hora)
  if (startM !== 0 && startM !== 30) return false;

  for (const [rangeStart, rangeEnd] of ranges) {
    const rangeStartMin = rangeStart * 60;
    const rangeEndMin   = rangeEnd   * 60; // inclusive (último slot = rangeEnd até rangeEnd+30)

    if (startTotal >= rangeStartMin && startTotal <= rangeEndMin) {
      return true;
    }
  }

  return false;
}

// =============================================
// jsonResponse — helper para resposta JSON com CORS
// =============================================
function jsonResponse(obj) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// =============================================
// FUNÇÕES DE TESTE — execute manualmente no editor
// Selecione o nome da função no dropdown e clique ▶
// =============================================

// Testa isWithinWorkingHours com horários válidos e inválidos
function testeHorarios() {
  const casos = [
    // [descrição, startISO, endISO, esperado]
    ["✅ Terça 08:00–08:30",  "2025-08-05T08:00:00", "2025-08-05T08:30:00", true],
    ["✅ Terça 11:30–12:00",  "2025-08-05T11:30:00", "2025-08-05T12:00:00", true],
    ["✅ Terça 13:00–13:30",  "2025-08-05T13:00:00", "2025-08-05T13:30:00", true],
    ["✅ Terça 20:00–20:30",  "2025-08-05T20:00:00", "2025-08-05T20:30:00", true],
    ["✅ Sábado 08:00–08:30", "2025-08-09T08:00:00", "2025-08-09T08:30:00", true],
    ["✅ Sábado 13:00–13:30", "2025-08-09T13:00:00", "2025-08-09T13:30:00", true],
    ["✅ Segunda 13:00–13:30","2025-08-04T13:00:00", "2025-08-04T13:30:00", true],
    ["❌ Domingo (fechado)",  "2025-08-03T10:00:00", "2025-08-03T10:30:00", false],
    ["❌ Terça intervalo 12:00–12:30", "2025-08-05T12:00:00", "2025-08-05T12:30:00", false],
    ["❌ Terça 12:30–13:00", "2025-08-05T12:30:00", "2025-08-05T13:00:00", false],
    ["❌ Sábado 13:30–14:00","2025-08-09T13:30:00", "2025-08-09T14:00:00", false],
    ["❌ Duração 1h (inválida)","2025-08-05T09:00:00","2025-08-05T10:00:00", false],
    ["❌ Minuto inválido :15","2025-08-05T09:15:00", "2025-08-05T09:45:00", false],
  ];

  let passou = 0, falhou = 0;
  casos.forEach(([desc, start, end, esperado]) => {
    const resultado = isWithinWorkingHours(new Date(start), new Date(end));
    const ok = resultado === esperado;
    Logger.log(`${ok ? "✅ OK" : "❌ FALHOU"} — ${desc} → retornou: ${resultado}, esperado: ${esperado}`);
    ok ? passou++ : falhou++;
  });
  Logger.log(`\nResultado: ${passou} passou, ${falhou} falhou de ${casos.length} testes.`);
}

// Testa o fluxo completo de criação de evento
// ⚠️ Este teste CRIA UM EVENTO REAL na sua agenda!
// Apague-o manualmente após o teste.
function testeDoGet() {
  // Monta uma data futura válida: próxima terça às 10h
  const data = proximaTercaAs10h();
  const start = data.toISOString();
  const end   = new Date(data.getTime() + 30 * 60 * 1000).toISOString();

  // Simula o objeto `e` que o Apps Script recebe no doGet
  const eFake = {
    parameter: {
      action:     "create",
      clientName: "Teste Automático",
      start:      start,
      end:        end,
    }
  };

  const resposta = doGet(eFake);
  const json = JSON.parse(resposta.getContent());
  Logger.log("Resposta do doGet: " + JSON.stringify(json));

  if (json.success) {
    Logger.log("✅ Evento criado com sucesso! Verifique sua agenda e apague o evento de teste.");
  } else {
    Logger.log("❌ Falhou: " + (json.error || json.message));
  }
}

// Testa rejeição de horário fora do expediente
function testeHorarioInvalido() {
  const eFake = {
    parameter: {
      action:     "create",
      clientName: "Teste Inválido",
      start:      "2025-08-03T10:00:00", // Domingo — fechado
      end:        "2025-08-03T10:30:00",
    }
  };

  const resposta = doGet(eFake);
  const json = JSON.parse(resposta.getContent());
  Logger.log("Resposta (deve rejeitar): " + JSON.stringify(json));
  Logger.log(json.success === false ? "✅ Rejeitou corretamente." : "❌ Deveria ter rejeitado!");
}

// Helper: retorna próxima terça-feira às 10h (horário local)
function proximaTercaAs10h() {
  const hoje = new Date();
  const diasAteTerca = (2 - hoje.getDay() + 7) % 7 || 7; // 2 = terça
  const terca = new Date(hoje);
  terca.setDate(hoje.getDate() + diasAteTerca);
  terca.setHours(10, 0, 0, 0);
  return terca;
}

////////////////// corrigido

function doGet(e) {
  const p = e.parameter;

  // Validação mínima
  if (!p.clientName || !p.start || !p.end) {
    return json({ success: false, error: "Parâmetros ausentes" });
  }

  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const start    = new Date(p.start);
    const end      = new Date(p.end);

    // Checa conflito real antes de criar
    const conflitos = calendar.getEvents(start, end);
    if (conflitos.length > 0) {
      return json({ success: false, conflict: true });
    }

    calendar.createEvent(
      `Agendamento - ${p.clientName}`,
      start,
      end,
      { description: `Cliente: ${p.clientName}\nAgendado via site` }
    );

    return json({ success: true });

  } catch (err) {
    return json({ success: false, error: err.toString() });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}