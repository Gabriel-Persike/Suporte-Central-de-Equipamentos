function CalculaTempoConcluido(dataConclusao) {
    var dif = Math.abs(new Date(dataConclusao) - new Date());

    var difDias = Math.ceil(dif / (1000 * 60 * 60 * 24));
    if (difDias > 1) {
        return difDias + " dias atrás";
    }
    else {
        var difHoras = Math.ceil(dif / (1000 * 60 * 60));
        if (difHoras > 1) {
            return (difHoras - 1) + " horas atrás";
        }
        else {
            var difMinutos = Math.ceil(dif / (1000 * 60));
            return difMinutos + " minutos atrás";
        }
    }
}

function FormataData(data, dataEHorario = false) {
    var horario = "";

    if (dataEHorario) {
        data = data.split(" ");
        horario = data[1];
        data = data[0];
    }

    data = data.split("-");
    var retorno = data[2] + "/" + data[1] + "/" + data[0];
    if (horario) {
        retorno += " " + horario.split(".")[0];
    }

    return retorno;
}

function FormataDataSQL(data, horario = false) {
    data = data.split("/");
    return data[2] + "-" + data[1] + "-" + data[0];
}

function BuscaComplementos() {
    DatasetFactory.getDataset("SuporteTIDataset", null, [
        DatasetFactory.createConstraint("Operacao", "BuscaComplementos", "BuscaComplementos", ConstraintType.MUST),
        DatasetFactory.createConstraint("numSolic", $("#numProces").val(), $("#numProces").val(), ConstraintType.MUST),
    ], null, {
        success: async (data) => {
            $("#atabHistorico").text("Histórico (" + data.values.length + ")");
            var listComplementos = data.values;
            for (var i = 0; i < listComplementos.length; i++) {
                const complemento = listComplementos[i];
                if (["4", "5"].includes(complemento.NUM_SEQ)) {
                    await BuscaImagemUsuario(complemento.COLLEAGUE_ID).then(imgUser => {
                        var htmlHistorico =
                            `<div class="row">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-body" style='display:flex; background-color: whitesmoke;'>
                                        <div class='imgUser' style='margin-right: 10px;'>
                                        </div>
                                        <div>
                                            <h3 class="card-title">`+ BuscaNomeUsuario(complemento.COLLEAGUE_ID) + `</b></h3>
                                            <span class="card-subtitle mb-2 text-muted">` + FormataData(complemento.DT_OBSERVATION, true) + " - " + CalculaTempoConcluido(complemento.DT_OBSERVATION) + `</span>
                                            <p class="card-text">` + complemento.OBSERVATION.split("<p>").join("").split("</p>").join("") + `</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

                        $("#divHistorico").append(htmlHistorico);
                        $("#divHistorico").find(".row:last").find(".imgUser").append(imgUser);
                    }).catch((error) => {
                        console.log("Erro ao buscar imagem de usuário: " + error);
                    });
                }
            }
        },
        error: (error) => {
            console.log("Erro ao buscar complementos:" + error);
            FLUIGC.toast({
                title: "Erro ao buscar complementos: ",
                message: error,
                type: "warning"
            });
        }
    });
}

function BuscaImagemUsuario(usuario) {
    return new Promise(async (resolve, reject) => {
        const res = await fetch("/api/public/social/image/" + usuario);//Homoloh
        //const res = await fetch("http://fluig.castilho.com.br:1010/api/public/social/image/" + usuario);//Prod
        const blob = await res.blob();
        const img = new Image();
        img.width = "40";
        img.height = "40";
        img.src = URL.createObjectURL(blob);
        await img.decode();
        resolve(img);
    });
}

function BuscaNomeUsuario(usuario) {
    return DatasetFactory.getDataset("colleague", ["colleagueName"], [
        DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)
    ], null).values[0].colleagueName;
}

function BloqueiaCamposInfoChamado() {
    $(".inputInfoChamado, .inputCurso").each(function () {
        $(this).siblings("div").html($(this).val().split("\n").join("</br>"));
        $(this).hide();
    });

    $(".radioInfoChamado").on("click", () => { return false });
}

function ValidaCampos() {
    var atividade = $("#atividade").val();
    var formMode = $("#formMode").val();

    var valida = true;
    if (atividade == 0 || atividade == 4) {
        $(".inputInfoChamado").each(function () {
            if ($(this).val() == null || $(this).val() == undefined || $(this).val() == "") {
                $(this).addClass("has-error");

                if (valida == true) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning"
                    });

                    $([document.documentElement, document.body]).animate({
                        scrollTop: $(this).offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }
        });

        if ($("#categoria").val() == "Agendamento de Curso / Orientação") {
            $(".inputCurso:not(.inputOpcional)").each(function () {
                if ($(this).val() == null || $(this).val() == undefined || $(this).val() == "") {
                    $(this).addClass("has-error");
                    if (valida == true) {
                        valida = false;
                        FLUIGC.toast({
                            message: "Campo não preenchido!",
                            type: "warning"
                        });
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $(this).offset().top - (screen.height * 0.15)
                        }, 700);
                    }
                }
            });

            if ($("#inputCursoDiaAgendado").val() == "" || $("#inputCursoHorarioAgendado").val() == "") {
                if (valida == true) {
                    FLUIGC.toast({
                        message: "Data e Horário não selecionados!",
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $("#calendar").offset().top - (screen.height * 0.15)
                    }, 700);
                }
                valida = false;
            }

            var usuarios = [];
            $("#tableUsuariosCurso>tbody").find("tr").each(function () {
                if ($(this).find(".nomeUsuario").val() == "") {
                    $(this).find(".nomeUsuario").addClass("has-error");

                    if (valida == true) {
                        FLUIGC.toast({
                            message: "Nome do usuário não informado!",
                            type: "warning"
                        });

                        $([document.documentElement, document.body]).animate({
                            scrollTop: $(this).find(".nomeUsuario").offset().top - (screen.height * 0.15)
                        }, 700);
                        valida = false;
                    }
                }
                else {
                    usuarios.push({
                        nome: $(this).find(".nomeUsuario").val(),
                        email: $(this).find(".emailusuario").val(),
                        telefone: $(this).find(".telefoneUsuario").val()
                    });
                }
            });
            $("#inputCursoUsuariosJSON").val(JSON.stringify(usuarios));
        }

        if (atividade == 4) {
            if ($("#observacao").val() == "" || $("#observacao").val() == null) {
                $("#observacao").addClass("has-error");

                if (valida == true) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $("#observacao").offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }

            var usuarios = [];
            $("#tableUsuariosCurso>tbody").find("tr").each(function () {
                if ($(this).find(".nomeUsuario").val() == "") {
                    $(this).find(".nomeUsuario").addClass("has-error");

                    if (valida == true) {
                        FLUIGC.toast({
                            message: "Nome do usuário não informado!",
                            type: "warning"
                        });

                        $([document.documentElement, document.body]).animate({
                            scrollTop: $(this).find(".nomeUsuario").offset().top - (screen.height * 0.15)
                        }, 700);
                        valida = false;
                    }
                }
                else{
                    usuarios.push({
                        nome: $(this).find(".nomeUsuario").val(),
                        email: $(this).find(".emailusuario").val(),
                        telefone: $(this).find(".telefoneUsuario").val()
                    });
                }
            });
            $("#inputCursoUsuariosJSON").val(JSON.stringify(usuarios));
        }
    }
    else if (atividade == 5) {
        $(".inputInfoChamado").each(function () {
            if ($(this).val() == null || $(this).val() == undefined || $(this).val() == "") {
                $(this).addClass("has-error");

                if (valida == true) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $(this).offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }
        });

        if ($(".radioDecisao:checked").val() == "Enviar" || $(".radioDecisao:checked").val() == "Encerrar") {
            $(".inputResolucaoChamado").each(function () {
                if ($(this).val() == null || $(this).val() == undefined || $(this).val() == "") {
                    $(this).addClass("has-error");

                    if (valida == true) {
                        valida = false;
                        FLUIGC.toast({
                            message: "Campo não preenchido!",
                            type: "warning"
                        });
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $(this).offset().top - (screen.height * 0.15)
                        }, 700);
                    }
                }
            });

            if ($("#categoria").val() == "Agendamento de Curso / Orientação") {
                if ($("#responsavelCurso").val() == "") {
                    $("#responsavelCurso").addClass("has-error");

                    if (valida == true) {
                        valida = false;
                        FLUIGC.toast({
                            message: "Responsável não selecionado!",
                            type: "warning"
                        });
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $("#responsavelCurso").offset().top - (screen.height * 0.15)
                        }, 700);
                    }
                }
            }
        }
        else if ($(".radioDecisao:checked").val() == "Retornar") {
            if ($("#data_prazo_retorno").val() == "" || $("#data_prazo_retorno").val() == null) {
                $("#data_prazo_retorno").addClass("has-error");
                if (valida == true) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $("#data_prazo_retorno").offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }
            if ($("#observacao").val() == "" || $("#observacao").val() == null) {
                $("#observacao").addClass("has-error");

                if (valida == true) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $("#observacao").offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }

        }
        else {
            throw "Nenhuma decisão selecionada!";
        }
    }


    if (valida == true) {
        valida = ValidaEmailsEmCopia();

        if (atividade == 0 || atividade == 4) {
            var usuariosJSON = [];
            $("#tableUsuariosCurso>tbody").find("tr").each(function () {
                usuariosJSON.push({
                    nome: $(this).find(".nomeUsuario").val(),
                    email: $(this).find(".emailusuario").val(),
                    telefone: $(this).find(".telefoneUsuario").val()
                });
            });
            $("#inputCursoUsuariosJSON").val(JSON.stringify(usuariosJSON));
        }
    }

    $("#responsavelHidden").val($("#responsavelCurso").val());

    return valida;
}

function BuscaObras(usuario) {
    var optSelected = $("#obraHidden").val();
    var usuarioTI = VerificaSeUsuarioCentral(usuario);

    var constraints = [
        DatasetFactory.createConstraint("groupId", "Obra%", "Obra%", ConstraintType.SHOULD, true),
        DatasetFactory.createConstraint("groupId", "Britagem%", "Britagem%", ConstraintType.SHOULD, true),
        DatasetFactory.createConstraint("groupId", "Regional%", "Regional%", ConstraintType.SHOULD, true),
        DatasetFactory.createConstraint("groupId", "Matriz", "Matriz", ConstraintType.SHOULD),
        DatasetFactory.createConstraint("groupId", "Central de Equipamentos", "Central de Equipamentos", ConstraintType.SHOULD)
    ];


    var dsName = 'group';
    if (usuarioTI != "true") {//Se usuario nao for TI filtra as obras que o usuario esta no grupo
        constraints.push(DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST));
        dsName = "colleagueGroup";//Se usuario nao for TI busca do Dataset colleagueGroup para filtrar por usuario
    }

    var obras = DatasetFactory.getDataset(dsName, ["groupId"], constraints, ["groupId"]);
    $("#obra").html("<option></option>");
    if (obras.values.length > 0) {
        for (let i = 0; i < obras.values.length; i++) {
            const obra = obras.values[i];
            $("#obra").append("<option value='" + obra['groupId'] + "'>" + obra['groupId'] + "</option>");
        }
    } else {//Se nao retornou nenhuma obra mostra a opcao Sem Obra
        $("#obra").append("<option value='Sem Obra - Favor informar a obra na descrição do chamado'>Sem Obra - Favor informar a obra na descrição do chamado</option>");
    }

    //Verifica se a opcao selecionada esta criada, necessario para a opcao Sem obra
    if ($("#obra2 option[value='" + optSelected + "']").length < 1 && optSelected != null) {
        $("#obra").append("<option value='" + optSelected + "'>" + optSelected + "</option>");
    }

    $("#obra").val(optSelected);//Retorna para a opcao selecionada antes de buscar as obras
}

function VerificaSeUsuarioCentral(usuario) {
    var ds = DatasetFactory.getDataset("colleagueGroup", null, [
        DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST),
        DatasetFactory.createConstraint("groupId", "SuporteCentralDeEquipamentos", "SuporteCentralDeEquipamentos", ConstraintType.SHOULD),
        DatasetFactory.createConstraint("groupId", "Central de Equipamentos", "Central de Equipamentos", ConstraintType.SHOULD)
    ], null);

    if (ds.values.length > 0) {
        return "true";
    }
    else {
        return "false";
    }
}

function setDataPrazoRetorno() {
    var date = new Date();
    var endDate = "", noOfDaysToAdd = 3, count = 0;
    while (count < noOfDaysToAdd) {
        endDate = new Date(date.setDate(date.getDate() + 1));
        if (endDate.getDay() != 0 && endDate.getDay() != 6) {
            //Date.getDay() gives weekday starting from 0(Sunday) to 6(Saturday)
            count++;
        }
    }
    dataPrazoRetorno.setDate(date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear());
}

function ValidaEmail(email) {
    if (email.includes(";")) {
        email = email.split(";").join("");
    }

    email = email.trim();
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;


    if (re.test(email)) {
        return true;
    }
    else {
        return false;
    }
}

function ValidaEmailsEmCopia() {
    if ($("#email").val() == "") {
        return true;
    }

    var valida = true;
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    var emails = $("#email").val().trim().split(";");

    emails.forEach(email => {
        if (valida == true && !re.test(email.trim())) {
            valida = false;
        }
    });

    if (!valida) {
        FLUIGC.toast({
            message: "E-mails em cópia inválido!",
            type: "warning"
        });
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#email").offset().top - (screen.height * 0.15)
        }, 700);
        $("#email").addClass("has-error");
    }

    return valida;
}

function InsereLinhaUsuario() {
    var html =
        "<tr>\
        <td>\
            <input class='form-control nomeUsuario' placeholder='Nome'>\
        </td>\
        <td>\
            <input class='form-control emailusuario' placeholder='E-mail'>\
        </td>\
        <td>\
            <input class='form-control telefoneUsuario' placeholder='(__) _____-____'>\
        </td>\
        <td style='text-align: center;'>\
            <button class='btn btn-danger btnRemoveLinha'>\
                <i class='flaticon flaticon-trash icon-sm' aria-hidden='true'></i>\
            </button>\
        </td>\
    </tr>";

    $("#tableUsuariosCurso>tbody").append(html);
    $("#tableUsuariosCurso>tbody").find("tr:last").find(".telefoneUsuario").mask("(99) 09999-9999");
    $("#tableUsuariosCurso>tbody").find("tr:last").find(".btnRemoveLinha").on("click", function () {
        $(this).closest("tr").remove();
    });
    $("#tableUsuariosCurso>tbody").find("tr:last").find(".nomeUsuario").on("click", function () {
        $(this).removeClass("has-error");
    });

    $("#tableUsuariosCurso>tbody").find("tr:last").find(".emailusuario").on("blur", function () {
        if (!ValidaEmail($(this).val())) {
            FLUIGC.toast({
                message: "E-mail inválido!",
                type: "warning"
            });
            $(this).val("");
        }
    });

}

function CriaListaUsuarios() {
    var json = JSON.parse($("#inputCursoUsuariosJSON").val());

    for (var i = 0; i < json.length; i++) {
        const usuario = json[i];

        if ($("#atividade").val() == 4) {
            var html =
                "<tr>\
                    <td>\
                        <input class='form-control nomeUsuario' placeholder='Nome' value='" + usuario.nome + "'>\
                    </td>\
                    <td>\
                        <input class='form-control emailusuario' placeholder='E-mail' value='" + usuario.email + "'>\
                    </td>\
                    <td>\
                        <input class='form-control telefoneUsuario' placeholder='(__) _____-____' value='" + usuario.telefone + "'>\
                    </td>\
                    <td style='text-align: center;'>\
                        <button class='btn btn-danger btnRemoveLinha'>\
                            <i class='flaticon flaticon-trash icon-sm' aria-hidden='true'></i>\
                        </button>\
                    </td>\
                </tr>";
            $("#tableUsuariosCurso>tbody").append(html);
            $("#tableUsuariosCurso>tbody").find("tr:last").find(".telefoneUsuario").mask("(99) 09999-9999");
            $("#tableUsuariosCurso>tbody").find("tr:last").find(".btnRemoveLinha").on("click", function () {
                $(this).closest("tr").remove();
            });

            $("#tableUsuariosCurso>tbody").find("tr:last").find(".nomeUsuario").on("click", function () {
                $(this).removeClass("has-error");
            });
        } else {
            var html =
                "<tr>\
                <td>\
                    <span>" + usuario.nome + "</span>\
                </td>\
                <td>\
                    <span>" + (usuario.email ? usuario.email : " - ") + "</span>\
                </td>\
                <td>\
                    <span>" + (usuario.telefone ? usuario.telefone : " - ") + "</span>\
                </td>\
            </tr>";
            $("#tableUsuariosCurso>tbody").append(html);
        }

    }
}

function BuscaResponsaveisCurso() {
    BuscaListaUsuariosSuporteCentral().then(ds => {
        var optSelected = $("#responsavelHidden").val()
        $("#responsavelCurso").html(ds);
        $("#responsavelCurso").val(optSelected);
    });
}

function BuscaListaUsuariosSuporteCentral() {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("colleagueGroup", ["colleagueId"], [
            DatasetFactory.createConstraint("groupId", "SuporteCentralDeEquipamentos", "SuporteCentralDeEquipamentos", ConstraintType.MUST)
        ], ["colleagueId"], {
            success: (ds => {
                var retorno = "<option></option>";

                for (var i = 0; i < ds.values.length; i++) {
                    var dsColleague = DatasetFactory.getDataset("colleague", ["colleagueName"], [
                        DatasetFactory.createConstraint("colleagueId", ds.values[i].colleagueId, ds.values[i].colleagueId, ConstraintType.MUST)
                    ], null);

                    retorno += "<option value='" + ds.values[i].colleagueId + "'>" + dsColleague.values[0].colleagueName + "</option>";
                }

                resolve(retorno);
            }),
            error: (error => {
                FLUIGC.toast({
                    message: 'Erro ao buscar usuarios do grupo Suporte Central',
                    type: 'warning'
                });
                console.error("Erro ao buscar usuarios do grupo Suporte Central");
                console.error(error);
                reject(error);
            })
        });
    });
}