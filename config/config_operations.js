const config_operations = {

	// Horario de operacao
	hour: {
		start_at    : 09,
		finished_at : 17,
	},

	// Gerenciamento da operacao
	operations: {
		stop: {
			gain: 20,
			loss: 15,
		},
		prevention_of_price_back: {
			min_candle	: 5, // Minimo de candles pra pensar em mexer no stop
			after_points: 6, // Apos 6 candles, procura oportunidades para mover stop
			get_out_at	: 4, 
		}
	},

	// Quando Iniciar uma operacao
	neurons: {
		min_candle_osc: 0.08,
		gap_abertura_maximo: 0.3
	}

};