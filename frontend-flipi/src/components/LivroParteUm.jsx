import { useContext, useEffect, useState } from "react"
import "./LivroParteUm.css"
import LivroParteDois from "./LivroParteDois"
import { useNavigate } from "react-router-dom";

function LivroParteUm({ livro }) {

    const navigate = useNavigate();
    
    // Estado local para controlar a aba de resenhas
    const [mostrarResenhas, setMostrarResenhas] = useState(false)

    // Se o livro não chegar (erro), não quebra a tela
    if (!livro) return null;

    // Extrair dados com segurança
    const { 
        livro_titulo, 
        livro_capa, 
        livro_ano, 
        livro_sinopse, 
        livro_isbn,
        autor, 
        editora 
    } = livro;

    // Tratamento para autor/editora que podem vir como objeto ou string dependendo da sua query
    const nomeAutor = autor?.autor_nome || autor || "Desconhecido";
    const nomeEditora = editora?.editora_nome || editora || "Desconhecida";

    return (
        <div>
            <div className="container-tela">
                <div className="parte-cima">
                    
                    {/* CAPA E ESTRELAS */}
                    <div className="parte-capa-livro">
                        <div className="capa-livro">
                            {livro_capa ? (
                                <img src={livro_capa} alt={livro_titulo} className="imagem-capa-livro"/>
                            ) : (
                                <div style={{width: '100%', height: '100%', background: '#ccc'}}></div>
                            )}
                        </div>
                        {/* Aqui entrariam as estrelas médias se tiver */}
                        <div className="parte-classificacao">
                             {/* Componente de estrelas opcional */}
                        </div>
                    </div>

                    {/* TEXTOS E DETALHES */}
                    <div className="parte-textos">
                        <div className="textos">
                            <div className="titulo-livro">
                                <h6 className="h3-tituloLivro">{livro_titulo}</h6>
                            </div>

                            <div className="descricao-livro">
                                <h6 className="h4-descricaoLivro">ISBN: {livro_isbn}</h6>
                            </div>

                            <div className="descricao-livro">
                                <h6>Autor: {nomeAutor}</h6> 
                                <span style={{margin: '0 10px'}}>|</span>
                                <h6>Editora: {nomeEditora}</h6>
                            </div>

                            <div className="descricao-livro"> 
                                <h6>Ano: {livro_ano}</h6>
                            </div>

                            <div className="sinopse-livro">
                                <p className="lbl-sinopseLivro" style={{textAlign: 'justify'}}>
                                    {livro_sinopse || "Sem sinopse disponível."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MENUS LATERAIS */}
                    <div className="parte-menus">
                        <button onClick={() => navigate("/telaprincipal")} className="botao-menuUm" title="Home"> 
                            <img src="../public/icons/ant-design--home-outlined.svg" alt="Home" className="icone-botao"/> 
                        </button>
                        
                        {/* Botão Escrivaninha (Vai para criar resenha desse livro) */}
                        <button 
                            onClick={() => navigate("/telaescrivaninha", { state: { livroSelecionado: livro } })} 
                            className="botao-menuDois"
                            title="Escrever Resenha"
                        >
                            <img src="public/icons/escrita.png" alt="Escrever" className="icone-botao"/>
                        </button>

                        <button onClick={() => navigate("/telausuarioconfigs")} className="botao-menuTres" title="Configurações">
                            <img src="./public/images/setting.svg" alt="Config" className="icone-botao"/> 
                        </button>
                    </div>
                </div>

                {/* BOTÃO EXPANDIR RESENHAS */}
                <div className="parte-baixo">
                    <button 
                        className="botao-resenha" 
                        onClick={() => setMostrarResenhas(!mostrarResenhas)}
                    >
                        {mostrarResenhas ? "Ocultar Resenhas ▲" : "Ver Resenhas da Comunidade ▼"}
                    </button>
                </div>

                {/* COMPONENTE DE RESENHAS (PARTE DOIS) */}
                <div className="container-parte-resenhas">
                    {mostrarResenhas && (
                        <LivroParteDois livroSelecionado={livro} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default LivroParteUm