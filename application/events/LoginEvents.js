const LoginEvents = {

	startloginEvent: function()
	{

		// Preenche o valor do CPF
		$('input[name="identificationNumber"]').val( config_login.cpf );

		// Preenche a senha
		$('input[name="password"]').val( config_login.password );

		// Preenche a senha
		$('input[name="dob"]').val( config_login.birth_day );

		// Clica no botao de login
		$('.bt_signin').click();

	}

}