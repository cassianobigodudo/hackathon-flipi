import express from 'express'
import cors from 'cors'
import pg from 'pg';
import fetch from 'node-fetch';
const { Pool } = pg;

const app = express()

async function iniciarDB(){
    await verificarDB()
    await verificarTabelas()
    await povoarBancoComDadosFicticios(pool)
}

iniciarDB().catch(error => {
    console.error('Erro na inicialização do Banco de Dados: ', error)
})

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flipidb',
    password: 'senai',
    port: 5432 
  });

async function verificarDB(){

    // Configurando pool para acesso ao banco de dados
    const defaultPool = new Pool({
        user: 'postgres', // Substitua pelo seu usuário do PostgreSQL / PGAdmin
        host: 'localhost',
        database: 'postgres', // Nome da sua database no PostgreSQL / PGAdmi
        password: 'senai', // Substitua pela sua senha do PostgreSQL / PGAdmin
        port: 5432, // Porta padrão do PostgreSQL
    })
    
    const client = await defaultPool.connect();
    const nomeBanco = 'flipidb'
    
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco])
    
    if(result.rowCount == 0){
    
        console.log(`Banco de dados ${nomeBanco} não existe. Criando...`)
        await client.query(`CREATE DATABASE ${nomeBanco}`)
        console.log(`Banco de dados ${nomeBanco} criado com sucesso!`)
    } else {
    
        console.log(`Banco de dados ${nomeBanco} já existe.`)
    
    }
    
    client.release()
    await defaultPool.end()
}

async function verificarTabelas(){

    const client = await pool.connect();

    const createUsuarioQuery = `
    CREATE TABLE IF NOT EXISTS usuario(
        usuario_id SERIAL PRIMARY KEY,
        usuario_nome VARCHAR(40) NOT NULL,
        usuario_apelido VARCHAR(40) NOT NULL,
        usuario_email VARCHAR(80) UNIQUE NOT NULL,
        usuario_senha VARCHAR(30) NOT NULL,
        url_foto TEXT 
    );`
    await client.query(createUsuarioQuery);
    console.log(`Tabela "usuario" verificada/criada com sucesso.`);

    const createEditoraQuery = `
    CREATE TABLE IF NOT EXISTS editora(
        editora_id SERIAL PRIMARY KEY,
        editora_nome TEXT NOT NULL
    );`
    await client.query(createEditoraQuery);
    console.log(`Tabela "editora" verificada/criada com sucesso.`);

    const createAutorQuery = `
    CREATE TABLE IF NOT EXISTS autor(
        autor_id SERIAL PRIMARY KEY,
        autor_nome TEXT NOT NULL
    );`
    await client.query(createAutorQuery);
    console.log(`Tabela "autor" verificada/criada com sucesso.`);

    const createGeneroQuery = `
    CREATE TABLE IF NOT EXISTS genero(
        genero_id SERIAL PRIMARY KEY,
        genero_nome TEXT NOT NULL
    );`
    await client.query(createGeneroQuery);
    console.log(`Tabela "genero" verificada/criada com sucesso.`);

    const createLivroQuery= `
    CREATE TABLE IF NOT EXISTS livro (
        livro_isbn BIGINT PRIMARY KEY,
        livro_titulo VARCHAR(100) NOT NULL,
        livro_ano INTEGER NOT NULL,
        livro_sinopse TEXT NOT NULL,
        livro_capa TEXT NOT NULL,
        editora_id INTEGER,
        CONSTRAINT fk_livro_editora FOREIGN KEY (editora_id) REFERENCES EDITORA (editora_id) ON UPDATE CASCADE ON DELETE RESTRICT
    );`
    await client.query(createLivroQuery);
    console.log(`Tabela "livro" verificada/criada com sucesso.`);


    const createLivroAutorQuery= `
    CREATE TABLE IF NOT EXISTS livro_autor(
        livro_isbn BIGINT NOT NULL,
        autor_id INT NOT NULL,
        PRIMARY KEY (livro_isbn, autor_id),
        CONSTRAINT fk_livro_autor FOREIGN KEY (autor_id) REFERENCES AUTOR (autor_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES LIVRO (livro_isbn) ON UPDATE CASCADE ON DELETE CASCADE        
    );`
    await client.query(createLivroAutorQuery);
    console.log(`Tabela "livro_autor" verificada/criada com sucesso.`)

    const createLivroGeneroQuery= `
    CREATE TABLE IF NOT EXISTS livro_genero(
        livro_isbn BIGINT NOT NULL,
        genero_id INT NOT NULL,
        PRIMARY KEY (livro_isbn, genero_id),
        CONSTRAINT fk_livro_genero FOREIGN KEY (genero_id) REFERENCES GENERO (genero_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES LIVRO (livro_isbn) ON UPDATE CASCADE ON DELETE CASCADE        
    );`
    await client.query(createLivroGeneroQuery);
    console.log(`Tabela "livro_genero" verificada/criada com sucesso.`)

    
    //Criação automática da tabela de listas personalizadas
    const createListQuery= `
    CREATE TABLE IF NOT EXISTS listas_personalizadas(
        id SERIAL PRIMARY KEY, 	
        criador_lista INTEGER NOT NULL REFERENCES usuario(usuario_id),
        nome_lista TEXT NOT NULL, 	
        descricao_lista TEXT NOT NULL, 	
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 	
        isbn_livros BIGINT[],
        CONSTRAINT fk_criador_lista FOREIGN KEY (criador_lista)
            REFERENCES usuario(usuario_id)
            ON DELETE CASCADE   
    );`
    await client.query(createListQuery);
    console.log(`Tabela "listas_personalizadas" verificada/criada com sucesso.`)

    //?-----RESENHA------?//
    const createResenhaQuery= `
   CREATE TABLE IF NOT EXISTS resenha(
    resenha_id SERIAL PRIMARY KEY,
    resenha_titulo VARCHAR(40),
    resenha_texto TEXT NOT NULL,
    resenha_nota INT NOT NULL,
    resenha_curtidas INT,
    usuario_id INT NOT NULL,
    livro_isbn BIGINT,

    CONSTRAINT fk_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_livro_isbn FOREIGN KEY (livro_isbn) REFERENCES livro (livro_isbn) ON UPDATE CASCADE ON DELETE RESTRICT
);`
    
    await client.query(createResenhaQuery);
    console.log(`Tabela  "resenha" verificada/criada com sucesso.`)

    // ✅ MOVER PARA AQUI - Agora todas as tabelas existem
    console.log('Iniciando inserção de livros...');
    await inserirLivrosTabela(client);
    console.log('Inserção de livros concluída.');

    client.release();
}

app.use(cors())
app.use(express.json())

