class Calendario extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            calendario: [
                this.getDays("09:00"), //09:00
                this.getDays("10:00"), //10:00
                this.getDays("11:00"), //11:00
                this.getDays("13:00"), //13:00
                this.getDays("14:00"), //14:00
                this.getDays("15:00"), //15:00
                this.getDays("16:00")
            ],
            agendado: {
                dia: "",
                horario: ""
            },
            curso: this.props.curso,
            obra: this.props.obra
        };
        this.atualizaCalendario = this.atualizaCalendario.bind(this);

        this.getData();

    }

    componentDidMount() {
        const sliders = document.querySelectorAll("#scroll");
        const preventClick = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
        };
        let isDown = false;
        var isDragged = false;
        let startX;
        let scrollLeft;

        sliders.forEach((slider) => {
            slider.addEventListener("mousedown", (e) => {
                isDown = true;
                slider.classList.add("active");
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });

            slider.addEventListener("mouseleave", () => {
                isDown = false;
                slider.classList.remove("active");
            });

            slider.addEventListener("mouseup", (e) => {
                isDown = false;
                const elements = document.getElementsByClassName("cell");
                if (isDragged) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].addEventListener("click", preventClick);
                    }
                } else {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].removeEventListener("click", preventClick);
                    }
                }
                slider.classList.remove("active");
                isDragged = false;
            });

            slider.addEventListener("mousemove", (e) => {
                if (!isDown) return;
                isDragged = true;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = x - startX;
                slider.scrollLeft = scrollLeft - walk;
            });

            document.getElementsByClassName("cell").ondragstart = function () {
                console.log("Drag start");
            };

            FLUIGC.popover(".infoCalendario", {
                trigger: "hover",
                placement: "left",
                html: true,
                content:
                    "<div>\
                <div style='display: inline-flex; vertical-align: middle;'>\
                    <div style='width: 20px; height: 20px; background-color: #e3b420; margin-right: 8px;'></div>\
                    <div> - Esta Solicitação</div>\
                </div>\
                <div style='display: inline-flex; vertical-align: middle;'>\
                    <div style='width: 20px; height: 20px; background-color: #1eaad9; margin-right: 8px;'></div>\
                    <div> - Aguardando Confirmação</div>\
                </div>\
                <div style='display: inline-flex; vertical-align: middle; margin-right: 8px;'>\
                    <div style='width: 20px; height: 20px; background-color: #1ab83f; margin-right: 8px;'></div>\
                    <div> - Agendado</div>\
                </div>\
            </div>"
            });
        });
    }

    handleClick(Dia, Horario) {
        var calendario = this.state.calendario.slice();

        if (!calendario[Horario][Dia].curso && !calendario[Horario][Dia].solicitante && !calendario[Horario][Dia].obra && $("#categoria").val() == "Agendamento de Curso / Orientação") {
            this.SelecionaDataEHorario(Dia, Horario);
        } else if (calendario[Horario][Dia].curso && calendario[Horario][Dia].solicitante && calendario[Horario][Dia].obra) {
            this.MostraInfosAgendamento(Dia, Horario);
        }
    }

    MostraInfosAgendamento(Dia, Horario){
        var calendario = this.state.calendario.slice();

        if (this.state.agendado.dia == Dia && this.state.agendado.horario == Horario && ($("#atividade").val() == 0 || $("#atividade").val() == 4)) {
            this.state.calendario[Horario][Dia].usuarios = MontaListaDeUsuariosQueParticiparaoDoCurso();
        }

        var myModal = FLUIGC.modal(
            {
                title: calendario[Horario][Dia].curso + " - " + calendario[Horario][Dia].dia + " " + calendario[Horario][Dia].horario,
                content: "<div id='rootModal'></div>",
                size: "full",
                id: "fluig-modal",
                actions: [
                    {
                        label: "Fechar",
                        autoClose: true
                    }
                ]
            },
            function (err, data) {
                if (err) {
                } else {
                    modalRoot = ReactDOM.createRoot(document.querySelector("#rootModal"));
                    modalRoot.render(React.createElement(ModalAgendamento, { Agendamento: calendario[Horario][Dia] }));
                }
            }
        );
    }

    SelecionaDataEHorario(Dia, Horario) {
        var calendario = this.state.calendario.slice();

        //Se a Data e Horario selecionados não tem agendamento e também a Categoria tem que ser Agendamento
        if ($("#atividade").val() != 0 && $("#atividade").val() != 4) {
            //Caso não esteja na atividade que seleciona a Data e Horário nao acontece nada
            return;
        }
        else if (!this.DataEHorarioRespeita24HorasAntesDoChamado(Dia, Horario)) {
            FLUIGC.toast({
                message: "Necessário agendar com 24h de antecedência!",
                type: "warning"
            });
        }
        else if (this.validaPreenchimentoParaSelecionarAgendamento()) {
            calendario = this.RemoveAgendamentoDaDataAnteriorCasoSejaSelecionadaOutraData(calendario,Dia, Horario);
            calendario = this.AgendaCursoNaDataEHorarioDentroDoState(calendario, Dia, Horario);
            console.log(calendario)
            var agendado = {
                dia: Dia,
                horario: Horario
            };

            this.setState({
                calendario: calendario,
                agendado: agendado
            });

            $("#inputCursoDiaAgendado").val(FormataDataSQL(calendario[Horario][Dia].dia));
            $("#inputCursoHorarioAgendado").val(calendario[Horario][Dia].horario);
            $("#spanHeaderAgendamento").text(calendario[Horario][Dia].dia + " - " + calendario[Horario][Dia].horario);
        }
    }

    DataEHorarioRespeita24HorasAntesDoChamado(Dia, Horario) {
        if (Dia < 1) {
            //Se dia for menor que 1 significa que o Dia selecionado é hoje, portanto não respeita 24h de antecedencia
            return false;
        }
        else if (Dia == 1) {
            //Se dia for igual a 1 significa que o Dia selecionado é amanhã, portanto é necessario verificar o horario
            var calendario = this.state.calendario.slice();
            var now = new Date();
            var horaNow = now.getHours();
            var minutoNow = now.getMinutes();
            var [HorarioSelecionado, MinutosSelecionado] = calendario[Horario][Dia].horario.split(":");

            if (HorarioSelecionado < horaNow || (HorarioSelecionado == horaNow && MinutosSelecionado < minutoNow)) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    }

    AgendaCursoNaDataEHorarioDentroDoState(calendario, Dia, Horario) {
        var curso = $("#curso").val();
        var obra = $("#obra").val();

        calendario[Horario][Dia].curso = curso;
        calendario[Horario][Dia].solicitante = BuscaNomeUsuario($("#solicitante").val());
        calendario[Horario][Dia].obra = obra;
        calendario[Horario][Dia].status = 3;
        calendario[Horario][Dia].usuarios = this.MontaListaDeUsuariosQueParticiparaoDoCurso();

        return calendario;
    }

    RemoveAgendamentoDaDataAnteriorCasoSejaSelecionadaOutraData(calendario) {
        if (this.state.agendado.dia != "") {
            calendario[this.state.agendado.horario][this.state.agendado.dia].curso = "";
            calendario[this.state.agendado.horario][this.state.agendado.dia].solicitante = "";
            calendario[this.state.agendado.horario][this.state.agendado.dia].obra = "";
            calendario[this.state.agendado.horario][this.state.agendado.dia].status = "";
        }
        return calendario;
    }

    MontaListaDeUsuariosQueParticiparaoDoCurso() {
        var usuarios = [];
        $("#tableUsuariosCurso>tbody")
            .find("tr")
            .each(function () {
                usuarios.push({
                    nome: $(this).find(".nomeUsuario").val(),
                    email: $(this).find(".emailusuario").val(),
                    telefone: $(this).find(".telefoneUsuario").val()
                });
            });
        return usuarios;
    }

    getDays(horario) {
        //Retorna uma lista de objetos contendo todos os próximos 30 dias removendo finais de semana
        var date = new Date();
        var weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"];

        var dias = [];
        for (var i = 0; i < 32; i++) {
            //Busca os próximos 32 dias removendo finais de semana
            if (date.getDay() != 0 && date.getDay() != 6) {
                var dia = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + "/" + (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "/" + date.getFullYear();
                dias.push({
                    dia: dia,
                    diaSemana: weekDays[date.getDay()],
                    horario: horario,
                    agendamento: {}
                });
            }
            date.setDate(date.getDate() + 1);
        }

        return dias;
    }

    getData() {
        var dia = new Date();
        dia = dia.getFullYear() + "-" + (dia.getMonth() + 1) + "-" + dia.getDate();
        DatasetFactory.getDataset("AgendamentoCursosCentral", null, [DatasetFactory.createConstraint("operacao", "Select", "Select", ConstraintType.MUST), DatasetFactory.createConstraint("dia", dia, dia, ConstraintType.MUST), DatasetFactory.createConstraint("WKNumProces", $("#numProces").val() != "" ? $("#numProces").val() : 0, $("#numProces").val() != "" ? $("#numProces").val() : 0, ConstraintType.MUST)], null, {
            success: (ds, atualizacalendario = this.atualizaCalendario) => {
                atualizacalendario(ds);
            }
        });
    }

    validaPreenchimentoParaSelecionarAgendamento() {
        var valida = true;

        if ($("#curso").val() == "" || $("#curso").val() == null) {
            if (valida) {
                FLUIGC.toast({
                    message: "Curso não selecionado!",
                    type: "warning"
                });
                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $("#curso").offset().top - screen.height * 0.15
                    },
                    700
                );
                valida = false;
            }
            $("#curso").addClass("has-error");
        } else if ($("#obra").val() == "" || $("#obra").val() == null) {
            if (valida) {
                FLUIGC.toast({
                    message: "Obra não selecionada!",
                    type: "warning"
                });
                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $("#obra").offset().top - screen.height * 0.15
                    },
                    700
                );
                valida = false;
            }

            $("#obra").addClass("has-error");
        } else if ($("#tableUsuariosCurso>tbody").find("tr").length < 1) {
            if (valida) {
                FLUIGC.toast({
                    message: "Nenhum usuário informado!",
                    type: "warning"
                });

                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $("#tableUsuariosCurso").offset().top - screen.height * 0.15
                    },
                    700
                );
                valida = false;
            }
        } else {
            var valida2 = true;
            $("#tableUsuariosCurso>tbody")
                .find("tr")
                .each(function () {
                    if ($(this).find(".nomeUsuario").val() == "") {
                        if (valida2) {
                            FLUIGC.toast({
                                message: "Nome do usuário não informado!",
                                type: "warning"
                            });
                            valida = false;
                            valida2 = false;

                            $([document.documentElement, document.body]).animate(
                                {
                                    scrollTop: $(this).offset().top - screen.height * 0.15
                                },
                                700
                            );
                        }
                        $(this).find(".nomeUsuario").addClass("has-error");
                    }
                });
        }

        return valida;
    }

    atualizaCalendario(agendamentos) {
        var horarios = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
        var calendario = this.state.calendario.slice();

        agendamentos.values.forEach((agendamento) => {
            var index = horarios.indexOf(agendamento.HORARIO);
            var horario = calendario[index];
            var found = horario.find((element) => element.dia == FormataData(agendamento.DIA));

            if (found) {
                console.log(found);
                found.curso = agendamento.CURSO;
                found.solicitante = agendamento.SOLICITANTE;
                found.status = agendamento.FLAGSOLICITACAO == "true" ? 3 : agendamento.STATUS;
                found.obra = agendamento.OBRA;
                found.usuarios = JSON.parse(agendamento.USUARIOS);
                found.solicitacao = agendamento.SOLICITACAO;
                found.responsavel = agendamento.RESPONSAVEL;
            }

            if (agendamento.FLAGSOLICITACAO == "true") {
                $("#spanHeaderAgendamento").text(agendamento.DIA.split("-").reverse().join("/") + " - " + agendamento.HORARIO);

                var dias = this.getDays("00:00");
                console.log(dias);

                var i = dias.findIndex((e) => e.dia == agendamento.DIA.split("-").reverse().join("/"));
                console.log(index);
                console.log(i);

                this.setState({
                    agendado: {
                        dia: i,
                        horario: index
                    }
                });
            }
        });

        this.setState({
            calendario: calendario
        });
    }

    render() {
        console.log("Render");

        if (this.props.curso != "" && this.props.obra != "" && (this.state.agendado.horario != "" || parseInt(this.state.agendado.horario) == 0) && (this.state.agendado.dia != "" || parseInt(this.state.agendado.dia) == 0)) {
            if (this.state.calendario[this.state.agendado.horario][this.state.agendado.dia].curso != this.props.curso || this.state.calendario[this.state.agendado.horario][this.state.agendado.dia].obra != this.props.obra) {
                var calendario = this.state.calendario.slice();
                calendario[this.state.agendado.horario][this.state.agendado.dia].curso = this.props.curso;
                calendario[this.state.agendado.horario][this.state.agendado.dia].obra = this.props.obra;
                this.setState({
                    calendario: calendario
                });
            }
        }

        return (
            <div>
                <div style={{ backgroundColor: "whitesmoke", padding: "10px", border: "1px solid lightgray" }}>
                    <b style={{ padding: "0px", width: "fit-content", marginRight: "30px", fontSize: "18px" }}>Agendamento</b>
                    <span id="spanHeaderAgendamento"></span>
                    <i style={{ float: "right" }} className={"flaticon flaticon-info icon-sm infoCalendario"}></i>
                </div>
                <div style={{ overflowX: "auto" }} id={"scroll"}>
                    <table className="table table-bordered" style={{ border: "0px" }}>
                        <CalendarioTHead dias={this.getDays("00:00")} />
                        <CalendarioTBody
                            calendario={this.state.calendario}
                            onClick={(i, j) => {
                                this.handleClick(i, j);
                            }}
                        />
                    </table>
                </div>
            </div>
        );
    }
}

class CalendarioTHead extends React.Component {
    render() {
        var headers = [];
        this.props.dias.forEach((dia, i) => {
            headers.push(
                <th key={i} style={{ textAlign: "center", minWidth: "18vw" }}>
                    {dia.dia}
                    <br />
                    {dia.diaSemana}
                </th>
            );
        });

        return (
            <thead>
                {/*<tr>
                    <th colSpan={25}>
                        <span style={{ position: "sticky", left: "0", zIndex: "1", backgroundColor: "whitesmoke" }}>Agendamento</span>
                    </th>
                </tr>*/}
                <tr>
                    <th style={{ position: "sticky", left: "0", zIndex: "1", backgroundColor: "whitesmoke", textAlign: "center" }}>Horários</th>
                    {headers}
                </tr>
            </thead>
        );
    }
}

class CalendarioTBody extends React.Component {
    render() {
        var calendario = this.props.calendario;
        var rows = [];
        calendario.forEach((row, j) => {
            var tr = [];
            row.forEach((column, i) => {
                var curso = column.curso;
                var tipoCurso = "";
                if (curso) {
                    tipoCurso = curso.split(" - ")[0];
                    curso = curso.split(" - ")[1];
                }

                tr.push(
                    <td key={j + "" + i} onClick={() => this.props.onClick(i, j)} className={column.status == 2 ? "success" : (column.status == 1 ? "info" : column.status == 3 ? "warning" : "") + " cell"} style={{ color: "white", maxWidth: "18vw", overflow: "hidden" }}>
                        <span style={{ whiteSpace: "nowrap" }}>{curso}</span>
                        <br />
                        <span style={{ whiteSpace: "nowrap" }}>{column.obra}</span>
                    </td>
                );
            });
            rows.push(
                <tr key={j}>
                    <td style={{ position: "sticky", left: "0", zIndex: "1", backgroundColor: "whitesmoke", textAlign: "center", verticalAlign: "middle" }}>{row[0].horario}</td>
                    {tr}
                </tr>
            );
        });

        return <tbody>{rows}</tbody>;
    }
}

