import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import './LandingPage.css' 
import { GlobalContext } from '../contexts/GlobalContext'
import axios from 'axios'
import BarraPesquisa from '../components/BarraPesquisa' // <--- Importando o componente real

function LandingPage() {

    

    const navigate = useNavigate()
    const { usuarioLogado, setDadosUsuarioLogado, vetorObjetosUsuarios, posicaoUsuarioID } = useContext(GlobalContext)
    const [livrosVitrine, setLivrosVitrine] = useState([])

    const atualizarCatalogo = async () => {
        try {
            // MUDANÇA 1: Usar a rota de populares para mostrar só o "filé mignon"
            const response = await axios.get(`http://localhost:3000/livros/populares`)
            
            // MUDANÇA 2: Aumentar para 12 livros (para preencher bem a tela)
            setLivrosVitrine(response?.data?.slice(0, 12) || [])
        } catch (error) {
            console.error('Erro ao puxar os livros:', error)
        }
    }


    useEffect(() => {
        if (usuarioLogado === true && vetorObjetosUsuarios.length > 0) {
            const user = vetorObjetosUsuarios.find(u => u.usuario_id === posicaoUsuarioID);
            if(user) setDadosUsuarioLogado(user);
        }
        atualizarCatalogo()
    }, [usuarioLogado, vetorObjetosUsuarios])

    

    return (
        <div className='container-landing-page'>
            <div className='retangulo-um'>
                <div className='retangulo-dois'>
                    <div className='retangulo-tres'>
                        
                        <div className='div-espaco-vazio'></div>

                        {/* --- COLUNA ESQUERDA --- */}
                        <div className="div-esquerda">
            
                                <BarraPesquisa setPaginaAtual={() => {}} />


                            {/* 2. LOGO E TÍTULO (Estrutura original restaurada: Texto + Logo lado a lado) */}
                            <div className="container-logo-nome">
                                <div className="div-nome-do-site">
                                    <h1>Bem-vindo ao</h1>
                                </div>
                                <div className='div-logo-site'>
                                    <img className='logo-site' src="/images/logo.png" alt="Logo FliPi" />
                                </div>
                            </div>

                            {/* 3. SLOGAN E BOTÕES */}
                            <div className="div-informacoes">
                                <div className="div-slogan">
                                    <label className='slogan-home'>Compartilhe suas leituras, inspire outros leitores!</label>
                                </div>

                                <div className="div-btns">
                                    <button className='btn-cadastro' onClick={() => navigate("/telacadastro")}>Cadastrar-se</button>
                                    <button className='btn-logar' onClick={() => navigate("/telalogin")}>Entrar</button>
                                </div>
                            </div>
                            <div className="div-divisoes-esquerda">
                                <div className="div-divisao-um"></div>
                                <div className="div-divisao-dois"></div>
                            </div>
                        </div>

                        {/* --- COLUNA DIREITA (GRID DINÂMICO) --- */}
                        <div className="container-livros-direita">
                            <div className="div-espaco-vazio-landing"></div>

                            <div className="div-Fila-livros-landing">
                                {livrosVitrine.length > 0 ? (
                                    livrosVitrine.map((livro) => (
                                        <div className="div-box-titulo" key={livro.livro_isbn}>
                                            <button className="btn-livro-home" onClick={() => navigate("/telalivro", { state: { livroData: livro } })}>
                                                {livro.livro_capa ? (
                                                    <img 
                                                        src={livro.livro_capa} 
                                                        alt={livro.livro_titulo} 
                                                        // Estilo inline para garantir tamanho fixo igual ao original
                                                        style={{width: '85px', height: '120px', objectFit: 'cover', borderRadius: '5px', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'}}
                                                    />
                                                ) : (
                                                    <div style={{width: '85px', height: '120px', background: '#ccc', borderRadius: '5px'}}></div>
                                                )}
                                                <p className='titulos-livros'>
                                                    {livro.livro_titulo}
                                                </p>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{color: '#888'}}>Carregando...</p>
                                )}
                            </div>

                            <div className="div-divisoes-direita">
                                <div className="div-divisao-um"></div>
                                <div className="div-divisao-dois"></div>
                            </div>
                        </div>

                        <div className="div-elementos">
                             {/* Detalhes da borda direita */}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage