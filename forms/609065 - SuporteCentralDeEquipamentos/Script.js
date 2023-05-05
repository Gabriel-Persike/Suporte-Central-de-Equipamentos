$(document).ready(function(){
    dataPrazoRetorno = null;
    calendarioRoot = null;
    modalRoot = null;
    var atividade = $("#atividade").val();
    var formMode = $("#formMode").val();
    //parent.$("#target-message-page").css("height", "100vh");

    $(".radioDecisao").on("change", function () {
        if ($(".radioDecisao:checked").val() == "Enviar") {
            $("#divInfoResolucaoChamado").show();
            $("#divInfoObservacao").hide();
        }
        else if ($(".radioDecisao:checked").val() == "Retornar") {
            $("#divInfoResolucaoChamado").hide();
            $("#divInfoObservacao").show();
            setDataPrazoRetorno();
        }
    });
    $(".radioDecisaoConclusao").on("change", function(){
        if ($(".radioDecisaoConclusao:checked").val() == "Enviar") {
            $("#divInfoObservacao").hide();
        }
        else{
            $("#divInfoObservacao").show();
        }
    });
    $(".inputObservacao, #email, .inputResolucaoChamado, .inputInfoChamado, .inputCurso").on("click", function(){
        $(this).removeClass("has-error");
    });
    $("#email").on("blur", function(){
        //Verifica se o usuario colocou o proprio email em copia e remove caso verdadeiro
        if ($(this).val() != null && $(this).val() != "") {
            DatasetFactory.getDataset("colleague", ["mail"], [
                DatasetFactory.createConstraint("colleagueId", $("#solicitante").val(), $("#solicitante").val(), ConstraintType.MUST)
            ], null, {
                success:(mail)=>{
                    var retorno = "";
                    var emails = $(this).val().trim().split(";");

                    for (let i = 0; i < emails.length; i++) {
                        const email = emails[i];
                        console.log(email.trim() + " - " + mail.values[0]["mail"]);
                        if (email.trim() == mail.values[0]["mail"]) {
                            FLUIGC.toast({
                                message: "O solicitante é automaticamente notificado por e-mail, não sendo necessário estar incluido em cópia.",
                                type: "warning"
                            });
                        }else{
                            retorno += email + "; ";
                        }
                    }

                    $(this).val(retorno.substring(0, retorno.length-2));
                },
                error: (error)=>{
                    FLUIGC.toast({
                        title: "Erro ao verificar e-mail do usuário: ",
                        message: error,
                        type: "warning"
                    });
                }
            });
        }
    });
    calendarioRoot = ReactDOM.createRoot(document.querySelector('#calendar'));
    calendarioRoot2 = ReactDOM.createRoot(document.querySelector('#divCancelamentoCurso'));
    $("#categoria").on("change", function(){
        if ($(this).val() == "Agendamento de Curso / Orientação") {
            
            $("#divCamposCursos").slideDown("400", (()=>{    
            
                calendarioRoot.render(React.createElement( Calendario, {curso: $("#curso").val(), obra: $("#obra").val()} ));   

            }));
        }
        else{
            $("#divCamposCursos").slideUp();
        }

        if ($(this).val() == "Cancelamento de Curso / Orientação") {
            $("#divCancelamentoCurso").slideDown("400", (()=>{    
                calendarioRoot2.render(React.createElement( Calendario ));   
            }));
        }
        else{
            $("#divCancelamentoCurso").slideUp();
        }

    });
    $("#btnAdicionarLinhaUsuariosCurso").on("click", function(){
        InsereLinhaUsuario();
    });
    $("#curso, #obra").on("change", function(){
        calendarioRoot.render(React.createElement( Calendario, {curso: $("#curso").val(), obra: $("#obra").val()} ));   
    });
    $("#obra").on("change", function(){
        $("#obraHidden").val($(this).val());
    });
    BuscaResponsaveisCurso();

    if (formMode == "ADD") {
        $("#divResolucaoChamado, #divCamposCursos").hide();
        //BuscaListDeUsuariosAD($("#solicitante").val());
        $("#atabHistorico").closest("li").hide();
        BuscaObras($("#userCode").val());
        $("#btnAdicionarLinhaUsuariosCurso").click();


        if (VerificaSeUsuarioCentral($("#userCode").val()) == "true") {
            $("#categoria").append("<option value='Cancelamento de Curso / Orientação'>Cancelamento de Curso / Orientação</option>")
        }
    }
    else if (formMode == "MOD") {
        $(".radioDecisao:checked").attr("checked", false);
        $(".radioDecisaoConclusao:checked").attr("checked", false);
        $("#observacao, #solucao, #divDecisaoConclusao").val("");
        BuscaComplementos();

        if ($("#categoria").val() == "Agendamento de Curso / Orientação") {
            $("#divCamposCursos").show();
            CriaListaUsuarios();
            setTimeout(() => {
                calendarioRoot.render(React.createElement( Calendario, {curso: $("#curso").val(), obra: $("#obra").val()} ));
            }, 500);
        }
        else{
            $("#divCamposCursos").hide();
        }


        if (atividade == 4) {//Inicio
            $("#divDecisao, #divDecisaoConclusao, #divInfoResolucaoChamado").hide();
            BuscaObras($("#userCode").val());
            BloqueiaCamposInfoChamado();
            $("#data_prazo_retorno").closest(".form-input").hide();
        }
        else if (atividade == 5) {//Solucao
            $("#btnAdicionarLinhaUsuariosCurso").hide();
            $("#divInfoResolucaoChamado, #divInfoObservacao, #divDecisaoConclusao").closest("div").hide();
            BuscaObras($("#userCode").val());
            BloqueiaCamposInfoChamado();
            dataPrazoRetorno = FLUIGC.calendar("#data_prazo_retorno");
        }
    }
    else if (formMode == "VIEW") {
        BuscaComplementos();
        $("#divResolucaoChamado").hide();

        if ($("#categoria").text() == "Agendamento de Curso / Orientação") {
            $("#divCamposCursos").show();
            $("#obra").text($("#obraHidden").val());
            CriaListaUsuarios();
            setTimeout(() => {
                calendarioRoot.render(React.createElement( Calendario, {curso: $("#curso").text(), obra: $("#obra").text()} ));
            }, 500);
        }
    }
    else {
    }
});