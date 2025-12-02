import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import LivroParteUm from "../components/LivroParteUm";
import axios from "axios";
import "./TelaLivro.css";

function TelaLivro() {
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const location = useLocation();
  const { isbn } = useParams(); // Se a rota for /telalivro/:isbn

  useEffect(() => {
    const carregarLivro = async () => {
      
      // 1. Tenta pegar o livro direto do estado da navegação (Home/Pesquisa/Landing)
      // É o jeito mais rápido, pois não precisa de nova requisição
      if (location.state?.livroData) {
        console.log("Livro carregado via State:", location.state.livroData);
        setLivroSelecionado(location.state.livroData);
        return;
      }

      // 2. Se não veio no state, tenta buscar pelo ISBN na URL (caso use rota dinâmica)
      if (isbn) {
        try {
          console.log("Buscando livro por ISBN na URL:", isbn);
          const response = await axios.get(`http://localhost:3000/livro/${isbn}`);
          setLivroSelecionado(response.data);
        } catch (error) {
          console.error("Erro ao buscar livro por ISBN:", error);
        }
        return;
      }

      // 3. Fallback legado (Index) - Mantive só por compatibilidade
      if (location.state?.index !== undefined) {
         // Se o sistema antigo passar index, teríamos que buscar todos os livros pra achar...
         // Mas como migramos para passar o objeto, isso deve ser raro.
         console.warn("Navegação por index é depreciada. Use o objeto do livro.");
      }
    };

    carregarLivro();
  }, [location.state, isbn]);

  if (!livroSelecionado) {
      return (
          <div className="container-mae" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <h2>Carregando detalhes do livro...</h2>
          </div>
      )
  }

  return (
    <div className="container-mae">
      {/* Passamos o livro selecionado para o componente filho */}
      <LivroParteUm livro={livroSelecionado} />
    </div>
  );
}

export default TelaLivro;