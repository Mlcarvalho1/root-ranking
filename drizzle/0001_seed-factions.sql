-- Custom SQL migration file, put your code below! --
INSERT INTO "factions" ("code", "name", "expansion", "color", "allows_duplicate") VALUES
	('marquise', 'Marquesa de Gato', 'Jogo base', '#E8752A', false),
	('eyrie', 'Dinastias do Ninho', 'Jogo base', '#3B6BB5', false),
	('alliance', 'Aliança da Floresta', 'Jogo base', '#57A559', false),
	('vagabond', 'Vagabundo', 'Jogo base', '#7A7A72', true),
	('riverfolk', 'Companhia Ribeirinha', 'Riverfolk', '#5BC8C0', false),
	('cult', 'Culto dos Lagartos', 'Riverfolk', '#E0C22B', false),
	('duchy', 'Ducado Subterrâneo', 'Underworld', '#C9A87C', false),
	('corvids', 'Conspiração dos Corvos', 'Underworld', '#6B4E8E', false),
	('hundreds', 'Senhor das Centenas', 'Marauder', '#A83232', false),
	('keepers', 'Guardiões de Ferro', 'Marauder', '#9BA5A8', false)
ON CONFLICT ("code") DO NOTHING;
