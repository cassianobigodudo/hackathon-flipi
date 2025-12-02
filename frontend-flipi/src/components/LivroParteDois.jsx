import "./livroParteDois.css"
import { useEffect, useState } from "react"
import axios from "axios";
import ResenhaLivro from "./ResenhaLivro";

function LivroParteDois({ livroSelecionado }) {

    const [resenhas, setResenhas] = useState([])
    const [usuarios, setUsuarios] = useState({})
    const [loading, setLoading] = useState(false)

    // 1. Buscar resenhas deste livro específico
    useEffect(() => {
        const pegarResenhas = async () => {
            if (!livroSelecionado?.livro_isbn) return;
            
            setLoading(true);
            try {
                // Busca todas (ideal seria filtrar no backend: /resenha?isbn=...)
                const response = await axios.get(`http://localhost:3000/resenha`);
                const todas = response.data || [];
                
                // Filtra pelo ISBN (converta para String para garantir comparação)
                const filtradas = todas.filter(r => String(r.livro_isbn) === String(livroSelecionado.livro_isbn));
                setResenhas(filtradas);
            } catch (error) {
                console.error("Erro ao buscar resenhas:", error);
            } finally {
                setLoading(false);
            }
        }
        pegarResenhas();
    }, [livroSelecionado]);

    // 2. Buscar nomes dos usuários das resenhas
    useEffect(() => {
        const pegarUsuarios = async () => {
            if (resenhas.length === 0) return;

            const idsUnicos = [...new Set(resenhas.map(r => r.usuario_id))];
            const novosUsuarios = {};

            try {
                await Promise.all(idsUnicos.map(async (id) => {
                    // Evita buscar se já tivermos em cache (opcional, mas bom pra performance)
                    if (usuarios[id]) return; 
                    
                    const res = await axios.get(`http://localhost:3000/usuario/${id}`);
                    novosUsuarios[id] = res.data;
                }));
                
                setUsuarios(prev => ({ ...prev, ...novosUsuarios }));
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
            }
        }
        pegarUsuarios();
    }, [resenhas]); // Executa quando a lista de resenhas muda

    // Função para atualizar curtidas na tela sem recarregar tudo
    const atualizarCurtidas = (resenhaId, novasCurtidas) => {
        setResenhas(prev => prev.map(r => r.resenha_id === resenhaId ? { ...r, resenha_curtidas: novasCurtidas } : r));
    };

    if (loading) return <p style={{textAlign: 'center', padding: '20px'}}>Carregando opiniões...</p>;

    return (
        <div className="container-mae-resenhas">
            <div className="container-resenhas">
                <div className="container-resenha-usuarios">
                    
                    {resenhas.length === 0 ? (
                        <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>
                            Este livro ainda não tem resenhas. Seja o primeiro!
                        </p>
                    ) : (
                        resenhas.map((resenha, pos) => (
                            <div key={pos} className="box-resenha">
                                <div className="resenha-container">
                                    <ResenhaLivro 
                                        resenhaId={resenha.resenha_id}
                                        resenhaTitulo={resenha.resenha_titulo}
                                        resenhaTexto={resenha.resenha_texto}
                                        resenhaCurtidas={resenha.resenha_curtidas}
                                        resenhaNota={resenha.resenha_nota}
                                        usuarioId={resenha.usuario_id}
                                        // Passa o objeto usuário inteiro ou só o apelido com fallback
                                        usuarioApelido={usuarios[resenha.usuario_id]?.usuario_apelido || "Usuário"}
                                        onCurtidaAtualizada={atualizarCurtidas} 
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default LivroParteDois