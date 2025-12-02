import React, { useEffect, useState, useContext } from 'react'
import './TelaPrincipal.css' 
import { useNavigate } from "react-router-dom"
import { GlobalContext } from '../contexts/GlobalContext'
import NavbarRealOficial from '../components/NavbarRealOficial'
import BarraPesquisa from '../components/BarraPesquisa'
import Filtro from '../components/Filtro'
import axios from 'axios'

function TelaPrincipal() {
    
    // ESTADOS
    const [paginaAtual, setPaginaAtual] = useState(0); // Começa na página 0
    const [livrosPopulares, setLivrosPopulares] = useState([]);
    const { dadosUsuarioLogado } = useContext(GlobalContext);
    const navigate = useNavigate();

    // BUSCAR DADOS
    useEffect(() => {
        const buscarPopulares = async () => {
            try {
                // Traz 60 livros para permitir paginação
                const response = await axios.get('http://localhost:3000/livros/populares');
                setLivrosPopulares(response.data);
            } catch (error) {
                console.error("Erro ao carregar populares:", error);
            }
        };
        buscarPopulares();
    }, []);

    // --- LÓGICA DE PAGINAÇÃO (FRONTEND) ---
    const LIVROS_POR_PAGINA = 12; // Total visível (5 esq + 5 dir)
    const METADE = 6; // Divisão do livro

    // 1. Calcular índices baseados na página atual
    const indiceInicial = paginaAtual * LIVROS_POR_PAGINA;
    const indiceFinal = indiceInicial + LIVROS_POR_PAGINA;

    // 2. Fatiar o array principal
    const livrosDestaPagina = livrosPopulares.slice(indiceInicial, indiceFinal);

    // 3. Dividir entre as folhas
    const livrosEsquerda = livrosDestaPagina.slice(0, METADE);
    const livrosDireita = livrosDestaPagina.slice(METADE, LIVROS_POR_PAGINA);

    // 4. Funções de Controle
    const totalPaginas = Math.ceil(livrosPopulares.length / LIVROS_POR_PAGINA);
    
    const proximaPagina = () => {
        if (paginaAtual < totalPaginas - 1) setPaginaAtual(paginaAtual + 1);
    };

    const paginaAnterior = () => {
        if (paginaAtual > 0) setPaginaAtual(paginaAtual - 1);
    };

    // --- RENDERIZAÇÃO DO CARD (Reutilizável) ---
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
                {livro.livro_titulo.length > 30 ? livro.livro_titulo.substring(0, 30) + '...' : livro.livro_titulo}
            </p>
            <div className="estrelas-home">
                {'★'.repeat(Math.round(livro.media_nota || 0))}
                <span style={{color: '#ccc'}}>{'★'.repeat(5 - Math.round(livro.media_nota || 0))}</span>
            </div>
        </div>
    );

    return (
        <div className='container-pesquisa'> {/* Reutilizando classe CSS */}
            <div className="capa-fundo-livro-um">
                <div className="capa-fundo-livro-dois">
                    <div className="capa-fundo-livro-tres">
                        
                        <div className="navbar-container">
                            <NavbarRealOficial/>
                        </div>

                        {/* --- FOLHA ESQUERDA --- */}
                        <div className="folha-esquerda">
                            {/* Passamos setPaginaAtual para a barra, caso queira resetar ao pesquisar */}
                            <BarraPesquisa setPaginaAtual={setPaginaAtual}/>

                            {/* GRID ESQUERDA */}
                            <div className="grid-livros-conteudo">
                                {livrosEsquerda.length > 0 ? (
                                    livrosEsquerda.map(renderCard)
                                ) : (
                                    <p className="aviso-carregando">Carregando estante...</p>
                                )}
                            </div>
                            
                            {/* RODAPÉ ESQUERDO (Botão Anterior) */}
                            <div className="bottom-pagina-container" style={{justifyContent: 'flex-start'}}>
                                {paginaAtual > 0 && (
                                    <button className="btn-navegacao" onClick={paginaAnterior}>
                                        🡠 Anterior
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- FOLHA DIREITA --- */}
                        <div className="folha-direita">
                            <div className="vazio-pagina-direita-extra"></div>
                            
                            {/* GRID DIREITA */}
                            <div className="grid-livros-conteudo">
                                {livrosDireita.map(renderCard)}
                            </div>
                            
                            {/* RODAPÉ DIREITO (Botão Próximo) */}
                            <div className="bottom-pagina-container-direita" style={{justifyContent: 'flex-end'}}>
                                {paginaAtual < totalPaginas - 1 && (
                                    <button className="btn-navegacao" onClick={proximaPagina}>
                                        Próxima 🡢
                                    </button>
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

export default TelaPrincipal