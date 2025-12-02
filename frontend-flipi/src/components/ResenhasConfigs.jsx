import React, { useContext, useEffect, useState } from 'react';
import './ResenhasConfigs.css';
import { GlobalContext } from '../contexts/GlobalContext';
import axios from 'axios';

function ResenhasConfigs({ usuarioId }) { // Recebe ID via props (mais seguro)
    const { dadosUsuarioLogado } = useContext(GlobalContext);
    const [livrosResenhados, setLivrosResenhados] = useState([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [livroSelecionado, setLivroSelecionado] = useState(null);

    // Usa o ID da prop ou do contexto como fallback
    const finalUserId = usuarioId || dadosUsuarioLogado?.usuario_id;

    const atualizarCatalogo = async () => {
        if (!finalUserId) return;

        try {
            // 1. Busca todas as resenhas
            const resenhasResponse = await axios.get(`http://localhost:3000/resenha`);
            const todasResenhas = resenhasResponse?.data || [];

            // 2. Filtra as minhas
            const minhasResenhas = todasResenhas.filter(r => r.usuario_id === finalUserId);

            // 3. Busca os dados dos livros dessas resenhas
            const promises = minhasResenhas.map(async (resenha) => {
                try {
                    const livroResp = await axios.get(`http://localhost:3000/livro/${resenha.livro_isbn}`);
                    return { ...livroResp.data, resenha }; // Combina livro + dados da resenha
                } catch (err) {
                    console.error("Erro ao buscar livro", resenha.livro_isbn);
                    return null;
                }
            });

            const resultados = await Promise.all(promises);
            setLivrosResenhados(resultados.filter(item => item !== null)); // Remove falhas
            
        } catch (error) {
            console.error('Erro ao carregar resenhas:', error);
        }
    };

    useEffect(() => {
        atualizarCatalogo();
    }, [finalUserId]);

    const handleLivroClick = (livro) => {
        setLivroSelecionado(livro);
        setPopupOpen(true);
    };

    const closePopup = () => {
        setPopupOpen(false);
        setLivroSelecionado(null);
    };

    const handleDeleteResenha = async () => {
        if (!livroSelecionado?.resenha?.resenha_id) return;
        
        if(confirm("Tem certeza que deseja apagar essa resenha?")) {
            try {
                await axios.delete(`http://localhost:3000/resenha/${livroSelecionado.resenha.resenha_id}`);
                alert("Resenha removida!");
                closePopup();
                atualizarCatalogo(); // Recarrega a lista
            } catch (error) {
                alert('Erro ao deletar.');
            }
        }
    };

    return (
        <div className='resenhas-container'>
            
            {/* GRID DE RESENHAS */}
            <div className="grid-minhas-resenhas">
                {livrosResenhados.length > 0 ? (
                    livrosResenhados.map((item, idx) => (
                        <div className="card-minha-resenha" key={idx} onClick={() => handleLivroClick(item)}>
                            {item.livro_capa ? (
                                <img src={item.livro_capa} alt={item.livro_titulo} className="img-capa-resenha"/>
                            ) : (
                                <div className="placeholder-capa-resenha"></div>
                            )}
                            
                            {/* Overlay com a nota ao passar o mouse ou sempre visível */}
                            <div className="badge-nota">
                                {item.resenha.resenha_nota} ★
                            </div>
                            
                            <p className='titulo-livro-resenha'>
                                {item.livro_titulo.length > 30 ? item.livro_titulo.substring(0, 28) + '...' : item.livro_titulo}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="sem-resenhas">
                        <p>Você ainda não fez nenhuma resenha.</p>
                        <p>Vá até a biblioteca e avalie um livro!</p>
                    </div>
                )}
            </div>

            {/* MODAL / POPUP */}
            {popupOpen && livroSelecionado && (
                <div className="popup-overlay" onClick={closePopup}>
                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-fechar-popup" onClick={closePopup}>×</button>
                        
                        <h2 className='popup-titulo'>{livroSelecionado.livro_titulo}</h2>
                        
                        <div className="popup-corpo">
                            <div className="popup-capa">
                                <img src={livroSelecionado.livro_capa || "https://via.placeholder.com/150"} alt="Capa" />
                            </div>
                            
                            <div className="popup-detalhes">
                                <div className="detalhe-item">
                                    <strong>Sua Nota:</strong> 
                                    <span className="nota-destaque"> {livroSelecionado.resenha.resenha_nota}/5 ★</span>
                                </div>
                                
                                <div className="detalhe-item">
                                    <strong>Título da Resenha:</strong>
                                    <p>{livroSelecionado.resenha.resenha_titulo}</p>
                                </div>

                                <div className="detalhe-item">
                                    <strong>O que você achou:</strong>
                                    <div className="texto-resenha-scroll">
                                        "{livroSelecionado.resenha.resenha_texto}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="popup-footer">
                            <button className="btn-deletar" onClick={handleDeleteResenha}>
                                🗑️ Apagar Resenha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResenhasConfigs;