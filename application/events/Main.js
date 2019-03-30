const Main = {

	identifyPage: function()
	{

		var pathname = window.location.pathname;
		// alert( pathname );
		console.log( pathname );

		switch( pathname ){

			case '/pit/signin':

				console.log(' Fazer Login ');
				LoginEvents.startloginEvent();

				break;
			case '/pit/Selector':
			case '/MinhaConta/MeusAtivos':

				console.log(' Redireciona para o day trade');
				RedirectEvents.redirectToDayTrade();

			case '/Operacoes/RendaVariavel/DayTrade':
				
				console.log('Comeca o WATCH');
				OperationsEvents.watch();

		}

	}

}

Main.identifyPage();