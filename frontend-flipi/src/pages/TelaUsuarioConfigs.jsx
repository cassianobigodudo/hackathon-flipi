import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import "./TelaUsuarioConfigs.css"
import { GlobalContext } from '../contexts/GlobalContext'
import ResenhasConfigs from "../components/ResenhasConfigs"
import NavbarVertical from "../components/NavbarVertical"
import axios from "axios"
import ListasLivros from "../components/ListasLivros"

function TelaUsuarioConfigs() {

  // 1. HOOKS DE CONTEXTO E NAVEGAÇÃO (SEMPRE NO TOPO)
  const {
    dadosUsuarioLogado,
    setDadosUsuarioLogado,
    setUsuarioLogado,
    setPosicaoUsuarioID,
    setIdUsuarioLogado,
    vetorObjetosUsuarios,
    setVetorObjetosUsuarios,
    usuarioLogado
  } = useContext(GlobalContext)

  const navigate = useNavigate()

  // 2. STATES DE EDIÇÃO (SEMPRE NO TOPO)
  const [editarNome, setEditarNome] = useState('')
  const [editarEmail, setEditarEmail] = useState('')
  const [editarDescricao, setEditarDescricao] = useState('')
  const [editarFoto, setEditarFoto] = useState('')
  const [editarSenha, setEditarSenha] = useState('')
  const [mostrarComponente, setMostrarComponente] = useState('resenhas');
  
  // 3. STATES DE GAMIFICAÇÃO (MOVIDO PARA O TOPO PARA NÃO QUEBRAR)
  const [resenhasUsuario, setResenhasUsuario] = useState([]);
  const [pontuacao, setPontuacao] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [progresso, setProgresso] = useState(0);

  // 4. USE EFFECTS (LÓGICA)

  // Debug
  useEffect(() => {
      // console.log("--- DEBUG ---");
      // console.log("Dados:", dadosUsuarioLogado);
  }, [dadosUsuarioLogado]);

  // Buscar Usuários
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get('http://localhost:3000/usuario');
        setVetorObjetosUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };
    fetchUsuarios();
  }, [setVetorObjetosUsuarios]);

  // Recuperação de Sessão (Importante para o F5)
  useEffect(() => {
    if (usuarioLogado && !dadosUsuarioLogado && vetorObjetosUsuarios.length > 0) {
        const storedId = Number(localStorage.getItem("posicaoUsuarioID")) || Number(localStorage.getItem("idUsuarioLogado"));
        if (storedId) {
            const usuarioEncontrado = vetorObjetosUsuarios.find(u => u.usuario_id === storedId);
            if (usuarioEncontrado) {
                setDadosUsuarioLogado(usuarioEncontrado);
                setPosicaoUsuarioID(storedId);
            }
        }
    }
  }, [usuarioLogado, dadosUsuarioLogado, vetorObjetosUsuarios]);

  // Segurança de Login
  useEffect(() => {
    if (usuarioLogado === false) {
      navigate('/')
    }
  }, [usuarioLogado, navigate])

  // Lógica Gamificação (Busca)
  useEffect(() => {
    const fetchResenhasUsuario = async () => {
      // Se não tiver usuário, não faz nada, mas o hook existe!
      if (!dadosUsuarioLogado?.usuario_id) return; 
      try {
        const response = await axios.get(`http://localhost:3000/resenha?usuario_id=${dadosUsuarioLogado.usuario_id}`);
        const minhas = response.data.filter(r => r.usuario_id === dadosUsuarioLogado.usuario_id);
        setResenhasUsuario(minhas);
      } catch (error) {
        setResenhasUsuario([]);
      }
    };
    fetchResenhasUsuario();
  }, [dadosUsuarioLogado]);

  // Lógica Gamificação (Cálculo)
  useEffect(() => {
    const novaPontuacao = resenhasUsuario.length * 10;
    const novoNivel = Math.floor(novaPontuacao / 100) + 1;
    const pontosProximoNivel = 100;
    const novoProgresso = ((novaPontuacao % pontosProximoNivel) / pontosProximoNivel) * 100;

    setPontuacao(novaPontuacao);
    setNivel(novoNivel);
    setProgresso(novoProgresso);
  }, [resenhasUsuario]);


  // 5. FUNÇÕES DE CRUD (NÃO SÃO HOOKS, PODEM FICAR AQUI)
  const fetchClientes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/usuario');
      setVetorObjetosUsuarios(response.data);
    } catch (error) { console.error(error); }
  };

  const editarDados = async (campo) => {
    if (!dadosUsuarioLogado) return;

    let novoValor;
    switch (campo) {
      case "nome":
        if (!editarNome) return alert("Nome inválido");
        novoValor = { usuario_nome: editarNome };
        break;
      case "email":
        if (!editarEmail) return alert("E-mail inválido");
        novoValor = { usuario_email: editarEmail };
        break;
      case "foto":
        if (!editarFoto) return alert("URL inválida");
        novoValor = { url_foto: editarFoto };
        break;
      case "senha":
        if (!editarSenha) return alert("Senha inválida");
        novoValor = { usuario_senha: editarSenha };
        break;
      case "descricao":
        novoValor = { usuario_descricao: editarDescricao };
        break;
      default:
        return;
    }

    const dadosAtualizados = { ...dadosUsuarioLogado, ...novoValor };

    try {
      const response = await axios.put(`http://localhost:3000/usuario/${dadosUsuarioLogado.usuario_id}`, dadosAtualizados);
      if (response.status === 200) {
        setDadosUsuarioLogado(dadosAtualizados);
        fetchClientes();
        alert("Dados atualizados com sucesso!");
        setEditarNome(""); setEditarEmail(""); setEditarFoto(""); setEditarSenha(""); setEditarDescricao("");
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar dados.");
    }
  };

  const salvarAlteracoes = async () => {
    if(!dadosUsuarioLogado) return;
    if (editarNome && editarNome !== dadosUsuarioLogado.usuario_nome) await editarDados("nome");
    if (editarEmail && editarEmail !== dadosUsuarioLogado.usuario_email) await editarDados("email");
    if (editarFoto && editarFoto !== dadosUsuarioLogado.url_foto) await editarDados("foto");
    if (editarSenha && editarSenha !== dadosUsuarioLogado.usuario_senha) await editarDados("senha");
    if (editarDescricao && editarDescricao !== dadosUsuarioLogado.usuario_descricao) await editarDados("descricao");
  };

  function deslogarUsuario() {
    localStorage.clear();
    setUsuarioLogado(false);
    setPosicaoUsuarioID(null);
    setDadosUsuarioLogado(null);
    setIdUsuarioLogado(null);
    navigate('/');
  }

  const deletarUsuario = async () => {
    if (!dadosUsuarioLogado) return;
    let promptApagarConta = prompt('ATENÇÃO! Insira a sua senha para confirmar a exclusão:')
    if (promptApagarConta === dadosUsuarioLogado.usuario_senha) {
      try {
        await axios.delete(`http://localhost:3000/usuario/${dadosUsuarioLogado.usuario_id}`);
        alert(`Conta deletada com sucesso.`);
        deslogarUsuario();
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    } else {
      alert(`Senha incorreta.`);
    }
  }

  // 6. RETURN COM PROTEÇÃO (AGORA SIM, PODE TER RETURN)
  // Como todos os hooks já foram lidos lá em cima, esse return aqui não quebra o React.
  
  if (!dadosUsuarioLogado && usuarioLogado) {
      return (
          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fdfaf3'}}>
              <h2 style={{fontFamily: 'fonte-projeto', fontSize: '30px', color: '#c85b34'}}>Carregando perfil...</h2>
              <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{marginTop: '20px', padding: '10px', border: '1px solid #c85b34', background: 'transparent', cursor: 'pointer'}}>
                Sair (Travado)
              </button>
          </div>
      );
  }

  if (usuarioLogado === false) return null;

  return (
    <div className="usuarioConfigs-container">

      <div className="usuarioConfigs-div-esquerda"></div>

      <div className="usuarioConfigs-body">
        <div className="usuarioConfigs-body-cima"></div>

        <div className="usuarioConfigs-body-meio">
          <div className="usuarioConfigs-body-meio-papel">

            <div className="usuarioConfigs-body-meio-papel-conta">

              <div className="usuarioConfigs-bmpc-titulo">
                <img
                  src={editarFoto || dadosUsuarioLogado?.url_foto || "https://via.placeholder.com/150"}
                  alt="Foto do usuário"
                  className="img-usuario"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150" }}
                />
                <div className="usuarioNomeDescricao">
                  <h2>{dadosUsuarioLogado?.usuario_nome}</h2>
                  <div className="campo-descricao">
                    <textarea
                      className="descricao"
                      value={editarDescricao}
                      onChange={(e) => setEditarDescricao(e.target.value)}
                      placeholder={dadosUsuarioLogado?.usuario_descricao || "Escreva algo sobre você..."}
                      onBlur={() => editarDados("descricao")}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <div className="usuarioConfigs-bmpc-infos">
                <div className="teste">
                    {/* INPUTS */}
                    <div className="campo-editavel"><input type="text" className="input" value={editarNome} onChange={(e) => setEditarNome(e.target.value)} placeholder={dadosUsuarioLogado?.usuario_nome} /></div>
                    <div className="campo-editavel"><input type="email" className="input" value={editarEmail} onChange={(e) => setEditarEmail(e.target.value)} placeholder={dadosUsuarioLogado?.usuario_email} /></div>
                    <div className="campo-editavel"><input type="text" className="input" value={editarFoto} onChange={(e) => setEditarFoto(e.target.value)} placeholder="URL da Foto" /></div>
                    <div className="campo-editavel"><input type="password" className="input" value={editarSenha} onChange={(e) => setEditarSenha(e.target.value)} placeholder="Nova Senha" /></div>
                    <button className="btn" style={{marginTop: '10px'}} onClick={salvarAlteracoes}>Salvar Alterações</button>
                </div>
                
                <div className="teste2">
                  <h3 className="nivel-titulo">Nível</h3>
                  <div className="nivel-numero">{nivel}</div>
                  <p>Pontuação: {pontuacao} XP</p>
                  <div className="progresso">
                    <div className="preenchido" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
               </div>

               <div className="deslogar-deletar">
                <button className="btn" onClick={deslogarUsuario} >Deslogar</button>
                <button className="btn btn-delete" onClick={deletarUsuario}>Deletar conta</button>
               </div>

                <div className="listas-btn">
                  <button className={`btn-secao ${mostrarComponente === 'listas' ? 'active' : ''}`} onClick={() => setMostrarComponente('listas')}>Listas</button>
                  <button className={`btn-secao ${mostrarComponente === 'resenhas' ? 'active' : ''}`} onClick={() => setMostrarComponente('resenhas')}>Resenhas</button>
              </div>
            </div>

            <div className="usuarioConfigs-body-meio-papel-resenhas">
              {/* COMPONENTES FILHOS (RESENHAS/LISTAS) */}
              { mostrarComponente === 'resenhas' && dadosUsuarioLogado && <ResenhasConfigs usuarioId={dadosUsuarioLogado.usuario_id} />}
              { mostrarComponente === 'listas' && dadosUsuarioLogado && <ListasLivros usuarioId={dadosUsuarioLogado.usuario_id} />}
            </div>
          </div>
        </div>

        <div className="usuarioConfigs-body-baixo"></div>
      </div>

      <div className="usuarioConfigs-navbar-container">
        <NavbarVertical />
      </div>
    </div>
  )
}

export default TelaUsuarioConfigs;