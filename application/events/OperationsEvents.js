const OperationsEvents = {

	count_verificacao_taxa: 0,
	ultima_taxa: null,
	fechamento_dia_anterior: null,
	watch: function(){

		var _this = this;

		_this.interval = setInterval( function(){

			_this.checkThereIsSession();
			_this.turnIntervalWatch();

		}, 1000 ); // verifica segundo a segundo

	},
	turnIntervalWatch: function(){

		var _this = this;

		var obj_date 	= _this.getTimestampData();
		var taxa 	 	= _this.getTaxa();


		// -------------------------
		// RESETO O VALOR DE FECHAMENTO DO DIA ANTERIOR
		// Se for 7 horas, reseto a taxa de fechamento do dia anterior
		if( obj_date.hh == 7 && obj_date.ii < 50 ){

			sessionStorage.setItem( "fechamento_dia_anterior" 	, null );

		}


		// -------------------------
		// ADICIONO O VALOR ATUALIZADO DO FECHAMENTO DO DAI ANTERIOR E RESETO AS VARIAVEIS USADAS PELA IA
		// Se for entre as 8 a as 8:49, pega o valor de fechamento do dia anterior
		if( obj_date.hh == 8 && obj_date.ii < 50 ){

			// Se nao tiver abertura, seta abertura
			if( sessionStorage.getItem( "fechamento_dia_anterior" ) == undefined || sessionStorage.getItem( "fechamento_dia_anterior" ) == null ){

				// Recupero a taxa e reseto os dados que vou usar no decorrer do dia
				if( taxa !== false ){

					sessionStorage.setItem( "em_operacao" 				, false );
					sessionStorage.setItem( "taxa_abertura" 			, null );
					sessionStorage.setItem( "gap_aprovado" 				, false );
					sessionStorage.setItem( "primeira_taxa" 			, false );
					sessionStorage.setItem( "teve_primeira_taxa"		, false );
					sessionStorage.setItem( "operacoes"					, [] );
					sessionStorage.setItem( "operacoes_em_aberto"		, null );
					sessionStorage.setItem( "arr_candles" 				, [] );
					sessionStorage.setItem( "currently_candle" 			, {
						opened: null,
						closed: null,
						max: null,
						min: null,
					});
					sessionStorage.setItem( "fechamento_dia_anterior" 	, taxa );

				}

			}

		}


		// -------------------------
		// COMECO A OPERAR
		// Se a hora atual for maior ou igual a 9
		// Se a hora atual for menor que 17 horas
		if( obj_date.hh >= config_operations.hour.start_at && obj_date.hh < config_operations.hour.finished_at ){


			// Essa primeira taxa indica a taxa de abertura
			// So comecar quando tiver a primeira taxa do site
			if( sessionStorage.getItem( "fechamento_dia_anterior" ) != taxa && taxa > 2000 && parseInt( obj_date.hh ) == 9 ){

				sessionStorage.setItem( "primeira_taxa", true );

			}


			// Comeca o algoritmo apenas apos a primeira taxa aprovada
			if( sessionStorage.getItem( "primeira_taxa" ) ){


				// Seta dados sobre o GAP DE ABERTURA
				// Se a variacao do candle anterior(fehcamento do dia) em relaxao a abertura for no maximo de 0.3% 
				if( _this.variacaoEntreDuasTaxas( sessionStorage.getItem( "fechamento_dia_anterior" ), taxa ) <= config_operations.neurons.gap_abertura_maximo ){

					sessionStorage.setItem( "taxa_abertura" , taxa );
					sessionStorage.setItem( "gap_aprovado" 	, true );

					console.log( 'Taxa de Abertura: ' + taxa );
					console.log( 'Gap Aprovado: ' + _this.variacaoEntreDuasTaxas( sessionStorage.getItem( "fechamento_dia_anterior" ), taxa ) );

				} else {

					sessionStorage.setItem( "gap_aprovado" 	, false );

					console.log( 'Taxa de Abertura: ' + taxa );
					console.log( 'Gap Reprovado: ' + _this.variacaoEntreDuasTaxas( sessionStorage.getItem( "fechamento_dia_anterior" ), taxa ) );

				}


				// Se nao tiver a primeira taxa, deixa passar... pois vai que a primeira taxa seja mostrada as 09:00:03, com
				// alguns segundos de delay pela Clear
				if( obj_date.ss == 00 || !sessionStorage.getItem( "teve_primeira_taxa" ) ){ // Se o SEGUNDO for igual a zero, vejo a possibilidade de ter um novo candle

					// Se o minuto for 0,5,10... significa que comeca um novo candle de M5
					if( !sessionStorage.getItem( "teve_primeira_taxa" ) || obj_date.ii == 00 || obj_date.ii == 05 || obj_date.ii == 10 || obj_date.ii == 15 || obj_date.ii == 20 || obj_date.ii == 25 || obj_date.ii == 30 || obj_date.ii == 35 || obj_date.ii == 40 || obj_date.ii == 45 || obj_date.ii == 50 || obj_date.ii == 55 ){

						sessionStorage.setItem( "teve_primeira_taxa", true );

						var currently_candle = sessionStorage.getItem( "currently_candle" );

						currently_candle.closed = taxa;

						// Se tiver abertura
						if( currently_candle.opened != null ){

							// VE A POSSIBILIDADE DE STARTAR OPERACOES
							// Se o gap de um dia pro outro for aprovado
							if( sessionStorage.getItem( "gap_aprovado" ) ){

								// Se estiver com uma operacao em aberto
								if( sessionStorage.getItem( "em_operacao" ) ){


									var operacoes_em_aberto = sessionStorage.getItem( "operacoes_em_aberto" );

									// Verifico se devo mover o stop
									operacoes_em_aberto.num_candle = operacoes_em_aberto.num_candle + 1;
									if( operacoes_em_aberto.num_candle >= config_operations.operations.prevention_of_price_back.min_candle ){ // se a operacao durar mais que 5 candle, sair da operacao com seguranca

										switch( operacoes_em_aberto.type ){

											case 'compra':

												if( taxa >= _this.calculateTax( operacoes_em_aberto.abertura_em, config_operations.operations.prevention_of_price_back.after_points, 'sum' ) ){
													operacoes_em_aberto.loss = _this.calculateTax( operacoes_em_aberto.abertura_em, config_operations.operations.prevention_of_price_back.get_out_at, 'sum' );
												}

												break;

											case 'venda':

												if( taxa <= _this.calculateTax( operacoes_em_aberto.abertura_em, config_operations.operations.prevention_of_price_back.after_points, 'less' ) ){
													operacoes_em_aberto.loss = _this.calculateTax( operacoes_em_aberto.abertura_em, config_operations.operations.prevention_of_price_back.get_out_at, 'less' );
												}

												break;


										}


									}

									// Verifico se devo sair da operacao
									switch( operacoes_em_aberto.type ){

										case 'compra':

											if( taxa >= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.gain, 'sum' ) ){
												// gain
												// tax
											} else if( taxa <= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.loss, 'less' ) ){
												// loss
											}

											break;

										case 'venda':

											if( taxa <= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.gain, 'less' ) ){
												// gain
											} else if( taxa >= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.loss, 'less' ) ){
												// loss
											}

											break;

									}

									sessionStorage.setItem( "operacoes_em_aberto", operacoes_em_aberto );

								// Se nao tiver operacoes em aberto e atingir a config, inicia uma operacao
								} else if( _this.variacaoEntreDuasTaxas( currentlyCandlecurrently_candle.opened, currently_candle.closed ) >= config_operations.neurons.min_candle_osc ){

									////
									console.log( 'Starta a operacao' );

									switch( _this.verificaCompraOuVenda( sessionStorage.getItem( "taxa_abertura" ), taxa ) ){

										case 'compra':

											sessionStorage.setItem( "em_operacao", true );
											var gain = _this.calculateTax( tax, config_operations.operations.stop.gain, 'sum' );
											var loss = _this.calculateTax( tax, config_operations.operations.stop.loss, 'less' );

											var operacoes_em_aberto = {
												type: 'compra',
												abertura_em: taxa,
												gain: gain,
												loss: loss,
												num_candle: 0,
											};

											sessionStorage.setItem( "operacoes_em_aberto", operacoes_em_aberto );

											break;

										case 'venda':

											sessionStorage.setItem( "em_operacao", true );

											var gain = _this.calculateTax( taxa, config_operations.operations.stop.gain, 'less' );
											var loss = _this.calculateTax( taxa, config_operations.operations.stop.loss, 'sum' );

											var operacoes_em_aberto = {
												type: 'venda',
												abertura_em: taxa,
												gain: gain,
												loss: loss,
												num_candle: 0,
											};

											sessionStorage.setItem( "operacoes_em_aberto", operacoes_em_aberto );

											break;

									}
									////

								}



							}

							// Adiciono o candle ao arrDeCandles
							var arr_candles = sessionStorage.getItem( "arr_candles" );
								arr_candles.push( currently_candle );
								sessionStorage.setItem( "arr_candles" , arr_candles );

						}

						currently_candle = {
							time	: obj_date.hh + ':' + obj_date.ii,
							opened 	: null,
							closed 	: null,
							max 	: null,
							min 	: null,
						}

						currently_candle.opened = taxa;
						currently_candle.max = taxa;
						currently_candle.min = taxa;

						sessionStorage.setItem( "currently_candle" , currently_candle );


					}

				}

				try {

					if( taxa > sessionStorage.getItem( "currently_candle" ).max ){

						var currentlyCandle = sessionStorage.getItem( "currently_candle" );
						currentlyCandle.max = taxa;
						sessionStorage.setItem( "currently_candle", currentlyCandle );

					}

					if( taxa < sessionStorage.getItem( "currently_candle" ).min ){

						var currentlyCandle = sessionStorage.getItem( "currently_candle" );
						currentlyCandle.min = taxa;
						sessionStorage.setItem( "currently_candle", currentlyCandle );

					}

				} catch( e ){
					console.log( e.message);
				}

				// Verifico se saio da operacao
				if( sessionStorage.getItem( "em_operacao" ) ){

					var operacoes_em_aberto = sessionStorage.getItem( "operacoes_em_aberto" );
					var operacoes = sessionStorage.getItem( "operacoes" );

					switch( operacoes_em_aberto.type ){

						case 'compra':

							if( taxa >= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.gain, 'sum' ) ){
								// gain
								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );
								
							} else if( taxa <= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.loss, 'less' ) ){

								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );

							}

							break;

						case 'venda':

							if( taxa <= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.gain, 'less' ) ){
								// gain
								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );

							} else if( taxa >= _this.calculateTax( operacoes_em_aberto.abertura_em, operacoes_em_aberto.loss, 'less' ) ){
								// loss
								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );

							}

							break;


					}

					// Se tiver operacoes abertas apos as 17, feche a operacao
					if( obj_date.hh >= 17 ){


						switch( operacoes_em_aberto.type ){

							case 'compra':

								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );

								break;

							case 'venda':

								operacoes_em_aberto.sai_da_operacao_em = taxa;
								operacoes.push( operacoes_em_aberto );
								sessionStorage.setItem( "operacoes", operacoes );
								sessionStorage.setItem( "em_operacao", false );

								break;

						}



					}

				}


			}


		}

	},
	checkThereIsSession: function()
	{

		var _this = this;
		var taxa = _this.getTaxa();
		var obj_date = _this.getTimestampData();

		// Se for em horario de operacao, verifique a sessao
		if( obj_date.hh >= 9 && obj_date.hh < 17 ){

			if( taxa === _this.ultima_taxa ){
				_this.count_verificacao_taxa = _this.count_verificacao_taxa + 1;
			} else {
				_this.count_verificacao_taxa = 0;
			}

			// Se a taxa nao for alterada em 50segundos, sinal que a sessao acabou
			if( _this.count_verificacao_taxa > 50 ){
				window.location.reload();
			}

		} else if( obj_date.hh == 7 && ( obj_date.ii == 30 || obj_date.ii == 45 || obj_date.ii == 55 || obj_date.ii == 58 ) && obj_date.ss == 30   ){
			// As 7 horas eu reinicio a pagina pra ter certeza que tera sessao quando for executada acao
			// Paga ter sessao na hora se pegar a taxa de ontem
			window.location.reload();
		} else if( obj_date.hh == 8 && ( obj_date.ii == 5 || obj_date.ii == 45  || obj_date.ii == 55 ) && ( obj_date.ss == 30 )   ){
			// Proximo da abertura eu tbm dou um refresh na pagina, pra ter certeza que tera sessao as 9 da manha
			window.location.reload();
		}

	},
	setFechamentoDiaAnteriorManual: function( date, range ){

		// yyyy_mm_dd
		sessionStorage.setItem('fechamento_intraday_para_o_dia_' + date , range );

	},
	getTaxa: function()
	{

		var tax = $('iframe[name="content-page"]').contents().find('.container_b_middle span.asset-price').text().replace('.','').replace(',','.');
		tax = parseFloat( tax );

		if( tax > 2000 ){
			return tax;
		} else {
			return false;
		}

	},
	getTimestampData: function()
	{

		var today = new Date();
		var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		var dd = String(today.getDate()).padStart(2, '0');
		var yyyy = today.getFullYear();

		var hh = String(today.getHours()).padStart(2, '0');
		var ii = String(today.getMinutes()).padStart(2, '0');
		var ss = String(today.getSeconds()).padStart(2, '0');

		today = mm + '/' + dd + '/' + yyyy + ' ' + hh + ':' + ii + ':' + ss;

		return {
			timestamp 	: today,
			mm			: mm,
			dd			: dd,
			yyyy		: yyyy,
			hh			: hh,
			ii 			: ii,
			ss 			: ss
		};

	},
	variacaoEntreDuasTaxas: function( taxa1, taxa2 )
	{

		var variacao = ( ( 100 / taxa1 ) * taxa2 ) - 100;
		if( variacao < 0 ){
			variacao = variacao * -1;
		}

		return variacao.toFixed(2);
		
	},
	calculateTax: function( tax, points, sumOrLess )
	{

		if( sumOrLess == "sum" ){
			return ( tax + points );
		} else if( sumOrLess == "less" ){
			return ( tax - points );
		}

	},
	verificaCompraOuVenda: function( taxa_abertura, taxa )
	{

		var tipo_operacao = null;

		if( taxa_abertura < taxa ){
			tipo_operacao = "compra";
		} else if( taxa_abertura > taxa ){
			tipo_operacao = "venda";
		}

		return tipo_operacao;

	}

}