async function povoarBancoComDadosFicticios(pool) {
    const client = await pool.connect();
    try {
        console.log("🚀 Iniciando povoamento de dados fictícios (Sem Fotos)...");

        // 1. CRIAR USUÁRIOS
        // Removida a coluna url_foto e seus valores
        const insertUsuarios = `
            INSERT INTO usuario (usuario_nome, usuario_apelido, usuario_email, usuario_senha) VALUES
            ('Lucas "King" Silva', 'king_fan', 'lucas@email.com', '123456'),
            ('Mariana Romance', 'mari_leitora', 'mari@email.com', '123456'),
            ('Roberto Crítico', 'beto_books', 'beto@email.com', '123456'),
            ('Fernanda Geek', 'fer_targaryen', 'fer@email.com', '123456'),
            ('João Casual', 'joao_le', 'joao@email.com', '123456'),
            ('Ana Cult', 'ana_classicos', 'ana@email.com', '123456')
            ON CONFLICT (usuario_email) DO NOTHING;
        `;
        
        await client.query(insertUsuarios);
        console.log("✅ Usuários criados.");

// 2. CRIAR RESENHAS REAIS (MANUAIS E CURADAS) - COM PROTEÇÃO CONTRA DUPLICIDADE
        console.log("📝 Inserindo carga massiva de resenhas reais...");

        const reviewsData = [
            // --- GAME OF THRONES (9780553381689) ---
            { isbn: 9780553381689, email: 'fer@email.com', nota: 5, curtidas: 120, titulo: 'A Bíblia da Fantasia', texto: 'George R.R. Martin criou um mundo tão complexo que a Terra Média parece um passeio no parque. Tyrion é o melhor personagem já escrito.' },
            { isbn: 9780553381689, email: 'lucas@email.com', nota: 5, curtidas: 45, titulo: 'Brutal e Genial', texto: 'Não se apegue a ninguém. A política é sangrenta e o inverno está chegando. Leitura obrigatória.' },
            { isbn: 9780553381689, email: 'mari@email.com', nota: 3, curtidas: 12, titulo: 'Muito violento', texto: 'A história é boa, mas precisa de estômago forte. Muita descrição de banquete e muita crueldade.' },
            { isbn: 9780553381689, email: 'beto@email.com', nota: 4, curtidas: 30, titulo: 'Narrativa densa', texto: 'A alternância de pontos de vista é uma aula de escrita criativa, embora o ritmo caia em alguns momentos.' },

            // --- IT: A COISA (9788560280940) ---
            { isbn: 9788560280940, email: 'lucas@email.com', nota: 5, curtidas: 88, titulo: 'O Rei do Terror', texto: 'Pennywise é apenas a ponta do iceberg. O verdadeiro monstro é a indiferença de Derry. King no seu auge.' },
            { isbn: 9788560280940, email: 'ana@email.com', nota: 4, curtidas: 20, titulo: 'Longo, mas vale a pena', texto: '1000 páginas que passam voando. A amizade dos perdedores é a alma do livro.' },
            { isbn: 9788560280940, email: 'joao@email.com', nota: 5, curtidas: 15, titulo: 'Assustador', texto: 'Tive pesadelos por uma semana. Recomendo!' },

            // --- O ILUMINADO (9788581050485) ---
            { isbn: 9788581050485, email: 'lucas@email.com', nota: 5, curtidas: 60, titulo: 'Claustrofóbico', texto: 'O hotel Overlook é um personagem vivo. Esqueça o filme, o livro é muito mais profundo psicologicamente.' },
            { isbn: 9788581050485, email: 'fer@email.com', nota: 4, curtidas: 22, titulo: 'Clássico', texto: 'A descida de Jack à loucura é construída tijolo por tijolo. Mestre King.' },
            { isbn: 9788581050485, email: 'beto@email.com', nota: 5, curtidas: 40, titulo: 'Terror Psicológico', texto: 'Uma análise sobre o alcoolismo e a destruição da família disfarçada de história de fantasma.' },

            // --- MISERY (9788581052144) ---
            { isbn: 9788581052144, email: 'mari@email.com', nota: 5, curtidas: 55, titulo: 'Angustiante', texto: 'Não consegui largar. Annie Wilkes é a vilã mais aterrorizante porque ela poderia ser real.' },
            { isbn: 9788581052144, email: 'joao@email.com', nota: 4, curtidas: 10, titulo: 'Tensão pura', texto: 'Li tudo em uma sentada. Você sente a dor do protagonista.' },

            // --- PS, EU TE AMO (9781401309169) ---
            { isbn: 9781401309169, email: 'mari@email.com', nota: 5, curtidas: 200, titulo: 'Chorei rios', texto: 'A história de amor mais linda e triste. Preparem os lenços.' },
            { isbn: 9781401309169, email: 'ana@email.com', nota: 4, curtidas: 45, titulo: 'Emocionante', texto: 'Ensina muito sobre luto e como seguir em frente.' },
            { isbn: 9781401309169, email: 'lucas@email.com', nota: 2, curtidas: 5, titulo: 'Meloso demais', texto: 'Não é meu estilo. Muito drama para o meu gosto, prefiro terror.' },

            // --- CINQUENTA TONS (9782253176503) ---
            { isbn: 9782253176503, email: 'mari@email.com', nota: 4, curtidas: 30, titulo: 'Culpada por gostar', texto: 'Não é alta literatura, mas prende a atenção. O romance é intenso.' },
            { isbn: 9782253176503, email: 'beto@email.com', nota: 1, curtidas: 100, titulo: 'Péssima escrita', texto: 'Repetitivo, personagens rasos e narrativa fraca. O sucesso é um mistério.' },
            { isbn: 9782253176503, email: 'fer@email.com', nota: 2, curtidas: 15, titulo: 'Fanfic ruim', texto: 'Parece uma fanfic mal escrita de Crepúsculo. Passo.' },

            // --- O CÓDIGO DA VINCI (9788957591055) ---
            { isbn: 9788957591055, email: 'joao@email.com', nota: 5, curtidas: 50, titulo: 'Viciante', texto: 'Capítulos curtos que te obrigam a ler "só mais um". Um thriller perfeito.' },
            { isbn: 9788957591055, email: 'ana@email.com', nota: 3, curtidas: 20, titulo: 'Divertido', texto: 'É ficção, não aula de história. Se ler com isso em mente, é ótimo.' },
            
            // --- A ARTE DA GUERRA (9788533616844) ---
            { isbn: 9788533616844, email: 'beto@email.com', nota: 5, curtidas: 80, titulo: 'Atemporal', texto: 'Estratégias que servem para batalhas e para o mundo corporativo atual.' },
            { isbn: 9788533616844, email: 'lucas@email.com', nota: 3, curtidas: 10, titulo: 'Filosófico', texto: 'Interessante, mas um pouco repetitivo em alguns pontos.' },

            // --- CARRIE, A ESTRANHA (9788581050362) ---
            { isbn: 9788581050362, email: 'fer@email.com', nota: 4, curtidas: 35, titulo: 'A estreia do Rei', texto: 'Cruel e triste. O bullying retratado aqui é o verdadeiro horror.' },
            { isbn: 9788581050362, email: 'mari@email.com', nota: 3, curtidas: 18, titulo: 'Triste', texto: 'Fiquei com muita pena da Carrie. O final é explosivo.' },

            // --- FRANKENSTEIN (9786580210343) ---
            { isbn: 9786580210343, email: 'ana@email.com', nota: 5, curtidas: 90, titulo: 'Obra Prima', texto: 'Não é sobre um monstro, é sobre o que nos torna humanos. Mary Shelley era genial.' },
            { isbn: 9786580210343, email: 'beto@email.com', nota: 5, curtidas: 44, titulo: 'Essencial', texto: 'O nascimento da ficção científica. A linguagem é belíssima.' },

            // --- DIAS PERFEITOS (9788535924015) ---
            { isbn: 9788535924015, email: 'lucas@email.com', nota: 4, curtidas: 25, titulo: 'Perturbador', texto: 'Rafael Montes sabe criar psicopatas como ninguém. Téo é odiável.' },
            { isbn: 9788535924015, email: 'mari@email.com', nota: 2, curtidas: 10, titulo: 'Muito pesado', texto: 'Me senti mal lendo. Angustiante demais para mim.' },

            // --- A ESPERA DE UM MILAGRE (9788539000166) ---
            { isbn: 9788539000166, email: 'mari@email.com', nota: 5, curtidas: 110, titulo: 'Lindo e Triste', texto: 'Chorei do início ao fim. John Coffey, como a bebida, só que não se escreve igual.' },
            { isbn: 9788539000166, email: 'joao@email.com', nota: 5, curtidas: 40, titulo: 'Favorito da vida', texto: 'Uma história sobre bondade em lugares cruéis.' },

            // --- O PISTOLEIRO (9788581050218) ---
            { isbn: 9788581050218, email: 'fer@email.com', nota: 5, curtidas: 50, titulo: 'O homem de preto fugia...', texto: 'O início da maior saga já escrita. Pode parecer confuso, mas vale a pena insistir.' },
            { isbn: 9788581050218, email: 'ana@email.com', nota: 3, curtidas: 12, titulo: 'Diferente', texto: 'Uma mistura estranha de faroeste e fantasia. Fiquei curiosa para ler os próximos.' },

            // --- FIVE PEOPLE YOU MEET IN HEAVEN (9781401308582) ---
            { isbn: 9781401308582, email: 'mari@email.com', nota: 5, curtidas: 66, titulo: 'Toca a alma', texto: 'Te faz repensar todas as conexões da sua vida. Maravilhoso.' },
            
            // --- VARIADOS (Preenchendo a tabela) ---
            { isbn: 9780263870770, email: 'mari@email.com', nota: 4, curtidas: 12, titulo: 'Romance leve', texto: 'Ótimo para curar ressaca literária.' },
            { isbn: 9780263929874, email: 'mari@email.com', nota: 3, curtidas: 8, titulo: 'Clichê', texto: 'Aquele clichê que a gente ama ler numa tarde chuvosa.' },
            { isbn: 9788535937473, email: 'beto@email.com', nota: 4, curtidas: 22, titulo: 'Instigante', texto: 'Uma trama familiar complexa e cheia de segredos.' },
            { isbn: 9788539000753, email: 'lucas@email.com', nota: 3, curtidas: 15, titulo: 'Razoável', texto: 'Tem bons momentos de suspense, mas o final deixou a desejar.' },
            { isbn: 9788556510334, email: 'lucas@email.com', nota: 5, curtidas: 48, titulo: 'Zona Morta é top', texto: 'Um dos melhores livros "menores" do King. A premissa é excelente.' },
            { isbn: 9788581050546, email: 'fer@email.com', nota: 5, curtidas: 99, titulo: 'A Dança da Morte', texto: 'O épico pós-apocalíptico definitivo. Captain Trips assusta até hoje.' },
            { isbn: 9788581050454, email: 'lucas@email.com', nota: 4, curtidas: 33, titulo: 'Vampiros de verdade', texto: 'Salem é assustadora. Nada de vampiros brilhando aqui.' },
            { isbn: 9780373336036, email: 'joao@email.com', nota: 2, curtidas: 2, titulo: 'Chato', texto: 'Não consegui me conectar com os personagens.' },
            { isbn: 9781608181797, email: 'ana@email.com', nota: 3, curtidas: 5, titulo: 'Ok', texto: 'Uma leitura rápida, sem grandes pretensões.' },
            { isbn: 9781846175916, email: 'mari@email.com', nota: 4, curtidas: 10, titulo: 'Fofo', texto: 'Uma história doce e encantadora.' },
            { isbn: 9788580573619, email: 'fer@email.com', nota: 5, curtidas: 75, titulo: 'A Roda do Tempo', texto: 'Se você gosta de Tolkien e Martin, precisa ler isso. Épico demais.' },
            { isbn: 9782290019436, email: 'fer@email.com', nota: 5, curtidas: 40, titulo: 'Game of Thrones em francês', texto: 'Reli para treinar o idioma. A história continua imbatível.' },
            { isbn: 9780008762278, email: 'joao@email.com', nota: 3, curtidas: 6, titulo: 'Divertido', texto: 'Dei boas risadas em alguns momentos.' },
            { isbn: 9788960176751, email: 'lucas@email.com', nota: 5, curtidas: 30, titulo: 'Mr Mercedes', texto: 'King provando que sabe escrever policial tão bem quanto terror.' },
            { isbn: 9781401309220, email: 'beto@email.com', nota: 4, curtidas: 18, titulo: 'Neurociência', texto: 'Fascinante entender como a memória funciona.' },
            { isbn: 9781401308605, email: 'beto@email.com', nota: 5, curtidas: 55, titulo: 'Cauda Longa', texto: 'Leitura obrigatória para entender a economia digital.' },
            { isbn: 9781401309121, email: 'joao@email.com', nota: 3, curtidas: 12, titulo: 'Bom', texto: 'Bons insights sobre relacionamentos.' },
            { isbn: 9781401308667, email: 'mari@email.com', nota: 5, curtidas: 40, titulo: 'Cecelia Ahern!', texto: 'A mesma autora de PS Eu Te Amo. Nunca decepciona.' },
            { isbn: 9781401308827, email: 'joao@email.com', nota: 4, curtidas: 8, titulo: 'Curioso', texto: 'Histórias de bar sempre rendem bons livros.' },
            { isbn: 9781401308919, email: 'ana@email.com', nota: 2, curtidas: 4, titulo: 'Datado', texto: 'Falar de Blackberry hoje em dia é engraçado, mas o livro envelheceu mal.' },
            { isbn: 9781401308940, email: 'mari@email.com', nota: 4, curtidas: 15, titulo: 'Profundo', texto: 'Um livro sensível sobre perdas.' },
            { isbn: 9781401309268, email: 'ana@email.com', nota: 3, curtidas: 9, titulo: 'Gostei', texto: 'Uma boa ambientação.' },
            { isbn: 9781401309312, email: 'mari@email.com', nota: 5, curtidas: 28, titulo: 'Rainha', texto: 'Livros sobre corações partidos são minha fraqueza.' },
             // --- Finalizando a carga com reviews genéricas para o resto ---
            { isbn: 9781401309336, email: 'beto@email.com', nota: 3, curtidas: 7, titulo: 'Interessante', texto: 'Uma biografia que vale a leitura.' },
            { isbn: 9781401309473, email: 'fer@email.com', nota: 4, curtidas: 14, titulo: 'Tecnologia', texto: 'Bons pontos sobre o futuro da internet.' },
            { isbn: 9781401309299, email: 'beto@email.com', nota: 5, curtidas: 40, titulo: 'Comunicação', texto: 'Essencial para quem trabalha com marketing.' }
        ];

        for (const rev of reviewsData) {
            // Lógica de proteção: Insere se o usuário ainda não comentou neste livro
            const query = `
                INSERT INTO resenha (resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn)
                SELECT $1, $2, $3, $4, u.usuario_id, $5
                FROM usuario u 
                WHERE u.usuario_email = $6
                AND NOT EXISTS (
                    SELECT 1 FROM resenha r 
                    WHERE r.usuario_id = u.usuario_id 
                    AND r.livro_isbn = $5
                );
            `;

            await client.query(query, [rev.titulo, rev.texto, rev.nota, rev.curtidas, rev.isbn, rev.email]);
        }
        
        console.log("✅ Resenhas Manuais (Curadas) inseridas com sucesso!");


// 3. CRIAR LISTAS PERSONALIZADAS - COM PROTEÇÃO CONTRA DUPLICIDADE
        console.log("📚 Verificando listas...");

        // Lista 1: Mestre do Terror
        const listaTerror = `
            INSERT INTO listas_personalizadas (criador_lista, nome_lista, descricao_lista, isbn_livros)
            SELECT u.usuario_id, 'Mestres do Terror', 'Minha coleção favorita do Stephen King. Só para quem tem coragem!', 
            ARRAY[9788560280940, 9788581050485, 9788581052144, 9788581050362, 9788581050454, 9788556510334]::BIGINT[]
            FROM usuario u WHERE u.usuario_email = 'lucas@email.com'
            AND NOT EXISTS (
                SELECT 1 FROM listas_personalizadas l 
                WHERE l.criador_lista = u.usuario_id 
                AND l.nome_lista = 'Mestres do Terror'
            );
        `;
        await client.query(listaTerror);

        // Lista 2: Para chorar
        const listaRomance = `
            INSERT INTO listas_personalizadas (criador_lista, nome_lista, descricao_lista, isbn_livros)
            SELECT u.usuario_id, 'Para chorar no domingo', 'Livros emocionantes para ler com uma caixa de chocolate.', 
            ARRAY[9781401309169, 9781401308582, 9780008762278]::BIGINT[]
            FROM usuario u WHERE u.usuario_email = 'mari@email.com'
            AND NOT EXISTS (
                SELECT 1 FROM listas_personalizadas l 
                WHERE l.criador_lista = u.usuario_id 
                AND l.nome_lista = 'Para chorar no domingo'
            );
        `;
        await client.query(listaRomance);

         // Lista 3: Fantasia
         const listaFantasia = `
            INSERT INTO listas_personalizadas (criador_lista, nome_lista, descricao_lista, isbn_livros)
            SELECT u.usuario_id, 'Mundos Fantásticos', 'Espadas, feitiçaria e jornadas longas.', 
            ARRAY[9780553381689, 9788580573619, 9782290019436]::BIGINT[]
            FROM usuario u WHERE u.usuario_email = 'fer@email.com'
            AND NOT EXISTS (
                SELECT 1 FROM listas_personalizadas l 
                WHERE l.criador_lista = u.usuario_id 
                AND l.nome_lista = 'Mundos Fantásticos'
            );
        `;
        await client.query(listaFantasia);

        console.log("✅ Listas personalizadas verificadas.");
        console.log("🏁 Povoamento concluído! O banco está pronto para o Hackathon.");

    } catch (err) {
        console.error("Erro ao povoar banco:", err);
    } finally {
        client.release();
    }
}

async function buscarLivroPorISBN(isbn) {
    try {
        // Removendo hífens se houver
        const isbnLimpo = isbn.toString().replace(/-/g, '');
        console.log(isbnLimpo)
        
        // Buscando informações do livro
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbnLimpo}&format=json&jscmd=data`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        const chave = `ISBN:${isbnLimpo}`;
        
        // Verificando se o livro foi encontrado
        if (!data[chave]) {
            throw new Error('Livro não encontrado na API');
        }
        
        console.log(data[chave].subjects[0])
        return data[chave];

    } catch (error) {
        console.error('Erro ao buscar livro:', error);
        throw error;
    }
}

async function obterOuCriarEditora(nome) {

    if (!nome) return null;

    const client = await pool.connect();
    
    try {
        // Verifica se a editora já existe
        let result = await client.query('SELECT editora_id FROM editora WHERE editora_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].editora_id;
        }
        
        // Se não existir, cria uma nova editora
        result = await client.query(
            'INSERT INTO editora (editora_nome) VALUES ($1) RETURNING editora_id',
            [nome]
        );
        
        return result.rows[0].editora_id;
    } catch (error) {
        console.error('Erro ao obter/criar editora:', error.message);
        return null;
    }
}

async function obterOuCriarAutor(nome) {
    if (!nome) return null;
    
    const client = await pool.connect();
    try {
        // Verifica se o autor já existe
        let result = await client.query('SELECT autor_id FROM autor WHERE autor_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].autor_id;
        }
        
        // Se não existir, cria um novo autor
        result = await client.query(
            'INSERT INTO autor (autor_nome) VALUES ($1) RETURNING autor_id',
            [nome]
        );
        
        return result.rows[0].autor_id;
    } catch (error) {
        console.error('Erro ao obter/criar autor:', error.message);
        return null;
    }
}


const mapeamentoGeneros = {
    // Ficção Científica
    'science fiction': 'Ficção Científica','sci-fi': 'Ficção Científica','dystopian': 'Ficção Científica','utopian': 'Ficção Científica','space': 'Ficção Científica','future': 'Ficção Científica','cyberpunk': 'Ficção Científica','aliens': 'Ficção Científica','time travel': 'Ficção Científica',
    
    // Thriller
    'thriller': 'Thriller','thrillers': 'Thriller','suspense': 'Thriller','psychological thriller': 'Thriller','spy': 'Thriller','espionage': 'Thriller',
    
    // Fantasia
    'fantasy': 'Fantasia','fantasy fiction': 'Fantasia','magic': 'Fantasia','magical realism': 'Fantasia','wizards': 'Fantasia','dragons': 'Fantasia','mythology': 'Fantasia','fairy tales': 'Fantasia','supernatural': 'Fantasia',
    
    // Comédia
    'comedy': 'Comédia','humor': 'Comédia','humorous': 'Comédia','satire': 'Comédia','parody': 'Comédia','comic': 'Comédia','funny': 'Comédia',
    
    // Biografia
    'biography': 'Biografia','autobiography': 'Biografia','memoirs': 'Biografia','life stories': 'Biografia','biographical': 'Biografia',
    
    // Crimes
    'crime': 'Crimes','criminal': 'Crimes','detective': 'Crimes','mystery': 'Crimes','mystery fiction': 'Crimes','detective stories': 'Crimes','police': 'Crimes','murder': 'Crimes','investigation': 'Crimes','noir': 'Crimes',
    
    // Ação e Aventura
    'action': 'Ação e Aventura','adventure': 'Ação e Aventura','action & adventure': 'Ação e Aventura','adventure stories': 'Ação e Aventura','expeditions': 'Ação e Aventura','survival': 'Ação e Aventura','quest': 'Ação e Aventura',
    
    // Romance
    'romance': 'Romance','love stories': 'Romance','romantic fiction': 'Romance','love': 'Romance','relationships': 'Romance','romantic': 'Romance',
    
    // Terror
    'horror': 'Terror','horror stories': 'Terror','ghost stories': 'Terror','ghosts': 'Terror','monsters': 'Terror','scary': 'Terror','fear': 'Terror','haunted': 'Terror',
    
    // Medieval
    'medieval': 'Medieval','middle ages': 'Medieval','knights': 'Medieval','castles': 'Medieval','feudal': 'Medieval','chivalry': 'Medieval','crusades': 'Medieval',
    
    // Drama
    'drama': 'Drama','dramatic': 'Drama','family': 'Drama','psychological': 'Drama','emotional': 'Drama','tragedy': 'Drama','tragic': 'Drama',
    
    // Outros mapeamentos úteis
    'fiction': 'Drama','novels': 'Drama','literature': 'Drama','historical fiction': 'Medieval','war': 'Ação e Aventura','military': 'Ação e Aventura','western': 'Ação e Aventura','pirates': 'Ação e Aventura'
};

// Função para mapear assuntos da OpenLibrary para gêneros tradicionais
function mapearGenerosLiterarios(assuntosOpenLibrary) {
    const generosEncontrados = new Set();
    
    if (!assuntosOpenLibrary || !Array.isArray(assuntosOpenLibrary)) {
        return [];
    }
    
    assuntosOpenLibrary.forEach(assunto => {
        try {
            // Extrai o texto do assunto (pode ser string ou objeto)
            let assuntoTexto;
            if (typeof assunto === 'string') {
                assuntoTexto = assunto;
            } else if (typeof assunto === 'object' && assunto !== null) {
                // Se for objeto, tenta extrair propriedades comuns
                assuntoTexto = assunto.name || assunto.title || assunto.subject || assunto.toString();
            } else {
                // Se não conseguir extrair texto, pula este item
                return;
            }
            
            // Normaliza o assunto para minúsculas para comparação
            const assuntoNormalizado = assuntoTexto.toLowerCase().trim();
            
            // Verifica correspondência exata
            if (mapeamentoGeneros[assuntoNormalizado]) {
                generosEncontrados.add(mapeamentoGeneros[assuntoNormalizado]);
            } else {
                // Verifica se o assunto contém alguma palavra-chave dos gêneros
                Object.keys(mapeamentoGeneros).forEach(chave => {
                    if (assuntoNormalizado.includes(chave) || chave.includes(assuntoNormalizado)) {
                        generosEncontrados.add(mapeamentoGeneros[chave]);
                    }
                });
            }
        } catch (error) {
            console.log('Erro ao processar assunto:', assunto, error.message);
            // Continua processando os outros assuntos
        }
    });
    
    return Array.from(generosEncontrados);
}

// Função modificada para obter ou criar um gênero (apenas gêneros mapeados)
async function obterOuCriarGenero(nome) {
    if (!nome) return null;
    
    const client = await pool.connect();
    try {
        // Verifica se o gênero já existe
        let result = await client.query('SELECT genero_id FROM genero WHERE genero_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].genero_id;
        }
        
        // Se não existir, cria um novo gênero
        result = await client.query(
            'INSERT INTO genero (genero_nome) VALUES ($1) RETURNING genero_id',
            [nome]
        );
        
        return result.rows[0].genero_id;
    } finally {
        client.release();
    }
}

async function obterOuCriarEditoraComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se a editora já existe
        let result = await client.query('SELECT editora_id FROM editora WHERE editora_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].editora_id;
        }
        
        // Se não existir, cria uma nova editora
        result = await client.query(
            'INSERT INTO editora (editora_nome) VALUES ($1) RETURNING editora_id',
            [nome]
        );
        
        return result.rows[0].editora_id;
    } catch (error) {
        console.error('Erro ao obter/criar editora:', error.message);
        return null;
    }
}

async function obterOuCriarAutorComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se o autor já existe
        let result = await client.query('SELECT autor_id FROM autor WHERE autor_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].autor_id;
        }
        
        // Se não existir, cria um novo autor
        result = await client.query(
            'INSERT INTO autor (autor_nome) VALUES ($1) RETURNING autor_id',
            [nome]
        );
        
        return result.rows[0].autor_id;
    } catch (error) {
        console.error('Erro ao obter/criar autor:', error.message);
        return null;
    }
}

async function obterOuCriarGeneroComClient(client, nome) {
    if (!nome) return null;
    
    try {
        // Verifica se o gênero já existe
        let result = await client.query('SELECT genero_id FROM genero WHERE genero_nome = $1', [nome]);
        
        if (result.rows.length > 0) {
            return result.rows[0].genero_id;
        }
        
        // Se não existir, cria um novo gênero
        result = await client.query(
            'INSERT INTO genero (genero_nome) VALUES ($1) RETURNING genero_id',
            [nome]
        );
        
        return result.rows[0].genero_id;
    } catch (error) {
        console.error('Erro ao obter/criar gênero:', error.message);
        return null;
    }
}

// Função inserirLivrosTabela corrigida
async function inserirLivrosTabela(client) {
    const isbns = [9782290019436, 9788960176751, 9782253176503, 9780008762278, 
    9780263870770, 9780263929874, 9780373336036, 9781608181797, 
    9781846175916, 9780553381689, 9788580573619, 9788957591055, 
    9788535937473, 9788535924015, 9788581050485, 9788581052144, 
    9788581050362, 9788581050454, 9788581050218, 9788539000166, 
    9788539000753, 9788539000333, 9788581050546, 9788556510334, 
    9786580210343, 9781401308582, 9781401308605, 9781401308612, 
    9781401308629, 9781401308643, 9781401308650, 9781401308667, 
    9781401308674, 9781401308681, 9781401308698, 9781401308704, 
    9781401308711, 9781401308742, 9781401308797, 9781401308810, 
    9781401308827, 9781401308841, 9781401308858, 9781401308872, 
    9781401308896, 9781401308902, 9781401308919, 9781401308926, 
    9781401308933, 9781401308940, 9781401308957, 9781401308964, 
    9781401308971, 9781401308988, 9781401308995, 9781401309022, 
    9781401309039, 9781401309046, 9781401309053, 9781401309060, 
    9781401309077, 9781401309084, 9781401309091, 9781401309121, 
    9781401309138, 9781401309145, 9781401309152, 9781401309169, 
    9781401309206, 9781401309213, 9781401309220, 9781401309237, 
    9781401309251, 9781401309268, 9781401309275, 9781401309299, 
    9781401309312, 9781401309336, 9781401309343, 9781401309350, 
    9781401309367, 9781401309374, 9781401309381, 9781401309411, 
    9781401309428, 9781401309435, 9781401309442, 9781401309473, 
    9781401309497
    ];

    for (const isbn of isbns) {
        try {
            // Verifica se o livro já existe antes de tentar inserir
            const livroExistente = await client.query('SELECT livro_isbn FROM livro WHERE livro_isbn = $1', [isbn]);
            if (livroExistente.rows.length > 0) {
                console.log(`Livro com ISBN ${isbn} já existe no banco. Pulando...`);
                continue;
            }

            console.log(`Buscando informações para o livro ISBN: ${isbn}`);
            const livro = await buscarLivroPorISBN(isbn);

            const titulo = livro.title || 'Título desconhecido';
            const ano = livro.publish_date ? parseInt(livro.publish_date.match(/\d{4}/)?.[0]) || 2000 : 2000;
            const sinopse = livro.notes || livro.excerpts?.[0]?.text || 'Sem sinopse';
            const capa = livro.cover?.large || livro.cover?.medium || livro.cover?.small || '';
            
            // Usar as funções que aceitam client como parâmetro
            const editoraNome = livro.publishers?.[0]?.name || null;
            const editora_id = editoraNome ? await obterOuCriarEditoraComClient(client, editoraNome) : null;

            const insertQuery = `
                INSERT INTO livro (livro_isbn, livro_titulo, livro_ano, livro_sinopse, livro_capa, editora_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (livro_isbn) DO NOTHING;
            `;

            await client.query(insertQuery, [isbn, titulo, ano, sinopse, capa, editora_id]);
            console.log(`Livro inserido: ${titulo} - Editora ID: ${editora_id}`);

            // Processar autores se existirem
            if (livro.authors && livro.authors.length > 0) {
                for (const autorInfo of livro.authors) {
                    const autorId = await obterOuCriarAutorComClient(client, autorInfo.name);
                    if (autorId) {
                        await client.query(
                            'INSERT INTO livro_autor (livro_isbn, autor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, autorId]
                        );
                        console.log(`Autor ${autorInfo.name} associado ao livro ${isbn}`);
                    }
                }
            }

            // Processar gêneros se existirem
            if (livro.subjects && livro.subjects.length > 0) {
                console.log('Assuntos originais da OpenLibrary:', livro.subjects);
                
                // Mapeia os assuntos para gêneros tradicionais
                const generosLiterarios = mapearGenerosLiterarios(livro.subjects);
                console.log('Gêneros mapeados:', generosLiterarios);
                
                // Insere apenas os gêneros mapeados
                for (const generoNome of generosLiterarios) {
                    const generoId = await obterOuCriarGeneroComClient(client, generoNome);
                    if (generoId) {
                        await client.query(
                            'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, generoId]
                        );
                        console.log(`Gênero ${generoNome} associado ao livro ${isbn}`);
                    }
                }
                
                // Se nenhum gênero foi mapeado, adiciona "Drama" como padrão
                if (generosLiterarios.length === 0) {
                    console.log('Nenhum gênero mapeado, adicionando "Drama" como padrão');
                    const generoId = await obterOuCriarGeneroComClient(client, 'Drama');
                    if (generoId) {
                        await client.query(
                            'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [isbn, generoId]
                        );
                        console.log(`Gênero padrão "Drama" associado ao livro ${isbn}`);
                    }
                }
            } else {
                // Se não há subjects, adiciona Drama como padrão
                console.log('Livro sem subjects, adicionando "Drama" como padrão');
                const generoId = await obterOuCriarGeneroComClient(client, 'Drama');
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [isbn, generoId]
                    );
                    console.log(`Gênero padrão "Drama" associado ao livro ${isbn}`);
                }
            }

        } catch (error) {
            console.error(`Erro ao inserir livro com ISBN ${isbn}:`, error.message);
            // Continua com o próximo livro mesmo se houver erro
            continue;
        }
    }
}

// Função para buscar livro completo com suas relações
async function buscarLivroCompleto(isbn) {
    const client = await pool.connect();
    try {
        // Busca informações básicas do livro
        const livroResult = await client.query('SELECT * FROM livro WHERE livro_isbn = $1', [isbn]);
        if (livroResult.rows.length === 0) {
            throw new Error('Livro não encontrado');
        }
        
        const livro = livroResult.rows[0];
        
        // Busca informações da editora
        if (livro.editora_id) {
            const editoraResult = await client.query('SELECT * FROM editora WHERE editora_id = $1', [livro.editora_id]);
            if (editoraResult.rows.length > 0) {
                livro.editora = editoraResult.rows[0];   // Adiciona informações da editora ao objeto livro
            }
        }
        
        // Busca autores do livro
        const autoresResult = await client.query(
            'SELECT a.* FROM autor a JOIN livro_autor la ON a.autor_id = la.autor_id WHERE la.livro_isbn = $1',
            [isbn]
        );
        livro.autores = autoresResult.rows;            // Adiciona lista de autores ao objeto livro
        
        // Busca gêneros do livro
        const generosResult = await client.query(
            'SELECT g.* FROM genero g JOIN livro_genero lg ON g.genero_id = lg.genero_id WHERE lg.livro_isbn = $1',
            [isbn]
        );
        livro.generos = generosResult.rows;            // Adiciona lista de gêneros ao objeto livro
        
        return livro;                                 // Retorna o livro com todas as relações
    } finally {
        client.release();                             // Libera a conexão
    }
}

// Modifique a rota para usar o novo sistema de mapeamento
app.post('/livro/isbn/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Verifica se o livro já existe no banco
        const livroExistente = await client.query('SELECT * FROM livro WHERE livro_isbn = $1', [isbn]);
        if (livroExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Livro já existe no banco de dados' });
        }
        
        // Busca dados do livro na API
        const dadosLivro = await buscarLivroPorISBN(isbn);
        
        // Extrai informações relevantes
        const titulo = dadosLivro.title || 'Título não disponível';
        const ano = dadosLivro.publish_date ? parseInt(dadosLivro.publish_date.match(/\d{4}/)[0]) : 0;
        const sinopse = dadosLivro.excerpts ? dadosLivro.excerpts[0].text : (dadosLivro.description ? 
                       (typeof dadosLivro.description === 'string' ? dadosLivro.description : dadosLivro.description.value) : 
                       'Sinopse não disponível');
        const limitedSinopse = sinopse.substring(0, 399);
        
        const capa = dadosLivro.cover ? dadosLivro.cover.large || dadosLivro.cover.medium || dadosLivro.cover.small : null;
        
        // Obtém ou cria editora
        const editoraNome = dadosLivro.publishers && dadosLivro.publishers.length > 0 ? dadosLivro.publishers[0].name : null;
        const editoraId = editoraNome ? await obterOuCriarEditora(editoraNome) : null;
        
        // Insere o livro no banco
        console.log("isbn ====>>> ", isbn);
        console.log("titulo====>>> ", titulo);
        console.log("ano====>>> ", ano);
        console.log("limitedSinopse ====>>> ", limitedSinopse);
        console.log("editoraId ====>>> ", editoraId);
        console.log("capa ====>>> ", capa);

        
        const livroResult = await client.query(
            'INSERT INTO livro (livro_isbn, livro_titulo, livro_ano, livro_sinopse, editora_id, livro_capa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [isbn, titulo, ano, limitedSinopse, editoraId, capa]
        );
        
        // Processa e insere autores
        if (dadosLivro.authors && dadosLivro.authors.length > 0) {
            for (const autorInfo of dadosLivro.authors) {
                const autorId = await obterOuCriarAutor(autorInfo.name);
                await client.query(
                    'INSERT INTO livro_autor (livro_isbn, autor_id) VALUES ($1, $2)',
                    [isbn, autorId]
                );
            }
        }
        
        // *** NOVA LÓGICA PARA GÊNEROS ***
        // Mapeia os assuntos da OpenLibrary para gêneros literários tradicionais
        if (dadosLivro.subjects && dadosLivro.subjects.length > 0) {
            console.log('Assuntos originais da OpenLibrary:', dadosLivro.subjects);
            
            // Mapeia os assuntos para gêneros tradicionais
            const generosLiterarios = mapearGenerosLiterarios(dadosLivro.subjects);
            console.log('Gêneros mapeados:', generosLiterarios);
            
            // Insere apenas os gêneros mapeados
            for (const generoNome of generosLiterarios) {
                const generoId = await obterOuCriarGenero(generoNome);
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [isbn, generoId]
                    );
                }
            }
            
            // Se nenhum gênero foi mapeado, adiciona "Drama" como padrão
            if (generosLiterarios.length === 0) {
                console.log('Nenhum gênero mapeado, adicionando "Drama" como padrão');
                const generoId = await obterOuCriarGenero('Drama');
                if (generoId) {
                    await client.query(
                        'INSERT INTO livro_genero (livro_isbn, genero_id) VALUES ($1, $2)',
                        [isbn, generoId]
                    );
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Busca o livro completo com suas relações para retornar na resposta
        const livroCompleto = await buscarLivroCompleto(isbn);
        res.status(201).json(livroCompleto);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao adicionar livro:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar livro', detalhes: err.message });
    } finally {
        client.release();
    }
});

// Rota para listar todos os gêneros cadastrados (útil para debug e visualização)
app.get('/generos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM genero ORDER BY genero_nome');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar gêneros' });
    }
});

// Rota para buscar livros por gênero
app.get('/livros/genero/:genero_id', async (req, res) => {
    const { genero_id } = req.params;
    try {
        const result = await pool.query(`
            SELECT l.*, g.genero_nome 
            FROM livro l 
            JOIN livro_genero lg ON l.livro_isbn = lg.livro_isbn 
            JOIN genero g ON lg.genero_id = g.genero_id 
            WHERE g.genero_id = $1
        `, [genero_id]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livros por gênero' });
    }
});

// Rota para pegar livros ordenados por popularidade (Nota Média)
app.get('/livros/populares', async (req, res) => {
    try {
        const query = `
            SELECT l.*, 
                   COALESCE(AVG(r.resenha_nota), 0) as media_nota,
                   COUNT(r.resenha_id) as total_resenhas
            FROM livro l
            LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
            GROUP BY l.livro_isbn
            ORDER BY media_nota DESC, total_resenhas DESC
            LIMIT 20; 
        `;
        // LIMIT 20 para a home não ficar pesada
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar populares:', error);
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});

// Rota de recomendação personalizada
app.post('/livros/recomendados', async (req, res) => {
    const { usuario_id } = req.body;

    try {
        const query = `
            SELECT l.*, 
                   COALESCE(AVG(r.resenha_nota), 0) as media_nota
            FROM livro l
            LEFT JOIN resenha r ON l.livro_isbn = r.livro_isbn
            WHERE l.livro_isbn NOT IN (
                SELECT livro_isbn FROM resenha WHERE usuario_id = $1
            )
            -- Opcional: Se tiver tabela de "Lidos", adicione aqui também para excluir
            GROUP BY l.livro_isbn
            ORDER BY media_nota DESC
            LIMIT 10;
        `;
        
        const resultado = await pool.query(query, [usuario_id]);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Erro ao gerar recomendações:', error);
        res.status(500).json({ erro: 'Erro ao recomendar' });
    }
});



app.get('/livro/:isbn', async (req, res) => {
    const { isbn } = req.params;                       // Obtém o ISBN da URL
    
    try {
        
        const livro = await buscarLivroCompleto(isbn); // Busca o livro completo
        res.json(livro);                              // Retorna o livro
    } catch (err) {
        console.error(err.message);
        res.status(404).json({ error: 'Livro não encontrado' });
    }
});

app.get('/livro/buscar/:titulo', async (req, res) => {
    const { titulo } = req.params;
    const { generos, autor, editora, ano } = req.query;
    
    console.log('Filtros recebidos:', { titulo, generos, autor, editora, ano });
    
    try {
        // Construir a query dinamicamente
        let query = `
            SELECT l.livro_isbn,
                   l.livro_titulo,
                   l.livro_ano,
                   l.livro_sinopse,
                   l.livro_capa,
                   l.editora_id,
                   STRING_AGG(DISTINCT a.autor_nome, ', ') AS autores, 
                   STRING_AGG(DISTINCT g.genero_nome, ', ') AS generos
            FROM livro l
            LEFT JOIN livro_autor la ON l.livro_isbn = la.livro_isbn
            LEFT JOIN autor a ON la.autor_id = a.autor_id
            LEFT JOIN livro_genero lg ON l.livro_isbn = lg.livro_isbn
            LEFT JOIN genero g ON lg.genero_id = g.genero_id
            LEFT JOIN editora e ON l.editora_id = e.editora_id
            WHERE l.livro_titulo ILIKE $1
        `;

        const queryParams = [`%${titulo}%`];
        let paramIndex = 2;

        // Filtro por autor
        if (autor) {
            query += ` AND a.autor_nome ILIKE $${paramIndex}`;
            queryParams.push(`%${autor}%`);
            paramIndex++;
        }

        // Filtro por editora
        if (editora) {
            query += ` AND e.editora_nome ILIKE $${paramIndex}`;
            queryParams.push(`%${editora}%`);
            paramIndex++;
        }

        // Filtro por ano
        if (ano) {
            query += ` AND l.livro_ano = $${paramIndex}`;
            queryParams.push(parseInt(ano));
            paramIndex++;
        }

        // Filtro por gêneros - TODOS os gêneros devem estar presentes
        if (generos) {
            const generosArray = generos.split(',').map(g => g.trim());
            const generosPlaceholders = generosArray.map((_, index) => 
                `$${paramIndex + index}`
            ).join(',');
            
            // Subconsulta para garantir que o livro tenha TODOS os gêneros especificados
            query += ` AND l.livro_isbn IN (
                SELECT lg_inner.livro_isbn 
                FROM livro_genero lg_inner
                JOIN genero g_inner ON lg_inner.genero_id = g_inner.genero_id
                WHERE g_inner.genero_nome IN (${generosPlaceholders})
                GROUP BY lg_inner.livro_isbn
                HAVING COUNT(DISTINCT g_inner.genero_nome) = ${generosArray.length}
            )`;
            
            queryParams.push(...generosArray);
        }

        query += ` GROUP BY l.livro_isbn, l.livro_titulo, l.livro_ano, l.livro_sinopse, l.livro_capa, l.editora_id`;

        console.log('Query final:', query);
        console.log('Parâmetros:', queryParams);

        const result = await pool.query(query, queryParams);
        
        console.log('Resultados do backend:', result.rows);
        res.json(result.rows);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livro na barra de pesquisa' });
    }
});

app.get('/livro', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM livro');
        res.json(result.rows);                        // Retorna todos os livros
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar livros' });
    }
});


// Rota para inserção de user no banco de dados
app.post('/usuario', async (req, res) => {
    console.log('Dados recebidos no backend:', req.body);
    const {usuario_nome, usuario_apelido, usuario_email, usuario_senha} = req.body
    try {
        // Query para inserção do user no banco de dados
        const result = await pool.query(
            'INSERT INTO usuario (usuario_nome, usuario_apelido, usuario_email, usuario_senha) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_nome, usuario_apelido, usuario_email, usuario_senha]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err.message)
        res.status(500).json({ error: 'Erro ao cadastrar usuário! :(' })
    }
})

// Rota para buscar todos os usuários
app.get('/usuario', async (req, res) => {

    try {
        const result = await pool.query(
            'SELECT * FROM usuario'
        )
        res.status(200).json(result.rows)
    } catch (error) {

        console.error('Erro ao buscar usuários: ', error)
        res.status(500).json({ error: 'Erro ao buscar usuário'})

    }


})

// Rota para buscar um usuário por ID
app.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE usuario_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Rota para buscar um cliente por apelido
app.get('/usuario/apelido/:apelido', async (req, res) => {
    const { apelido } = req.params;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE usuario_apelido = $1', [apelido]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// // Rota para atualizar um cliente
// app.put('/usuario/:usuario_id', async (req, res) => {
//     const { usuario_id } = req.params;
//     const { usuario_nome, usuario_email, usuario_senha, url_foto  } = req.body;
//     try {
//         console.log('entrei no try')
//         const result = await pool.query(
//             'UPDATE usuario SET usuario_nome = $1, usuario_email = $2, usuario_senha = $3, url_foto = $4 WHERE usuario_id = $5 RETURNING *',
//             [usuario_nome, usuario_email, usuario_senha, url_foto, usuario_id]
//         );
//         console.log('fiz a query')
//         console.log(usuario_id)
//         if (result.rows.length === 0) {
//             console.log('entrei no 404')
//             return res.status(404).json({ error: 'Usuario não encontrado' });
//         }
//         console.log('atualizei os dados')
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: 'Erro ao atualizar usuario' });
//     }
//   });

// rota para atualizar um usuário
app.put('/usuario/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  const campos = req.body;

  try {
    const chaves = Object.keys(campos);
    const valores = Object.values(campos);

    if (chaves.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado enviado para atualização' });
    }

    // Ex: "usuario_nome = $1, usuario_email = $2"
    const setClause = chaves.map((campo, i) => `${campo} = $${i + 1}`).join(', ');

    const query = `
      UPDATE usuario
      SET ${setClause}
      WHERE usuario_id = $${chaves.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...valores, usuario_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});


  // Rota para deletar um cliente
app.delete('/usuario/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await pool.query('DELETE FROM usuario WHERE usuario_id = $1 RETURNING *', [usuario_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario não encontrado' });
        }
        res.json({ message: 'Usuario deletado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao deletar usuario' });
    }
});

// -- JAIME --
// Rota para criar uma nova lista
app.post('/listas_personalizadas', async (req, res) => {
    console.log('Dados recebidos', req.body);

    const { nome, descricao, criador } = req.body;
    
    try {
        // Query para inserir a nova lista no banco de dados
        const result = await pool.query(
            'INSERT INTO listas_personalizadas ( nome_lista, descricao_lista, criador_lista ) VALUES ($1, $2, $3) RETURNING *',
            [ nome, descricao, criador ]
        );
        console.dir("recebendo resultado ", result)

        // Retorna a lista criada com status 201
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao criar lista!' });
    }
});

//Rota para buscar todas as listas de um usuário específico
app.get('/listas_personalizadas/usuario/:id', async (req, res) => {
    const { id } = req.params;

    const userID = parseInt(id)

    try {
        const result = await pool.query(
            'SELECT * FROM listas_personalizadas WHERE criador_lista = $1',
            [userID]
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar listas:', err.message);
        res.status(500).json({ error: 'Erro ao buscar listas!' });
    }
});

// Rota para atualizar nome e/ou descrição de uma lista
app.patch('/listas_personalizadas/:id', async (req, res) => {
    console.log('Dados recebidos:', req.body);
    
    const { id } = req.params;
    const { nomeLista, descricaoLista } = req.body;
    
    try {
        // Construir a query dinamicamente baseado nos campos enviados
        let updateFields = [];
        let values = [];
        let paramIndex = 1;
        
        if (nomeLista !== undefined) {
            updateFields.push(`nome_lista = $${paramIndex}`);
            values.push(nomeLista);
            paramIndex++;
        }
        
        if (descricaoLista !== undefined) {
            updateFields.push(`descricao_lista = $${paramIndex}`);
            values.push(descricaoLista);
            paramIndex++;
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
        }
        
        // Adicionar o ID no final dos valores
        values.push(parseInt(id));
        
        const query = `
            UPDATE listas_personalizadas 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING *
        `;
        
        console.log('Query:', query);
        console.log('Values:', values);
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }
        
        // Retornar a lista atualizada
        res.status(200).json(result.rows[0]);
        
    } catch (err) {
        console.error('Erro ao atualizar lista:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar lista!' });
    }
});

