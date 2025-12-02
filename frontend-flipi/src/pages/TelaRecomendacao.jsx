import React, { useEffect, useState, useContext } from 'react'
import './TelaPrincipal.css' // Importando CSS da Home para manter o visual dos cards
import { useNavigate } from "react-router-dom"
import { GlobalContext } from '../contexts/GlobalContext'
import NavbarRealOficial from '../components/NavbarRealOficial'
import BarraPesquisa from '../components/BarraPesquisa'
import axios from 'axios'

function TelaRecomendacao() {
    
    const { dadosUsuarioLogado, usuarioLogado } = useContext(GlobalContext);
    const [livrosRecomendados, setLivrosRecomendados] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(0);
    const [tipoRecomendacao, setTipoRecomendacao] = useState('carregando');
    const navigate = useNavigate();

    // 1. LÓGICA DE BUSCA
    useEffect(() => {
        const buscarRecomendacoes = async () => {
            
            // Tenta pegar do contexto, se falhar, pega do localStorage (Plano B)
            let idParaBuscar = dadosUsuarioLogado?.usuario_id;
            if (!idParaBuscar) {
                idParaBuscar = localStorage.getItem("posicaoUsuarioID") || localStorage.getItem("idUsuarioLogado");
            }

            console.log("Tentando buscar com ID:", idParaBuscar); // <--- OLHE ISSO NO CONSOLE

            if (!idParaBuscar) {
                console.warn("Sem ID de usuário. Abortando busca.");
                return;
            }

            try {
                const response = await axios.post('http://localhost:3000/livros/recomendacao-inteligente', {
                    usuario_id: idParaBuscar // Usa o ID garantido
                });
                
                console.log("Resposta do Server:", response.data);
                setLivrosRecomendados(response.data.dados || []);
                setTipoRecomendacao(response.data.tipo);
            } catch (error) {
                console.error("Erro no front:", error);
            }
        };
        
        // Execute mesmo se usuarioLogado for falso no primeiro render, para tentar recuperar do storage
        buscarRecomendacoes();
    }, [dadosUsuarioLogado, usuarioLogado]);  


    // 2. LÓGICA DE PAGINAÇÃO (Igual da Home)
    const LIVROS_POR_PAGINA = 10; 
    const METADE = 5;

    const indiceInicial = paginaAtual * LIVROS_POR_PAGINA;
    const indiceFinal = indiceInicial + LIVROS_POR_PAGINA;
    const livrosDestaPagina = livrosRecomendados.slice(indiceInicial, indiceFinal);
    
    const livrosEsquerda = livrosDestaPagina.slice(0, METADE);
    const livrosDireita = livrosDestaPagina.slice(METADE, LIVROS_POR_PAGINA);

    const totalPaginas = Math.ceil(livrosRecomendados.length / LIVROS_POR_PAGINA);

    const proximaPagina = () => {
        if (paginaAtual < totalPaginas - 1) setPaginaAtual(paginaAtual + 1);
    };

    const paginaAnterior = () => {
        if (paginaAtual > 0) setPaginaAtual(paginaAtual - 1);
    };

    // 3. RENDERIZAÇÃO DO CARD (Igual da Home)
    const renderCard = (livro) => (
        <div className="card-livro-home" key={livro.livro_isbn}>
            <button 
                className="btn-capa-livro" 
                onClick={() => navigate("/telalivro", { state: { livroData: livro } })}
            >
                {livro.livro_capa ? (
                    <img src={livro.livro_capa} alt={livro.livro_titulo} className="img-capa-home" />
                ) : (
                    <div className="placeholder-capa"></div>
                )}
            </button>
            <p className="titulo-livro-home">
                {livro.livro_titulo.length > 25 ? livro.livro_titulo.substring(0, 25) + '...' : livro.livro_titulo}
            </p>
            <div className="estrelas-home">
                {'★'.repeat(Math.round(livro.media_nota || 0))}
                <span style={{color: '#ccc'}}>{'★'.repeat(5 - Math.round(livro.media_nota || 0))}</span>
            </div>
        </div>
    );

    return (
        <div className='container-pesquisa'>
            <div className="capa-fundo-livro-um">
                <div className="capa-fundo-livro-dois">
                    <div className="capa-fundo-livro-tres">
                        
                        <div className="navbar-container">
                            <NavbarRealOficial/>
                        </div>

                        {/* --- FOLHA ESQUERDA --- */}
                        <div className="folha-esquerda">
                            
                            <div className="header-populares" style={{textAlign: 'center', marginBottom: '20px'}}>
                                <h2 style={{fontSize: '1.8rem', color: '#c85b34', margin: 0}}>
                                    {tipoRecomendacao === 'personalizado' ? "✨ Escolhidos para Você" : "🔥 Top Leituras"}
                                </h2>
                                <p style={{fontSize: '0.8rem', color: '#666'}}>
                                    {tipoRecomendacao === 'personalizado' ? "Baseado nos seus autores e gêneros favoritos." : "Explore o que está em alta na comunidade."}
                                </p>
                            </div>

                            {/* GRID ESQUERDA */}
                            <div className="grid-livros-conteudo">
                                {livrosEsquerda.length > 0 ? (
                                    livrosEsquerda.map(renderCard)
                                ) : (
                                    <p className="aviso-carregando">Buscando melhores opções...</p>
                                )}
                            </div>
                            
                            <div className="bottom-pagina-container" style={{justifyContent: 'flex-start'}}>
                                {paginaAtual > 0 && (
                                    <button className="btn-navegacao" onClick={paginaAnterior}>🡠 Anterior</button>
                                )}
                            </div>
                        </div>

                        {/* --- FOLHA DIREITA --- */}
                        <div className="folha-direita">
                            <div className="vazio-topo-direita" style={{height: '80px'}}></div>
                            
                            {/* GRID DIREITA */}
                            <div className="grid-livros-conteudo">
                                {livrosDireita.map(renderCard)}
                            </div>
                            
                            <div className="bottom-pagina-container" style={{justifyContent: 'flex-end'}}>
                                {paginaAtual < totalPaginas - 1 && (
                                    <button className="btn-navegacao" onClick={proximaPagina}>Próxima 🡢</button>
                                )}
                            </div>
                        </div>

                        <div className="vazio-direita"></div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default TelaRecomendacao