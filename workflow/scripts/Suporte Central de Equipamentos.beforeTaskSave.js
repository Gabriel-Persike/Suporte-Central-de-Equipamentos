function beforeTaskSave(colleagueId, nextSequenceId, userList) {
	var atividade = getValue('WKNumState');
	var decisao = hAPI.getCardValue("decisao");
	var formMode = hAPI.getCardValue("formMode");
	hAPI.setCardValue("numProces", getValue("WKNumProces"));

	if (nextSequenceId != atividade) {
		if (formMode == "ADD" && getValue("WKNumState") == 4) {
			var comentario = "";
			if (hAPI.getCardValue("categoria") == "Agendamento de Curso / Orientação") {
				comentario = 
				"<h4>Agendamento: </h4>" + 
				"<b>Curso: </b> <span>" + hAPI.getCardValue("curso") + "</span><br>" + 
				"<b>Obra: </b> <span>" + hAPI.getCardValue("obra") + "</span><br>" + 
				"<b>Dia: </b> <span>" + FormataDataView(hAPI.getCardValue("inputCursoDiaAgendado")) + "</span><br>" + 
				"<b>Horario: </b> <span>" + hAPI.getCardValue("inputCursoHorarioAgendado") + "</span><br>";
				if (hAPI.getCardValue("observacaoAgendamentoCurso") != "") {
					comentario += 
					"<br>" + 
					"<h4>Observação: </h4>" + 
					hAPI.getCardValue("observacaoAgendamentoCurso").split("\n").join("<br>");
				}
				CriaAgendamentoCurso(colleagueId);
			}
			else if (hAPI.getCardValue("categoria") == "Cancelamento de Curso / Orientação") {
				var ds = DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
					DatasetFactory.createConstraint("operacao", "SelectWhereSolicitacao", "SelectWhereSolicitacao", ConstraintType.MUST),
					DatasetFactory.createConstraint("WKNumProces", hAPI.getCardValue("solicitacaoCancelamentoCurso"), hAPI.getCardValue("solicitacaoCancelamentoCurso"), ConstraintType.MUST)
				], null);

				comentario =
				"<h4 style='color:red;'>Cancelamento de Curso</h4>" + 
				"<b>Curso: </b> <span>" + ds.getValue(0, "CURSO") + "</span><br>" + 
				"<b>Obra: </b> <span>" + ds.getValue(0, "OBRA") + "</span><br>" + 
				"<b>Dia: </b> <span>" + FormataDataView(ds.getValue(0, "DIA")) + "</span><br>" + 
				"<b>Horario: </b> <span>" + ds.getValue(0, "HORARIO") + "</span><br>" +
				"<b>Motivo: </b><br><span>" + hAPI.getCardValue("solucao").split("\n").join("<br>") + "</span><br>";

				CancelaAgendamentoCurso(hAPI.getCardValue("solicitacaoCancelamentoCurso"));
				EnviaNotificacaoCancelamentoCurso(getValue("WKNumProces"), comentario);
			}

			hAPI.setTaskComments(colleagueId, getValue("WKNumProces"), 0, comentario);
		}
		else if (atividade == 4) {
			hAPI.setTaskComments(colleagueId, getValue("WKNumProces"), 0, hAPI.getCardValue("observacao"));
			EnviaNotificacaoAtualizacao(getValue("WKNumProces"));
			
			if (hAPI.getCardValue("categoria") == "Agendamento de Curso / Orientação") {
				UpdateAgendamentoCurso();
			}
		}
		else if (atividade == 5) {
			if (decisao == "Retornar") {
				hAPI.setTaskComments(colleagueId, getValue("WKNumProces"), 0, hAPI.getCardValue("observacao"));
				EnviaNotificacaoAtualizacao(getValue("WKNumProces"));
			} else {
				hAPI.setTaskComments(colleagueId, getValue("WKNumProces"), 0, "<b>Resolução: </b>" + hAPI.getCardValue("solucao"));
				EnviaNotificacaoEncerramento(getValue("WKNumProces"));

				if (hAPI.getCardValue("categoria") == "Agendamento de Curso / Orientação") {
					AtualizaStatusAgendamento();				
				}
			}
		}
	}
}