//Rota para deletar uma lista
app.delete('/listas_personalizadas/:id', async (req, res) => {
    const { id } = req.params;

    try{
        const result = await pool.query(
            'DELETE FROM listas_personalizadas WHERE id = $1', [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lista não encontrada' });
        }
      
        res.status(200).json({ message: 'Lista deletada com sucesso' });
    } 
    catch (error) {
        console.error('Erro ao deletar a lista:', error);
        res.status(500).json({ error: 'Erro interno ao deletar a lista' });
    }
    
});

//Rota para listar todos os livros que estão no meu banco de dados
app.get("/livro", async (req, res) => {
    try {
      const resultado = await pool.query("SELECT * FROM livro");
      res.json(resultado.rows); // ou .recordset se for SQL Server
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao buscar livros" });
    }
  });

//adição de isbn do livro a lista
app.patch("/listas_personalizadas/:id/adicionar-livro", async (req, res) => {
    const idLista = req.params.id;
    const { isbnLivro } = req.body;

    console.log('requisição recebida:', { idLista, isbnLivro })

    try {

        const isbnParaBanco = Number(isbnLivro);
        
        // Primeiro verifica se a lista existe
        const listaExiste = await pool.query(
            "SELECT * FROM listas_personalizadas WHERE id = $1",
            [idLista]
        );
        
        if (listaExiste.rows.length === 0) {
            console.log('Lista não encontrada!')
            return res.status(404).json({ erro: "Lista não encontrada" });
        }
        
        // Verifica se o livro já está na lista
        const isbnArray = listaExiste.rows[0].isbn_livros || [];
        console.log('ISBNSs atuais na lista:', isbnArray);
        if (isbnArray.includes(isbnParaBanco)) {
            return res.status(400).json({ erro: "Livro já está na lista" });
        }
        
        const resultado = await pool.query(
            `UPDATE listas_personalizadas 
             SET isbn_livros = array_append(COALESCE(isbn_livros, '{}'), $1)
             WHERE id = $2
             RETURNING *;`,
            [isbnParaBanco, idLista]
        );
        console.log('livro adicionado com sucesso:', resultado.rows[0])
        res.status(200).json(resultado.rows[0]);

    } catch (erro) {
        console.error("Erro ao adicionar livro: ", erro);
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

//rota para buscar todos os isbns da minha lista de livros
app.get("/listas_personalizadas/:id/livro", async (req, res) => {
    const { id } = req.params;
  
    try {
      // Busca os ISBNs da lista
      const lista = await pool.query(
        "SELECT isbn_livros FROM listas_personalizadas WHERE id = $1",
        [id]
      );
  
      if (lista.rows.length === 0) {
        return res.status(404).json({ erro: "Lista não encontrada" });
      }
  
      const isbns = lista.rows[0].isbn_livros;
  
      if (!isbns || isbns.length === 0) {
        return res.json([]); // Lista vazia
      }
  
      // Busca os dados dos livros com base nos ISBNs
      const livros = await pool.query(
        `SELECT * FROM livro WHERE livro_isbn = ANY($1::bigint[])`,
        [isbns]
      );
  
      res.json(livros.rows);
    } catch (erro) {
      console.error("Erro ao buscar livros da lista:", erro);
      res.status(500).json({ erro: "Erro interno ao buscar livros da lista" });
    }
  });
  

//rota para apagar um livro de uma lista
app.patch('/listas_personalizadas/:id/remover-livro', async (req, res) => {
    const { id } = req.params; // ID da lista
    const { isbnLivro } = req.body; // ISBN do livro a remover (como string)
  
    try {
      // Verifica se a lista existe
      const listaResult = await pool.query('SELECT * FROM listas_personalizadas WHERE id = $1', [id]);
  
      if (listaResult.rowCount === 0) {
        return res.status(404).json({ erro: 'Lista não encontrada.' });
      }
  
      // Remove o ISBN do array (PostgreSQL: array_remove)
      const updateResult = await pool.query(
        `UPDATE listas_personalizadas 
         SET isbn_livros = array_remove(isbn_livros, $1)
         WHERE id = $2
         RETURNING *`,
        [isbnLivro, id]
      );
  
      return res.status(200).json(updateResult.rows[0]);
  
    } catch (erro) {
      console.error('Erro ao remover livro da lista:', erro);
      return res.status(500).json({ erro: 'Erro interno ao remover livro da lista.' });
    }
  });
  

//Rota para verificar o login 
app.post('/login', async (req, res) => {
    const { usuario_apelido, usuario_senha } = req.body;

    try {
        const resultado = await pool.query(
            'SELECT * FROM usuario WHERE usuario_apelido = $1 AND usuario_senha = $2',
            [usuario_apelido, usuario_senha]
        );

        if (resultado.rows.length > 0) {
            const usuario = resultado.rows[0];
            res.status(200).json({
                mensagem: 'Login bem-sucedido!',
                usuario_id: usuario.usuario_id,
                usuario_nome: usuario.usuario_nome,
                usuario_apelido: usuario.usuario_apelido,
                usuario_email: usuario.usuario_email
            });
        } else {
            res.status(401).json({ mensagem: 'Apelido ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ mensagem: 'Erro no servidor.' });
    }
});

//* TABELA RESENHA
app.post('/resenha', async (req, res) => {
    const {resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn} = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO resenha 
            (resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [resenha_titulo, resenha_texto, resenha_nota, resenha_curtidas, usuario_id, livro_isbn]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erro ao cadastrar resenha!-Server' });
    }
});

app.get('/resenha', async (req, res) => {
    const { usuario_id } = req.query;

    try {
        let result;
        if (usuario_id) {
            result = await pool.query(
                'SELECT * FROM resenha WHERE usuario_id = $1',
                [usuario_id]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM resenha'
            );
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar resenha: ', error);
        res.status(500).json({ error: 'Erro ao buscar resenha' });
    }
});


    
app.get('/resenha/:resenha_id', async (req, res) => {
    const {resenha_id} = req.params;
    try {

        const result = await pool.query(
            'SELECT * FROM resenha WHERE resenha_id = $1', [resenha_id]

        )
        res.status(200).json(result.rows)
    } catch (error) {

        console.error('Erro ao buscar resenha: ', error)
        res.status(500).json({ error: 'Erro ao buscar resenha'})

    }


})

app.delete('/resenha/:resenha_id', async (req, res) => {
    const { resenha_id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM resenha WHERE resenha_id = $1 RETURNING *',
            [resenha_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Resenha não encontrada' });
        }
        res.json({ message: 'Resenha deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar resenha:', error);
        res.status(500).json({ error: 'Erro ao deletar resenha' });
    }
});

app.put('/resenha/:resenha_id', async (req, res) => {
    const { resenha_id } = req.params;
    const { resenha_curtidas } = req.body;
    
    try {

        const resenhaExiste = await pool.query(
            'SELECT * FROM resenha WHERE resenha_id = $1', 
            [resenha_id]
        );
        
        if (resenhaExiste.rows.length === 0) {
            return res.status(404).json({ error: 'Resenha não encontrada' });
        }
        

        const result = await pool.query(
            'UPDATE resenha SET resenha_curtidas = $1 WHERE resenha_id = $2 RETURNING *',
            [resenha_curtidas, resenha_id]
        );
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar resenha:', error);
        res.status(500).json({ error: 'Erro ao atualizar resenha' });
    }
});
  

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000! :D')
})