class ModalAgendamento extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            motivoCancelamento: ""
        };
    }

    handleClickCancelamento() {
        console.log("Motivo: " + this.state.motivoCancelamento + " - " + this.props.Agendamento.solicitacao);
        if (this.state.motivoCancelamento == "") {
            FLUIGC.toast({
                message: "Motivo do cancelamento não informado!",
                type: "warning"
            });
        } else {
            $("#solucao").val(this.state.motivoCancelamento);
            $("#solicitacaoCancelamentoCurso").val(this.props.Agendamento.solicitacao);
            $("#workflowActions > button:first-child", window.parent.document).click();
        }
    }

    render() {
        var htmlUsuarios = [];
        console.log(this.props.Agendamento);
        this.props.Agendamento.usuarios.forEach((usuario, i) => {
            htmlUsuarios.push(
                <div key={i} className="row">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-body" style={{ backgroundColor: "whitesmoke" }}>
                                <h3 className="card-title">{usuario.nome}</h3>
                                <div style={{ width: "fit-content", marginRight: "10px" }}>
                                    <b>E-mail: </b>
                                    <span>{usuario.email ? usuario.email : " - "}</span>
                                </div>
                                <div style={{ width: "fit-content", marginRight: "10px" }}>
                                    <b>Telefone: </b>
                                    <span>{usuario.telefone ? usuario.telefone : " - "}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <br />
                </div>
            );
        });
        return (
            <div>
                <b>Obra: </b>
                <span>{this.props.Agendamento.obra}</span>
                <br />
                <b>Solicitante: </b>
                <span>{this.props.Agendamento.solicitante}</span>

                {this.props.Agendamento.responsavel && (
                    <div>
                        <b>Responsável: </b>
                        <span>{this.props.Agendamento.responsavel}</span>
                    </div>
                )}

                {this.props.Agendamento.solicitacao && (
                    <div>
                        <b>Solicitação: </b>
                        <a href={"http://fluig.castilho.com.br:1010/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + this.props.Agendamento.solicitacao} target={"_blank"}>
                            Nº {this.props.Agendamento.solicitacao}
                        </a>
                    </div>
                )}
                <br />
                <br />
                <div className="panel panel-primary" style={{ marginBottom: "0px" }}>
                    <div className="panel-heading">
                        <h3 className="panel-title">Usuários {"(" + this.props.Agendamento.usuarios.length + ")"}</h3>
                    </div>
                    <div className="panel-body">
                        <div style={{ height: "30vh", overflowY: "scroll", overflowX: "hidden" }}>{htmlUsuarios}</div>
                    </div>
                </div>

                {$("#categoria").val() == "Cancelamento de Curso / Orientação" && (
                    <div>
                        <br />
                        <label style={{ width: "100%" }}>
                            Motivo Cancelamento:
                            <textarea name="motivoCancelamentoCurso" className="form-control" value={this.state.motivoCancelamento} onChange={(e) => this.setState({ motivoCancelamento: e.target.value })} rows="4" />
                        </label>
                        <br />
                        <button className="btn btn-danger" style={{ float: "right" }} onClick={() => this.handleClickCancelamento()}>
                            Cancelar
                        </button>
                        <br />
                    </div>
                )}
            </div>
        );
    }
}
