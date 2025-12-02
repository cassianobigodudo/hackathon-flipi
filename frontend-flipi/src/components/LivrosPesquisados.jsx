import React, { useState, useEffect, useRef } from 'react';
import './LivrosPesquisados.css';
import { MdOutlineContentCopy } from "react-icons/md";
import { useNavigate } from 'react-router-dom'; // 1. IMPORTAR ISSO

function LivrosPesquisados({ livro }) {
  
  const navigate = useNavigate(); // 2. INICIAR O HOOK
  
  const [switchClassName, setSwitchClassName] = useState('isbn-botao-container');
  const [switchLabel, setSwitchLabel] = useState('ISBN');
  
  const tituloRef = useRef(null);

  function SwitchISBN() {
    if(switchLabel === 'ISBN') {
      setSwitchLabel(`ISBN: ${livro.livro_isbn}`);
    } else {
      setSwitchLabel('ISBN');
    }
    
    if(switchClassName === 'isbn-botao-container') {
      setSwitchClassName('isbn-botao-container-ativado');
    } else {
      setSwitchClassName('isbn-botao-container');
    }
  }
  
  useEffect(() => {
    const container = tituloRef.current;
    
    if (container) {
      const handleWheel = (event) => {
        event.preventDefault();
        const scrollSpeed = 0.8;
        container.scrollLeft += event.deltaY * scrollSpeed;
      };
      
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  return (
    <div className="livro-unidade-pesquisado">
        <div className="isbn-container">
          <div className={switchClassName} onClick={SwitchISBN}>
            <label className='lbl-isbn' onClick={SwitchISBN}>{switchLabel}</label>
          </div>
          {switchClassName === 'isbn-botao-container-ativado' && 
            <MdOutlineContentCopy 
              className='copy-icon' 
              onClick={() => {navigator.clipboard.writeText(livro.livro_isbn)}} 
            />
          } 
        </div>

        <div className="pesquisado-container">
            <div className="livro-capa-container">
              {/* 3. ADICIONADO O ONCLICK E O CURSOR POINTER NA IMAGEM */}
              <img 
                src={livro.livro_capa} 
                className='img-livro-pesquisado' 
                alt={`Capa do livro ${livro.livro_titulo}`}
                onClick={() => navigate("/telalivro", { state: { livroData: livro } })}
                style={{ cursor: 'pointer' }} 
              />
            </div>

            <div className="livro-info-container">
                <div className="titulo-autor-data-container">
                  <div className="titulo-livro-pesquisado" ref={tituloRef}>
                    <label className='lbl-titulo-pesquisa'>{livro.livro_titulo}</label>
                  </div>

                  <div className="autor-ano-pesquisado">
                    <label className='lbl-autor'>Autor: {livro.autor?.autor_nome || livro.autores || 'Não informado'}</label>
                    <label className='lbl-ano'>Ano: {livro.livro_ano}</label>
                  </div>
                </div>

                <div className="sinopse-container">
                  <label className='lbl-sinopse'>{livro.livro_sinopse}</label>
                </div>
            </div>
        </div>
    </div>
  );
}

export default LivrosPesquisados;