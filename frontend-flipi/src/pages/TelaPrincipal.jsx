import React, { useEffect, useState, useContext } from 'react'
import './TelaPrincipal.css' // Vamos usar o CSS padronizado abaixo
import { useNavigate } from "react-router-dom"
import { GlobalContext } from '../contexts/GlobalContext'
import NavbarRealOficial from '../components/NavbarRealOficial'
import axios from 'axios'

function TelaPrincipal() {
    const { dadosUsuarioLogado } = useContext(GlobalContext)
    const [livrosPopulares, setLivrosPopulares] = useState([])
    const navigate = useNavigate()

    // 1. Busca os livros populares ao carregar a página
    useEffect(() => {
        const buscarPopulares = async () => {
            try {
                // Chama a rota que criamos no backend ordenando por nota
                const response = await axios.get('http://localhost:3000/livros/populares')
                setLivrosPopulares(response.data)
            } catch (error) {
                console.error("Erro ao buscar livros populares:", error)
            }
        }
        buscarPopulares()
    }, [])

    // 2. Divide os livros entre página Esquerda e Direita
    // Vamos supor que cabem 6 ou 8 livros por página. Ajuste o slice conforme o tamanho da sua tela.
    const livrosEsquerda = livrosPopulares.slice(0, 10) 
    const livrosDireita = livrosPopulares.slice(10, 20)

    // 3. Função para renderizar cada card (O .map vai usar isso)
    const renderCardLivro = (livro) => (
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
    )

    return (
        <div className='container-principal'>
            {/* --- ESTRUTURA DO LIVRO (FUNDO) --- */}
            <div className="capa-fundo-livro-um">
                <div className="capa-fundo-livro-dois">
                    <div className="capa-fundo-livro-tres">
                        
                        {/* 1. NAVBAR LATERAL (Marcador de página) */}
                        <div className="navbar-container">
                            <NavbarRealOficial/>
                        </div>

                        {/* 2. FOLHA ESQUERDA */}
                        <div className="folha-esquerda">
                            
                            {/* Cabeçalho da Página Esquerda */}
                            <div className="header-pagina">
                                <h2 className="titulo-destaque">🔥 Mais Populares</h2>
                                {/* Barra de Pesquisa "Fake" que leva para a tela de pesquisa real */}
                                <div className="barra-pesquisa-home">
                                    <input 
                                        type="text" 
                                        placeholder="Pesquise um livro..." 
                                        onFocus={() => navigate('/telapesquisa')} // Ao clicar, vai pra pesquisa
                                    />
                                    <img src="/icons/big-search-len.png" alt="buscar" className="icon-search"/>
                                </div>
                            </div>

                            {/* --- MAP DOS LIVROS (LADO ESQUERDO) --- */}
                            <div className="grid-livros">
                                {livrosEsquerda.length > 0 ? (
                                    livrosEsquerda.map((livro) => renderCardLivro(livro))
                                ) : (
                                    <p>Carregando catálogo...</p>
                                )}
                            </div>

                            {/* Botão de Recomendação (Destaque) */}
                            {dadosUsuarioLogado && (
                                <button className="btn-recomendacao-float" onClick={() => navigate('/recomendacoes')}>
                                    Ver recomendações para mim ➜
                                </button>
                            )}
                        </div>

                        {/* 3. FOLHA DIREITA */}
                        <div className="folha-direita">
                            <div className="vazio-topo-direita"></div> {/* Espaço para alinhar */}
                            
                            {/* --- MAP DOS LIVROS (LADO DIREITO) --- */}
                            <div className="grid-livros">
                                {livrosDireita.map((livro) => renderCardLivro(livro))}
                            </div>

                            {/* Paginação (Next Page) */}
                            <div className="rodape-direita">
                                <span className="numero-pagina">1</span>
                                <button className="btn-proxima-pagina">Próxima ➜</button>
                            </div>
                        </div>

                        {/* 4. BORDA DIREITA (Vazio) */}
                        <div className="vazio-direita"></div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default TelaPrincipal