function EnviaNotificacaoEncerramento(numSolic) {
	log.info("envia email");
	try {
		var url = 'http://fluig.castilho.com.br:1010';//Prod
		//var url = 'http://homologacao.castilho.com.br:2020';//Homolog

		var html =
			"<p class='DescrMsgForum'>\
			Segue a resolução referente a solicitação\
			Nº <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'> " + numSolic + "</a>.\
		</p>\
		<div class='DescrMsgForum actions'>\
			<br />\
			<p class='DescrMsgForum'>\
				<b>Categoria:</b> " + hAPI.getCardValue('categoria') + "</br>\
				<b>Usuário:</b> " + hAPI.getCardValue('solicitante') + "</br>";
			
				if (hAPI.getCardValue("categoria") == "Agendamento de Curso / Orientação") {
					html += CorpoEmailAgendamentoCurso();
				}
			
			html +="</p>\
		</div>\
		<br>";

		var anexos = BuscaAnexos();
		if (anexos != false && anexos != "") {
			html +=
			"<div class='DescrMsgForum'>\
				<p class='DescrMsgForum'>\
					<b>Anexos:</b>\
					<ul>\
            			" + anexos + "<br>\
					</ul>\
				</p>\
			</div>";
		}

		html += "<div class='DescrMsgForum actions'>\
			<p class='DescrMsgForum'> Para mais detalhes, <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'>clique aqui.</a></p>\
		</div>";
		log.info("Remetentes: " + BuscaRemetentes());

		var data = {
			companyId: getValue("WKCompany").toString(),
			serviceCode: 'ServicoFluig',
			endpoint: '/api/public/alert/customEmailSender',
			method: 'post',
			timeoutService: '100',
			params: {
				to: BuscaRemetentes(),
				from: "fluig@construtoracastilho.com.br", //Prod
				//from: "no-reply@construtoracastilho.com.br", //Homolog
				subject: "[FLUIG] Chamado Encerrado - Suporte Central de Equipamentos - " + hAPI.getCardValue("categoria"),
				templateId: "TPL_SUPORTE_TI2",
				dialectId: "pt_BR",
				param: {
					"CORPO_EMAIL": html,
					"SERVER_URL": url,
					"TENANT_ID": "1"
				}
			}
		}

		var clientService = fluigAPI.getAuthorizeClientService();
		var vo = clientService.invoke(JSONUtil.toJSON(data));


		if (vo.getResult() == null || vo.getResult().isEmpty()) {
			throw "Retorno está vazio";
		} else {
			log.info("voResult");
			log.info(vo.getResult());
		}
		log.info("Fim envia email");
	} catch (error) {
		throw "Erro ao enviar e-mail de notificação: " + error;
	}
}

function EnviaNotificacaoCancelamentoCurso(numSolic, comentario){

	log.info("envia email");
	try {
		var url = 'http://fluig.castilho.com.br:1010';//Prod
		//var url = 'http://homologacao.castilho.com.br:2020';//Homolog

		var html =
			"<p class='DescrMsgForum'>\
				Segue a resolução referente a solicitação\
				Nº <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'> " + numSolic + "</a>.\
			</p>\
			<div class='DescrMsgForum actions'>\
				<p class='DescrMsgForum'>\
					" + comentario;
				html +="</p>\
			</div>\
			<br>";

		var anexos = BuscaAnexos();
		if (anexos != false && anexos != "") {
			html +=
			"<div class='DescrMsgForum'>\
				<p class='DescrMsgForum'>\
					<b>Anexos:</b>\
					<ul>\
            			" + anexos + "<br>\
					</ul>\
				</p>\
			</div>";
		}

		html += "<div class='DescrMsgForum actions'>\
			<p class='DescrMsgForum'> Para mais detalhes, <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'>clique aqui.</a></p>\
		</div>";
		log.info("Remetentes: " + BuscaRemetentes());

		var data = {
			companyId: getValue("WKCompany").toString(),
			serviceCode: 'ServicoFluig',
			endpoint: '/api/public/alert/customEmailSender',
			method: 'post',
			timeoutService: '100',
			params: {
				to: BuscaRemetentes(),
				from: "fluig@construtoracastilho.com.br", //Prod
				//from: "no-reply@construtoracastilho.com.br", //Homolog
				subject: "[FLUIG] Chamado Encerrado - Suporte Central de Equipamentos - " + hAPI.getCardValue("categoria"),
				templateId: "TPL_SUPORTE_TI2",
				dialectId: "pt_BR",
				param: {
					"CORPO_EMAIL": html,
					"SERVER_URL": url,
					"TENANT_ID": "1"
				}
			}
		}

		var clientService = fluigAPI.getAuthorizeClientService();
		var vo = clientService.invoke(JSONUtil.toJSON(data));


		if (vo.getResult() == null || vo.getResult().isEmpty()) {
			throw "Retorno está vazio";
		} else {
			log.info("voResult");
			log.info(vo.getResult());
		}
		log.info("Fim envia email");
	} catch (error) {
		throw "Erro ao enviar e-mail de notificação: " + error;
	}
}

function EnviaNotificacaoAtualizacao(numSolic) {
	log.info("envia email");
	try {
		var url = 'http://fluig.castilho.com.br:1010';//Prod
		//var url = 'http://homologacao.castilho.com.br:2020';//Homolog

		var atualizacao = null;
		var mensagem = null;
		if (hAPI.getCardValue("atividade") == "5") {
			atualizacao = "<b>Observação: </b>" + hAPI.getCardValue("observacao");
			mensagem = "Segue o retorno referente a solicitação Nº" + numSolic + ", \
			favor <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'>acessar a solicitação</a> e dar <b>continuidade ao seu chamado</b>.<br>\
			Ele será <b style='color:red;'>encerrado automaticamente</b> em <b style='color:red;'>" + hAPI.getCardValue("data_prazo_retorno") + "</b> caso não seja movimentado.";
		}
		else {
			atualizacao = "<b>Observação: </b>" + hAPI.getCardValue("observacao");
			mensagem = "Segue a atualização referente a solicitação\
			Nº<a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'> " + numSolic + "</a>.";
		}

		var html =
			"<p class='DescrMsgForum'>\
			" + mensagem + "\
		</p>\
		<div class='DescrMsgForum actions'>\
			<p class='DescrMsgForum'>\
				<b>Categoria:</b> " + hAPI.getCardValue('categoria') + "</br>\
				<b>Usuário:</b> " + hAPI.getCardValue('solicitante') + "</br></br>\
				<b>Responsável:</b> " + getValue("WKUser") + "</br>\
				" + atualizacao + "\
			</p>\
		</div>\
        <br>";
		var anexos = BuscaAnexos();
		if (anexos != false && anexos != "") {
			html +=
				"<div class='DescrMsgForum'>\
					<p class='DescrMsgForum'>\
						<b>Anexos:</b>\
						<ul>\
                			" + anexos + "<br>\
						</ul>\
					</p>\
				</div>";
		}

		html += "<div class='DescrMsgForum actions'>\
			<p class='DescrMsgForum'> Para mais detalhes, <a href='" + url + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numSolic + "' target='_blank'>clique aqui.</a></p>\
		</div>";

		var data = {
			companyId: getValue("WKCompany").toString(),
			serviceCode: 'ServicoFluig',
			endpoint: '/api/public/alert/customEmailSender',
			method: 'post',
			timeoutService: '100',
			params: {
				to: BuscaRemetentes(),
				from: "fluig@construtoracastilho.com.br", //Prod
				//from: "no-reply@construtoracastilho.com.br", //Homolog
				subject: "[FLUIG] Atualização - Suporte Central de Equipamentos - " + hAPI.getCardValue("categoria"),
				templateId: "TPL_SUPORTE_TI2",
				dialectId: "pt_BR",
				param: {
					"CORPO_EMAIL": html,
					"SERVER_URL": url,
					"TENANT_ID": "1"
				}
			}
		}

		var clientService = fluigAPI.getAuthorizeClientService();
		var vo = clientService.invoke(JSONUtil.toJSON(data));

		if (vo.getResult() == null || vo.getResult().isEmpty()) {
			throw "Retorno está vazio";
		} else {
			log.info(vo.getResult());
		}
		log.info("Fim envia email");
	} catch (error) {
		throw "Erro ao enviar e-mail de notificação: " + error;
	}
}

function CorpoEmailAgendamentoCurso(){
	var html = "";

	html +=
	"<div>\
		<b>Dia: </b><span>" + hAPI.getCardValue("inputCursoDiaAgendado").split("-").reverse().join("/") + "</span></br>\
		<b>Horário: </b><span>" + hAPI.getCardValue("inputCursoHorarioAgendado") + "</span></br>\
		<b>Curso: </b><span>" + hAPI.getCardValue("curso") + "</span></br>";

		if (hAPI.getCardValue("observacaoAgendamentoCurso") != "") {
			html+="<b>Observação: </b><br><span>" + hAPI.getCardValue("observacaoAgendamentoCurso").split("\n").join("<br>") + "</span><br>";
		}

		html+=
		"<br>\
		<b>Responsável: </b><span>" + BuscaNomeUsuario(hAPI.getCardValue("responsavelHidden")) + "</span></br>\
		<b>Resolução: </b><br>\
		<span>" + hAPI.getCardValue("solucao").split("\n").join("<br>") + "</span>"

	html +=
	"</div>";

	return html;
}

