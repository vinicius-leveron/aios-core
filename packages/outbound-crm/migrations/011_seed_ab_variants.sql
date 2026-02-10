-- Migration 011: Seed A/B Test Variant B Templates
-- Epic: OB-LEV | Story: OB-LEV-9 (A/B Testing)
--
-- Creates "B" variants for each cadence step to enable A/B testing.
-- Variant A: Existing templates (consultative, question-based approach)
-- Variant B: Direct value-proposition approach (more assertive)

-- Step 0 Variant B: Direct value proposition (instead of open question)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    0,
    'email',
    '{{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}},\n\nEscritorio de advocacia com mais de 5 advogados normalmente gasta 15h/semana em tarefas administrativas que poderiam ser automatizadas.\n\nNa Leveron, ajudamos escritorios como o {{company_name}} a recuperar esse tempo com automacoes simples - sem trocar sistemas, sem complicacao.\n\nResultado medio: 40% de reducao em trabalho manual nos primeiros 30 dias.\n\nPosso mostrar como funciona em 15 minutos?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 1 Variant B: Specific pain point (instead of generic case)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    1,
    'email',
    'RE: {{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}}, so complementando.\n\nOs 3 maiores desperdicios de tempo que vemos em escritorios:\n\n1. Controle manual de prazos processuais (risco de perder prazo)\n2. Busca de documentos em pastas e emails (15min+ por busca)\n3. Comunicacao com cliente via WhatsApp sem registro (perde historico)\n\nSe algum desses soa familiar, temos solucoes prontas que resolvem em menos de 2 semanas.\n\nQuer que eu mande um diagnostico rapido do que poderia ser automatizado no {{company_name}}?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 2 Variant B: ROI focused (instead of social proof stories)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    2,
    'email',
    'RE: {{first_name}}, 40% menos tempo em tarefas administrativas',
    E'{{first_name}}, fiz uma conta rapida.\n\nSe o {{company_name}} tem ao menos 1 pessoa dedicada a tarefas administrativas:\n\n- Custo atual: ~R$ 3.500/mes (salario + encargos)\n- Com automacao: libera 60%% desse tempo\n- Economia estimada: R$ 2.100/mes\n- Investimento na automacao: se paga em menos de 3 meses\n\nIsso sem contar o risco zero de perder prazos processuais, que pode custar muito mais.\n\nVale uma conversa de 15 minutos para detalhar esses numeros pro seu caso?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 3 Variant B: Permission-based breakup (instead of simple goodbye)
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    3,
    'email',
    'Posso ajudar de outra forma?',
    E'{{first_name}}, entendo que talvez nao seja o momento certo.\n\nSe o timing nao eh agora, sem problema. Mas antes de parar de escrever, queria perguntar:\n\nExiste algum outro desafio no {{company_name}} onde tecnologia poderia ajudar? As vezes a necessidade eh diferente do que imaginamos.\n\nSe preferir, tambem posso enviar nosso guia gratuito: "5 Automacoes que Todo Escritorio Deveria Ter".\n\nDe qualquer forma, desejo sucesso!\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'B'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Seed initial A/B experiment
INSERT INTO experiments (name, template_id, cadence_step, status, variants, primary_metric, min_sample_size, max_duration_days)
SELECT
    'Step 0: Question vs Value Prop',
    NULL,
    0,
    'draft',
    '{
        "A": {"description": "Consultative - open question about processes", "sent": 0, "opened": 0, "clicked": 0, "replied": 0},
        "B": {"description": "Direct - 40% time reduction value prop", "sent": 0, "opened": 0, "clicked": 0, "replied": 0}
    }'::jsonb,
    'reply_rate',
    100,
    14
WHERE EXISTS (SELECT 1 FROM cadences WHERE name = 'leveron_escritorios_email_v1')
ON CONFLICT DO NOTHING;

-- Verify
SELECT
    mt.step_number,
    mt.version,
    LEFT(mt.subject, 50) as subject_preview,
    LEFT(mt.body, 60) as body_preview
FROM message_templates mt
JOIN cadences c ON mt.cadence_id = c.id
WHERE c.name = 'leveron_escritorios_email_v1'
ORDER BY mt.step_number, mt.version;
