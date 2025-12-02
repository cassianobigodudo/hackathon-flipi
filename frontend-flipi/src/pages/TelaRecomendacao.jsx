import React, { useEffect, useState, useContext } from 'react'
import './TelaRecomendacao.css' // CSS novo
import { useNavigate } from "react-router-dom"
import { GlobalContext } from '../contexts/GlobalContext'
import NavbarRealOficial from '../components/NavbarRealOficial'
import axios from 'axios'

function TelaRecomendacao() {
  const { dadosUsuarioLogado } = useContext(GlobalContext)
  const [livrosRecomendados, setLivrosRecomendados] = useState([])
  const navigate = useNavigate()

  // Busca os livros recomendados ao carregar a página
  useEffect(() => {
    const buscarRecomendacoes = async () => {
      if (!dadosUsuarioLogado?.usuario_id) return;

      try {
        const response = await axios.post('http://localhost:3000/livros/recomendados', {
          usuario_id: dadosUsuarioLogado.usuario_id
        })
        setLivrosRecomendados(response.data)
      } catch (error) {
        console.error("Erro ao buscar recomendações:", error)
      }
    }

    buscarRecomendacoes()
  }, [dadosUsuarioLogado])

  // Lógica para renderizar um Card de Livro (Reutilizável)
  const renderCardLivro = (livro) => (
    <div className="card-livro-recomendado" key={livro.livro_isbn}>
      <button 
        className="btn-livro-capa" 
        onClick={() => navigate("/telalivro", { state: { livroData: livro } })}
      >
        {livro.livro_capa ? (
          <img src={livro.livro_capa} alt={livro.livro_titulo} className="img-capa" />
        ) : (
          <div className="capa-placeholder"></div>
        )}
      </button>
      <p className="titulo-livro-rec">{livro.livro_titulo}</p>
      
      {/* Exibe a nota média para mostrar por que foi recomendado */}
      <div className="nota-recomendacao">
        <span>⭐ {parseFloat(livro.media_nota).toFixed(1)}</span>
      </div>
    </div>
  )

  // Divide os livros em duas listas para as duas páginas
  // Assumindo que cabem 6 livros por página (ajuste conforme necessário)
  const livrosEsquerda = livrosRecomendados.slice(0, 6)
  const livrosDireita = livrosRecomendados.slice(6, 12)

  return (
    <div className='container-recomendacao'>
      {/* Estrutura do Livro (Capa Fundo) */}
      <div className="capa-fundo-livro-um">
        <div className="capa-fundo-livro-dois">
          <div className="capa-fundo-livro-tres">
            
            {/* Navbar Lateral */}
            <div className="navbar-container">
              <NavbarRealOficial/>
            </div>

            {/* --- PÁGINA ESQUERDA --- */}
            <div className="folha-esquerda">
              <div className="cabecalho-pagina">
                <h2 className="titulo-secao">Escolhidos para Você</h2>
                <p className="subtitulo-secao">Baseado no que você não leu ainda</p>
              </div>

              {/* AQUI ESTÁ O MAP DA ESQUERDA */}
              <div className="grid-livros-recomendados">
                {livrosEsquerda.length > 0 ? (
                  livrosEsquerda.map((livro) => renderCardLivro(livro))
                ) : (
                  <p>Carregando recomendações...</p>
                )}
              </div>
            </div>

            {/* --- PÁGINA DIREITA --- */}
            <div className="folha-direita">
              <div className="vazio-pagina-direita"></div> {/* Espaço para alinhar com topo */}
              
              {/* AQUI ESTÁ O MAP DA DIREITA */}
              <div className="grid-livros-recomendados">
                 {livrosDireita.map((livro) => renderCardLivro(livro))}
              </div>
            </div>

            {/* Borda direita do livro */}
            <div className="vazio-direita"></div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TelaRecomendacao