function BuscaEmailUsuario(usuario) {
	var ds = DatasetFactory.getDataset("colleague", null, [DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)], null);

	if (ds.values.length > 0) {
		return ds.getValue(0, "mail") + "; ";
	}
	else {
		return "";
	}
}

function BuscaAnexos() {
	var retorno = "";
	var docs = hAPI.listAttachments();

	for (var i = 0; i < docs.size(); i++) {
		var doc = docs.get(i);
		retorno += "<li><a href='" + fluigAPI.getDocumentService().getDownloadURL(doc.getDocumentId()) + "'>" + doc.getDocumentDescription() + "</a></li>"
	}

	return retorno;
}

function BuscaRemetentes() {
	var solicitante = hAPI.getCardValue('solicitante');
	var emailsCopia = hAPI.getCardValue("email");
	//var listRemetentes = "gabriel.persike@castilho.com.br; ";//Homolog
	var listRemetentes = "implantacaosisma@castilho.com.br; gabriel.persike@castilho.com.br; ";//Prod


	//Caso o solicitante não seja do grupo Suporte TI inclui o e-mail na lista de remetentes
	var ds = DatasetFactory.getDataset("colleagueGroup", null, [
		DatasetFactory.createConstraint("colleagueId", solicitante, solicitante, ConstraintType.MUST),
		DatasetFactory.createConstraint("groupId", "SuporteCentralDeEquipamentos", "SuporteCentralDeEquipamentos", ConstraintType.MUST)
	], null);
	if (ds.values.length < 1) {
		listRemetentes += BuscaEmailUsuario(solicitante);
	}

	if (emailsCopia != null && emailsCopia != "" && emailsCopia != undefined) {
		listRemetentes += emailsCopia;
	}


	if (hAPI.getCardValue("categoria") == "Agendamento de Curso / Orientação") {
			var usuarios = JSON.parse(hAPI.getCardValue("inputCursoUsuariosJSON"));
			for (var i = 0; i < usuarios.length; i++) {
				if (usuarios[i].email != "") {
					listRemetentes += usuarios[i].email + "; "
				}
			}
	}

	if (listRemetentes.substring(listRemetentes.length - 2, listRemetentes.length) == "; ") {
		listRemetentes = listRemetentes.substring(0, listRemetentes.length - 2);
	}


	if (listRemetentes.substring(listRemetentes.length - 1, listRemetentes.length) == ";" || listRemetentes.substring(listRemetentes.length - 1, listRemetentes.length) == " ") {
		listRemetentes = listRemetentes.substring(0, listRemetentes.length - 1);
	}



	log.info("ListRemetentes: " + listRemetentes);
	return listRemetentes;
}

function InsertAgendamento() {
	DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
		DatasetFactory.createConstraint("operacao", "Insert", "Insert", ConstraintType.MUST),
		DatasetFactory.createConstraint("curso", hAPI.getCardValue("curso"), hAPI.getCardValue("curso"), ConstraintType.MUST),
		DatasetFactory.createConstraint("obra", hAPI.getCardValue("obra"), hAPI.getCardValue("obra"), ConstraintType.MUST),
		DatasetFactory.createConstraint("dia", hAPI.getCardValue("inputCursoDiaAgendado"), hAPI.getCardValue("inputCursoDiaAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("horario", hAPI.getCardValue("inputCursoHorarioAgendado"), hAPI.getCardValue("inputCursoHorarioAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("solicitante", hAPI.getCardValue("solicitante"), hAPI.getCardValue("solicitante"), ConstraintType.MUST),
		DatasetFactory.createConstraint("usuariosJSON", hAPI.getCardValue("inputCursoUsuariosJSON"), hAPI.getCardValue("inputCursoUsuariosJSON"), ConstraintType.MUST),
		DatasetFactory.createConstraint("WKNumProces", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST),
	], null);


	var myQuery =
			"INSERT INTO "+
			"AGENDAMENTOS(CURSO, DIA, HORARIO, OBRA, SOLICITANTE, STATUS, SOLICITACAO, USUARIOSJSON) " +
			"VALUES (" +
				"'" + hAPI.getCardValue("curso") + "',"+
				"'" + hAPI.getCardValue("inputCursoDiaAgendado") + "',"+
				"'" + hAPI.getCardValue("inputCursoHorarioAgendado") + "',"+
				"'" + hAPI.getCardValue("obra") + "'," +
				"'" + hAPI.getCardValue("solicitante") + "',"+
				"1,"+
				getValue("WKNumProces") + ","+
				"'" + hAPI.getCardValue("inputCursoUsuariosJSON") + "'"+
			")";

	log.info("myQuery: " + myQuery);
}

function FormataDataView(data){
	if (data.split("-").length == 3) {
		data = data.split("-");
		data = data[2] + "/" + data[1] + "/" + data[0]; 
	}

	return data;
}

function CriaAgendamentoCurso(colleagueId){
	var ds = DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
		DatasetFactory.createConstraint("operacao", "Insert", "Insert", ConstraintType.MUST),
		DatasetFactory.createConstraint("curso", hAPI.getCardValue("curso"), hAPI.getCardValue("curso"), ConstraintType.MUST),
		DatasetFactory.createConstraint("dia", hAPI.getCardValue("inputCursoDiaAgendado"), hAPI.getCardValue("inputCursoDiaAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("horario", hAPI.getCardValue("inputCursoHorarioAgendado"), hAPI.getCardValue("inputCursoHorarioAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("obra", hAPI.getCardValue("obraHidden"), hAPI.getCardValue("obraHidden"), ConstraintType.MUST),
		DatasetFactory.createConstraint("solicitante", colleagueId, colleagueId, ConstraintType.MUST),
		DatasetFactory.createConstraint("usuariosJSON", hAPI.getCardValue("inputCursoUsuariosJSON"), hAPI.getCardValue("inputCursoUsuariosJSON"), ConstraintType.MUST),
		DatasetFactory.createConstraint("WKNumProces", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST),
	], null);

	log.info("Retorno CriaAgendamentoCurso(): " + ds.getValue(1, "coluna"))

	if (ds.getValue(1, "coluna") != "com.microsoft.sqlserver.jdbc.SQLServerException: A instrução não retornou um conjunto de resultados.") {
		throw "Erro ao agendar curso: " + ds.getValue(1, "coluna")
	}
}

function UpdateAgendamentoCurso(){
	var ds = DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
		DatasetFactory.createConstraint("operacao", "UpdateAgendamento", "UpdateAgendamento", ConstraintType.MUST),
		DatasetFactory.createConstraint("dia", hAPI.getCardValue("inputCursoDiaAgendado"), hAPI.getCardValue("inputCursoDiaAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("horario", hAPI.getCardValue("inputCursoHorarioAgendado"), hAPI.getCardValue("inputCursoHorarioAgendado"), ConstraintType.MUST),
		DatasetFactory.createConstraint("usuariosJSON", hAPI.getCardValue("inputCursoUsuariosJSON"), hAPI.getCardValue("inputCursoUsuariosJSON"), ConstraintType.MUST),
		DatasetFactory.createConstraint("WKNumProces", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST)
	], null);

	if (ds.getValue(1, "coluna") != "com.microsoft.sqlserver.jdbc.SQLServerException: A instrução não retornou um conjunto de resultados.") {
		throw "Erro ao atualizar agendamento: " + ds.getValue(1, "coluna")
	}
}

function AtualizaStatusAgendamento(){
	var ds = DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
		DatasetFactory.createConstraint("operacao", "UpdateStatusConfirmado", "UpdateStatusConfirmado", ConstraintType.MUST),
		DatasetFactory.createConstraint("responsavel", hAPI.getCardValue("responsavelCurso"), hAPI.getCardValue("responsavelCurso"), ConstraintType.MUST),
		DatasetFactory.createConstraint("WKNumProces", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST),
	], null);
	
	log.info("Retorno CriaAgendamentoCurso(): " + ds.getValue(1, "coluna"))

	if (ds.getValue(1, "coluna") != "com.microsoft.sqlserver.jdbc.SQLServerException: A instrução não retornou um conjunto de resultados.") {
		throw "Erro ao agendar curso: " + ds.getValue(1, "coluna")
	}
}

function BuscaNomeUsuario(usuario) {
	var ds = DatasetFactory.getDataset("colleague", ["colleagueName"], [
        DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)
    ], null);
	
    return ds.getValue(0, "colleagueName");
}

function CancelaAgendamentoCurso(processId){
	var ds = DatasetFactory.getDataset("AgendamentoCursosCentral", null, [
		DatasetFactory.createConstraint("operacao", "UpdateStatusCancelado", "UpdateStatusCancelado", ConstraintType.MUST),
		DatasetFactory.createConstraint("WKNumProces", processId, processId, ConstraintType.MUST)
	], null);

	if (ds.getValue(1, "coluna") != "com.microsoft.sqlserver.jdbc.SQLServerException: A instrução não retornou um conjunto de resultados.") {
		throw "Erro ao atualizar agendamento: " + ds.getValue(1, "coluna")
	}
}
