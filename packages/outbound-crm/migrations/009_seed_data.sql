-- Migration 009: Seed Initial Data
-- Epic: OB-LEV | Story: OB-LEV-1 | AC: 11, 12

-- Seed ICP: Escritorios de Advocacia
INSERT INTO icps (name, company, description, criteria, active)
VALUES (
    'escritorios_advocacia',
    'leveron',
    'Escritorios de advocacia de pequeno e medio porte (5-50 advogados). Decisor: socio-diretor ou socio-administrativo. Dor: processos manuais, falta de sistemas, gestao ineficiente.',
    '{
        "segment": "escritorios_advocacia",
        "company_size_min": 5,
        "company_size_max": 50,
        "decision_maker_roles": ["socio-diretor", "socio-administrativo", "socio", "diretor"],
        "budget_range": {"min": 5000, "max": 30000, "currency": "BRL"},
        "pain_points": ["processos_manuais", "falta_sistemas", "gestao_ineficiente"],
        "channels": ["email", "linkedin"],
        "scoring_weights": {
            "interaction": {
                "email_opened": 5,
                "email_clicked": 15,
                "email_replied": 30,
                "multi_open_bonus": 2,
                "multi_email_bonus": 10
            },
            "profile": {
                "has_website": 5,
                "company_medium_plus": 10,
                "role_decisor": 15,
                "has_linkedin": 5,
                "source_linkedin": 10,
                "source_maps_oab": 5
            },
            "decay": {
                "inactive_days_threshold": 14,
                "weekly_decay_pct": 10
            },
            "hot_threshold": 50
        }
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- Seed Cadence: Email v1 for Escritorios
INSERT INTO cadences (name, icp_id, channel, steps, active)
SELECT
    'leveron_escritorios_email_v1',
    id,
    'email',
    '[
        {"step": 0, "delay_days": 0, "channel": "email", "description": "Abertura - identificar dor + pergunta aberta"},
        {"step": 1, "delay_days": 3, "channel": "email", "description": "Follow-up com valor - case de resultado"},
        {"step": 2, "delay_days": 7, "channel": "email", "description": "Prova social - resultado de escritorio similar"},
        {"step": 3, "delay_days": 12, "channel": "email", "description": "Breakup - ultimo contato, tom casual"}
    ]'::jsonb,
    true
FROM icps
WHERE name = 'escritorios_advocacia'
ON CONFLICT DO NOTHING;

-- Seed Message Templates (placeholder copy - to be replaced with final copy)
-- Step 0: Abertura
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    0,
    'email',
    '{{company_name}} - pergunta rapida sobre gestao',
    E'Ola {{first_name}},\n\nVi que o {{company_name}} atua na area {{industry}} e fiquei curioso sobre como voces gerenciam os processos internos do escritorio hoje.\n\nMuitos escritorios que conversamos ainda dependem de planilhas e processos manuais para controle de prazos, documentos e comunicacao com clientes.\n\nVoces ja pensaram em automatizar alguma parte da operacao?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name', 'industry'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 1: Follow-up com valor
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    1,
    'email',
    'RE: {{company_name}} - pergunta rapida sobre gestao',
    E'{{first_name}}, complementando meu ultimo email.\n\nRecentemente ajudamos um escritorio de porte similar ao {{company_name}} a reduzir em 40%% o tempo gasto com tarefas administrativas, simplesmente automatizando o controle de prazos processuais.\n\nO interessante eh que a mudanca nao exigiu trocar nenhum sistema - apenas integramos o que eles ja usavam.\n\nSe fizer sentido, posso compartilhar como funcionou?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 2: Prova social
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    2,
    'email',
    'RE: {{company_name}} - pergunta rapida sobre gestao',
    E'{{first_name}}, ultima informacao que achei relevante.\n\nTemos 3 escritorios na regiao que implementaram automacoes no ultimo trimestre:\n\n- Um reduziu erros de prazo de 12/mes para zero\n- Outro economizou 20h/semana da equipe administrativa\n- O terceiro melhorou o tempo de resposta ao cliente em 60%%\n\nSe algum desses cenarios se parece com o que voces enfrentam no {{company_name}}, vale uma conversa de 15 minutos.\n\nO que acha?\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;

-- Step 3: Breakup
INSERT INTO message_templates (cadence_id, step_number, channel, subject, body, variables, version)
SELECT
    c.id,
    3,
    'email',
    'Devo parar de escrever?',
    E'{{first_name}}, sei que a rotina de um escritorio eh intensa.\n\nEsse eh meu ultimo contato - nao quero ser inconveniente.\n\nSe em algum momento fizer sentido conversar sobre tecnologia para o {{company_name}}, estou a disposicao.\n\nDesejo sucesso!\n\nAbraco,\nLeveron',
    ARRAY['first_name', 'company_name'],
    'A'
FROM cadences c
WHERE c.name = 'leveron_escritorios_email_v1'
ON CONFLICT DO NOTHING;
