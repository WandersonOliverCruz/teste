const CONFIG = {
    sistemaNome: "Sistema TI",
    fundoPadrao: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=85",
    opacidadeFundo: 80,
    desfoqueFundo: 4,
    corPrincipalPadrao: "#4f46e5",
    corTextoPadrao: "#334155",
    fontePadrao: "Inter, sans-serif"
};

const DB = {
    get(nome, padrao = []) {
        const dados = localStorage.getItem(`sistemaTI_${nome}`);
        return dados ? JSON.parse(dados) : padrao;
    },
    set(nome, valor) {
        localStorage.setItem(`sistemaTI_${nome}`, JSON.stringify(valor));
    },
    proximoId(lista) {
        return lista.length ? Math.max(...lista.map(item => item.id)) + 1 : 1;
    }
};

const Aparencia = {
    salvar(logoBase64, fundoBase64, opacidade, desfoque, corPrincipal, corTexto, fonteTexto) {
        const atual = DB.get('aparencia', {});
        const aparencia = {
            logo: logoBase64 || atual.logo,
            fundo: fundoBase64 || atual.fundo,
            opacidade: opacidade ?? atual.opacidade ?? CONFIG.opacidadeFundo,
            desfoque: desfoque ?? atual.desfoque ?? CONFIG.desfoqueFundo,
            corPrincipal: corPrincipal || atual.corPrincipal || CONFIG.corPrincipalPadrao,
            corTexto: corTexto || atual.corTexto || CONFIG.corTextoPadrao,
            fonteTexto: fonteTexto || atual.fonteTexto || CONFIG.fontePadrao,
        };
        DB.set('aparencia', aparencia);
        this.aplicar();
        return aparencia;
    },
    aplicar() {
        const aparencia = DB.get('aparencia', {
            fundo: CONFIG.fundoPadrao,
            opacidade: CONFIG.opacidadeFundo,
            desfoque: CONFIG.desfoqueFundo,
            corPrincipal: CONFIG.corPrincipalPadrao,
            corTexto: CONFIG.corTextoPadrao,
            fonteTexto: CONFIG.fontePadrao
        });
        
        const fundoEl = document.querySelectorAll('.fundo-personalizado, .fundo-sistema-personalizado');
        fundoEl.forEach(el => {
            el.style.backgroundImage = `url('${aparencia.fundo || CONFIG.fundoPadrao}')`;
        });
        const camadas = document.querySelectorAll('.camada-sobreposicao, .camada-sistema-sobreposicao');
        camadas.forEach(camada => {
            const opacidadeDec = (aparencia.opacidade || 80) / 100;
            camada.style.backgroundColor = `rgba(15, 23, 42, ${opacidadeDec})`;
            camada.style.backdropFilter = `blur(${aparencia.desfoque || 4}px)`;
        });

        const cor = aparencia.corPrincipal || CONFIG.corPrincipalPadrao;
        document.documentElement.style.setProperty('--cor-principal', cor);
        document.documentElement.style.setProperty('--cor-principal-sombra', ajustarCorSombra(cor));
        document.documentElement.style.setProperty('--cor-principal-clara', `${cor}15`);
        document.documentElement.style.setProperty('--cor-principal-borda', `${cor}30`);

        const corTexto = aparencia.corTexto || CONFIG.corTextoPadrao;
        document.documentElement.style.setProperty('--cor-texto-padrao', corTexto);
        document.body.style.color = corTexto;

        const elementosTexto = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, th, td, a');
        elementosTexto.forEach(el => {
            if (!el.classList.contains('text-rose-600') && !el.classList.contains('text-emerald-600') && 
                !el.classList.contains('text-amber-600') && !el.classList.contains('text-white') && 
                !el.classList.contains('text-indigo-600')) {
                el.style.color = corTexto;
            }
        });

        const fonte = aparencia.fonteTexto || CONFIG.fontePadrao;
        document.body.style.fontFamily = fonte;

        if (aparencia.logo) {
            const login = document.getElementById('area-logo-login');
            const menu = document.getElementById('area-logo-menu');
            if (login) login.innerHTML = `<img src="${aparencia.logo}" alt="Logo" class="max-h-12 w-auto object-contain">`;
            if (menu) menu.innerHTML = `<img src="${aparencia.logo}" alt="Logo" class="max-h-10 w-auto object-contain">`;
        }
    },
    async lerImagem(arquivo) {
        return new Promise((resolver, rejeitar) => {
            const leitor = new FileReader();
            leitor.onload = e => resolver(e.target.result);
            leitor.onerror = rejeitar;
            leitor.readAsDataURL(arquivo);
        });
    }
};

function ajustarCorSombra(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    let r = (num >> 16) - 30;
    let g = ((num >> 8) & 0x00ff) - 30;
    let b = (num & 0x0000ff) - 30;
    r = r < 0 ? 0 : r;
    g = g < 0 ? 0 : g;
    b = b < 0 ? 0 : b;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const dados = encoder.encode(senha);
    const hash = await crypto.subtle.digest('SHA-256', dados);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const MODULOS_SISTEMA = [
    { id: 'painel', nome: 'Painel Principal' },
    { id: 'equipamentos', nome: 'Equipamentos' },
    { id: 'chamados', nome: 'Central de Chamados' },
    { id: 'meus-chamados', nome: 'Meus Chamados' },
    { id: 'usuarios', nome: 'Gerenciar Usuários' },
    { id: 'categorias', nome: 'Categorias e Subcategorias' },
    { id: 'setores', nome: 'Setores e Liberações' },
    { id: 'aparencia', nome: 'Aparência e Design' },
    { id: 'historico', nome: 'Histórico de Atividades' }
];

let usuarios = DB.get('usuarios', []);
(async () => {
    if (usuarios.length === 0) {
        const hashPadrao = await hashSenha('123');
        usuarios = [
            { 
                id: 1, 
                usuario: 'Wanderson', 
                senha: hashPadrao, 
                nome: 'Wanderson (Admin)', 
                perfil: 'ADM', 
                email: 'wanderson@suaempresa.com.br', 
                ativo: true, 
                aprovado: true,
                permissoes: MODULOS_SISTEMA.map(m => m.id)
            }
        ];
        salvarTudo();
    }
})();

let equipamentos = DB.get('equipamentos', [
    { id: 1, patrimonio: 'PAT-001', tipo: 'Notebook', marcaModelo: 'Dell Latitude 3420', setor: 'Tecnologia da Informação', status: 'Ativo', responsavel: 'Wanderson' },
    { id: 2, patrimonio: 'PAT-002', tipo: 'Computador', marcaModelo: 'Lenovo ThinkCentre', setor: 'Financeiro', status: 'Ativo', responsavel: 'Carlos' }
]);

let chamados = DB.get('chamados', [
    { id: 1, solicitante: 'Wanderson', categoria: 'Hardware (Computadores/Peças)', subcategoria: 'Notebook', descricao: 'Tela piscando ao conectar na dock station.', status: 'Aberto', prioridade: 'Alta', data: new Date().toLocaleString('pt-BR') }
]);

let historicoAlteracoes = DB.get('historico', []);
let categoriasProblema = DB.get('categorias_problema', [
    { id: 1, nome: 'Hardware (Computadores/Peças)', subcategorias: ['Computador', 'Notebook', 'Peças/Componentes'] },
    { id: 2, nome: 'Software / Sistemas', subcategorias: ['Instalação', 'Erro de Sistema', 'Acesso/Credenciais'] },
    { id: 3, nome: 'Rede e Internet', subcategorias: ['Wi-Fi Instável', 'Cabo de Rede', 'VPN'] },
    { id: 4, nome: 'Impressoras e Periféricos', subcategorias: ['Atolamento de Papel', 'Sem Tinta/Toner', 'Configuração'] }
]);

let setoresLiberacoes = DB.get('setores_liberacoes', [
    { id: 1, nome: 'Financeiro', tipoLiberacao: 'Alçada de Pagamento e Relatórios Críticos' },
    { id: 2, nome: 'Recursos Humanos', tipoLiberacao: 'Liberação de Benefícios e Pessoal' },
    { id: 3, nome: 'Tecnologia da Informação', tipoLiberacao: 'Acesso Total / Infraestrutura' },
    { id: 4, nome: 'Comercial / Vendas', tipoLiberacao: 'Requisições de Clientes e Propostas' }
]);

function salvarTudo() {
    DB.set('usuarios', usuarios);
    DB.set('equipamentos', equipamentos);
    DB.set('chamados', chamados);
    DB.set('historico', historicoAlteracoes);
    DB.set('categorias_problema', categoriasProblema);
    DB.set('setores_liberacoes', setoresLiberacoes);
}

window.addEventListener('beforeunload', salvarTudo);

let usuarioLogado = null;
let paginaAtual = 'painel';

document.addEventListener('DOMContentLoaded', async () => {
    const anoAtualEl = document.getElementById('ano-atual');
    if (anoAtualEl) anoAtualEl.textContent = new Date().getFullYear();
    Aparencia.aplicar();
    configurarLogin();
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);
});

function atualizarDataHora() {
    const el = document.getElementById('data-hora');
    if (el) el.textContent = new Date().toLocaleString('pt-BR');
}

function configurarLogin() {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuario = document.getElementById('login-usuario').value;
            const senha = document.getElementById('login-senha').value;
            const erro = document.getElementById('mensagem-erro');
            erro.classList.add('hidden');
            const hash = await hashSenha(senha);
            const encontrado = usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase() && u.senha === hash);
            if (!encontrado) {
                erro.textContent = 'Usuário ou senha incorretos!';
                erro.classList.remove('hidden');
                return;
            }
            if (!encontrado.ativo || !encontrado.aprovado) {
                erro.textContent = 'Usuário inativo ou pendente de aprovação!';
                erro.classList.remove('hidden');
                return;
            }
            usuarioLogado = encontrado;
            iniciarSistema();
        });
    }

    const btnMostrarSenha = document.getElementById('btn-mostrar-senha');
    if (btnMostrarSenha) {
        btnMostrarSenha.addEventListener('click', () => {
            const campo = document.getElementById('login-senha');
            const icone = document.querySelector('#btn-mostrar-senha i');
            campo.type = campo.type === 'password' ? 'text' : 'password';
            icone.classList.toggle('fa-eye');
            icone.classList.toggle('fa-eye-slash');
        });
    }

    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            usuarioLogado = null;
            document.getElementById('tela-login').classList.remove('hidden');
            document.getElementById('sistema').classList.add('hidden');
            document.getElementById('form-login').reset();
        });
    }
}

function iniciarSistema() {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('sistema').classList.remove('hidden');
    document.getElementById('perfil-usuario').textContent = usuarioLogado.perfil === 'ADM' ? 'Administrador' : 'Usuário';
    document.getElementById('nome-usuario-menu').textContent = usuarioLogado.nome;
    document.getElementById('perfil-usuario-menu').textContent = usuarioLogado.perfil === 'ADM' ? 'Administrador' : 'Usuário';
    
    construirMenu();
    
    const permissoesUsuario = usuarioLogado.permissoes || MODULOS_SISTEMA.map(m => m.id);
    if (usuarioLogado.perfil !== 'ADM' && !permissoesUsuario.includes(paginaAtual) && permissoesUsuario.length > 0) {
        paginaAtual = permissoesUsuario[0];
    }
    
    navegarPara(paginaAtual);
}

function construirMenu() {
    const menu = document.getElementById('menu-principal');
    if (!menu) return;

    const permissoesUsuario = usuarioLogado.permissoes || MODULOS_SISTEMA.map(m => m.id);

    const todosItens = [
        { id: 'painel', icone: 'fa-chart-pie', nome: 'Painel Principal', desc: 'Dashboard e Indicadores' },
        { id: 'equipamentos', icone: 'fa-desktop', nome: 'Equipamentos', desc: 'Parque de Ativos' },
        { id: 'chamados', icone: 'fa-ticket', nome: 'Central de Chamados', desc: 'Ocorrências e Suporte' },
        { id: 'meus-chamados', icone: 'fa-list-check', nome: 'Meus Chamados', desc: 'Acompanhamento Pessoal' },
        { id: 'usuarios', icone: 'fa-users-gear', nome: 'Gerenciar Usuários', desc: 'Controle de Acessos' },
        { id: 'categorias', icone: 'fa-tags', nome: 'Categorias e Subcategorias', desc: 'Classificação de Problemas' },
        { id: 'setores', icone: 'fa-building-shield', nome: 'Setores e Liberações', desc: 'Hierarquia e Permissões' },
        { id: 'aparencia', icone: 'fa-palette', nome: 'Aparência e Design', desc: 'Personalização Visual' },
        { id: 'historico', icone: 'fa-clock-rotate-left', nome: 'Histórico de Atividades', desc: 'Auditoria do Sistema' },
    ];

    const itensFiltrados = usuarioLogado.perfil === 'ADM' 
        ? todosItens 
        : todosItens.filter(item => permissoesUsuario.includes(item.id));
    
    menu.innerHTML = itensFiltrados.map(item => `
        <div class="menu-item flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${paginaAtual === item.id ? 'menu-item-ativo shadow-sm' : 'hover:bg-slate-800/60'}" data-pagina="${item.id}" style="${paginaAtual === item.id ? 'background-color: var(--cor-principal); color: #ffffff;' : 'color: #cbd5e1;'}">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-sm shadow-sm" style="${paginaAtual === item.id ? 'background-color: rgba(255,255,255,0.2); color: #ffffff;' : 'background-color: #1e293b; color: var(--cor-principal);'}">
                <i class="fa-solid ${item.icone}"></i>
            </div>
            <div class="flex flex-col">
                <span class="text-xs font-bold tracking-wide">${item.nome}</span>
                <span class="text-[10px] opacity-75">${item.desc}</span>
            </div>
        </div>
    `).join('');

    menu.querySelectorAll('.menu-item').forEach(link => {
        link.addEventListener('click', () => navegarPara(link.dataset.pagina));
    });
}

function navegarPara(pagina) {
    const permissoesUsuario = usuarioLogado.permissoes || MODULOS_SISTEMA.map(m => m.id);
    if (usuarioLogado.perfil !== 'ADM' && !permissoesUsuario.includes(pagina)) {
        alert('Você não tem permissão para acessar este módulo.');
        return;
    }

    paginaAtual = pagina;
    construirMenu();
    const titulos = {
        painel: 'Painel Principal <span class="text-xs font-normal text-slate-400 block mt-0.5">Visão geral e métricas de desempenho em tempo real</span>',
        equipamentos: 'Gestão de Equipamentos <span class="text-xs font-normal text-slate-400 block mt-0.5">Controle completo do parque tecnológico e ativos</span>',
        chamados: 'Central de Chamados <span class="text-xs font-normal text-slate-400 block mt-0.5">Acompanhamento e resolução de ocorrências de TI</span>',
        'meus-chamados': 'Meus Chamados <span class="text-xs font-normal text-slate-400 block mt-0.5">Histórico e solicitações abertas por você</span>',
        usuarios: 'Gerenciamento de Usuários <span class="text-xs font-normal text-slate-400 block mt-0.5">Controle de acessos, perfis, cadastros e permissões customizadas</span>',
        categorias: 'Gestão de Categorias <span class="text-xs font-normal text-slate-400 block mt-0.5">Organização de tipos de problemas e subcategorias</span>',
        setores: 'Gestão de Setores e Liberações <span class="text-xs font-normal text-slate-400 block mt-0.5">Alçadas e permissões corporativas estruturadas</span>',
        aparencia: 'Aparência e Design <span class="text-xs font-normal text-slate-400 block mt-0.5">Personalização avançada de cores, fontes, fundo e logotipo</span>',
        historico: 'Histórico de Alterações <span class="text-xs font-normal text-slate-400 block mt-0.5">Auditoria detalhada de eventos e modificações</span>'
    };
    const elTitulo = document.getElementById('titulo-pagina');
    if (elTitulo) elTitulo.innerHTML = titulos[pagina];
    const conteudo = document.getElementById('conteudo-pagina');
    if (!conteudo) return;

    switch(pagina) {
        case 'painel': carregarPainel(conteudo); break;
        case 'equipamentos': carregarEquipamentos(conteudo); break;
        case 'chamados': carregarChamados(conteudo); break;
        case 'meus-chamados': carregarMeusChamados(conteudo); break;
        case 'usuarios': if (usuarioLogado.perfil === 'ADM') carregarUsuarios(conteudo); break;
        case 'categorias': if (usuarioLogado.perfil === 'ADM') carregarCategorias(conteudo); break;
        case 'setores': carregarSetores(conteudo); break;
        case 'aparencia': if (usuarioLogado.perfil === 'ADM') carregarAparencia(conteudo); break;
        case 'historico': if (usuarioLogado.perfil === 'ADM') carregarHistorico(conteudo); break;
    }
    
    setTimeout(() => Aparencia.aplicar(), 50);
}

function carregarPainel(container) {
    const abertos = chamados.filter(c => c.status === 'Aberto').length;
    const ativos = equipamentos.filter(e => e.status === 'Ativo').length;
    const manutencao = equipamentos.filter(e => e.status === 'Manutenção').length;
    const totalChamados = chamados.length;
    const taxaResolucao = totalChamados > 0 ? (((totalChamados - abertos) / totalChamados) * 100).toFixed(1) : 100;
    
    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div class="painel relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 pointer-events-none" style="background-color: var(--cor-principal);"></div>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equipamentos Ativos</span>
                        <h4 class="text-3xl font-black text-slate-800 mt-1">${ativos}</h4>
                        <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-arrow-trend-up"></i> ${equipamentos.length} cadastrados</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner" style="background-color: var(--cor-principal-clara); color: var(--cor-principal);">
                        <i class="fa-solid fa-desktop"></i>
                    </div>
                </div>
            </div>

            <div class="painel relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-rose-500 opacity-10 pointer-events-none"></div>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chamados Abertos</span>
                        <h4 class="text-3xl font-black text-rose-600 mt-1">${abertos}</h4>
                        <span class="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 mt-2 bg-rose-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-triangle-exclamation"></i> Requer atenção</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-inner">
                        <i class="fa-solid fa-ticket"></i>
                    </div>
                </div>
            </div>

            <div class="painel relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-amber-500 opacity-10 pointer-events-none"></div>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Em Manutenção</span>
                        <h4 class="text-3xl font-black text-amber-600 mt-1">${manutencao}</h4>
                        <span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 mt-2 bg-amber-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-screwdriver-wrench"></i> Em reparo</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                        <i class="fa-solid fa-gears"></i>
                    </div>
                </div>
            </div>

            <div class="painel relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-500 opacity-10 pointer-events-none"></div>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Taxa de Resolução</span>
                        <h4 class="text-3xl font-black text-emerald-600 mt-1">${taxaResolucao}%</h4>
                        <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-circle-check"></i> Eficiência geral</span>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
                        <i class="fa-solid fa-chart-pie"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-chart-column" style="color: var(--cor-principal);"></i> Fluxo Mensal de Chamados
                        </h3>
                        <p class="text-xs text-slate-400 mt-0.5">Volume de ocorrências registradas ao longo dos meses do ano</p>
                    </div>
                </div>
                <div class="relative h-72"><canvas id="graficoMes"></canvas></div>
            </div>

            <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-circle-nodes text-emerald-600"></i> Atalhos Rápidos
                    </h3>
                    <p class="text-xs text-slate-400 mb-5">Ações frequentes no sistema</p>
                    
                    <div class="space-y-3">
                        <button onclick="navegarPara('chamados')" class="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition text-left group shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-lg bg-slate-50 shadow-sm flex items-center justify-center text-slate-700 group-hover:text-indigo-600 transition"><i class="fa-solid fa-ticket text-xs"></i></div>
                                <div>
                                    <p class="text-xs font-bold text-slate-800">Novo Chamado</p>
                                    <p class="text-[11px] text-slate-400">Abrir ocorrência de TI</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                        </button>

                        <button onclick="navegarPara('equipamentos')" class="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition text-left group shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-lg bg-slate-50 shadow-sm flex items-center justify-center text-slate-700 group-hover:text-indigo-600 transition"><i class="fa-solid fa-laptop text-xs"></i></div>
                                <div>
                                    <p class="text-xs font-bold text-slate-800">Equipamentos</p>
                                    <p class="text-[11px] text-slate-400">Gerenciar parque de ativos</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                        </button>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Versão 2.5 Pro</span>
                    <span class="text-emerald-600 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema Online</span>
                </div>
            </div>
        </div>
    `;
    renderizarGraficos();
}

function renderizarGraficos() {
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const totaisMeses = new Array(12).fill(0);
    chamados.forEach(c => {
        if (c.data) {
            const partes = c.data.split(' ')[0].split('/');
            if (partes.length === 3) {
                const mesIdx = parseInt(partes[1], 10) - 1;
                if (mesIdx >= 0 && mesIdx < 12) totaisMeses[mesIdx]++;
            }
        }
    });
    const corAtual = DB.get('aparencia', {}).corPrincipal || CONFIG.corPrincipalPadrao;
    const ctxMes = document.getElementById('graficoMes');
    if (ctxMes) {
        new Chart(ctxMes, {
            type: 'bar',
            data: { labels: mesesNomes, datasets: [{ label: 'Chamados', data: totaisMeses, backgroundColor: corAtual, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
        });
    }
}

// MÓDULO DE EQUIPAMENTOS
function carregarEquipamentos(container) {
    container.innerHTML = `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-desktop" style="color: var(--cor-principal);"></i> Cadastrar Novo Equipamento
            </h3>
            <form id="form-equipamento" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Patrimônio</label>
                        <input type="text" name="patrimonio" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: PAT-005" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Tipo</label>
                        <select name="tipo" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                            <option value="Notebook">Notebook</option>
                            <option value="Computador">Computador</option>
                            <option value="Impressora">Impressora</option>
                            <option value="Switch/Rede">Switch/Rede</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Marca / Modelo</label>
                        <input type="text" name="marcaModelo" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Dell Inspiron" required>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Setor</label>
                        <input type="text" name="setor" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Financeiro" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Responsável</label>
                        <input type="text" name="responsavel" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Nome do colaborador" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Status</label>
                        <select name="status" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                            <option value="Ativo">Ativo</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Baixado">Baixado</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primario text-xs px-4 py-2.5 rounded-xl font-semibold"><i class="fa-solid fa-plus"></i> Salvar Equipamento</button>
            </form>
        </div>

        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Parque de Ativos Cadastrados</h3>
            <div class="overflow-x-auto">
                <table class="tabela-moderna w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-100 text-xs text-slate-500">
                            <th class="p-3">Patrimônio</th>
                            <th class="p-3">Tipo / Modelo</th>
                            <th class="p-3">Setor</th>
                            <th class="p-3">Responsável</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs">
                        ${equipamentos.map(eq => `
                            <tr class="border-b border-slate-50 hover:bg-slate-50">
                                <td class="p-3 font-bold">${eq.patrimonio}</td>
                                <td class="p-3">${eq.tipo} - ${eq.marcaModelo}</td>
                                <td class="p-3">${eq.setor}</td>
                                <td class="p-3">${eq.responsavel}</td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${eq.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
                                        ${eq.status}
                                    </span>
                                </td>
                                <td class="p-3 text-right">
                                    <button onclick="removerEquipamento(${eq.id})" class="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i> Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelector('#form-equipamento').addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const novo = {
            id: DB.proximoId(equipamentos),
            ...data
        };
        equipamentos.push(novo);
        salvarTudo();
        historicoAlteracoes.unshift({ data: new Date().toLocaleString('pt-BR'), acao: `Equipamento cadastrado: ${novo.patrimonio}`, usuario: usuarioLogado.usuario });
        DB.set('historico', historicoAlteracoes);
        alert('Equipamento cadastrado com sucesso!');
        carregarEquipamentos(container);
    });
}

function removerEquipamento(id) {
    if (confirm('Deseja excluir este equipamento?')) {
        equipamentos = equipamentos.filter(e => e.id !== id);
        salvarTudo();
        navegarPara('equipamentos');
    }
}

// MÓDULO CENTRAL DE CHAMADOS
function carregarChamados(container) {
    const ehAdm = usuarioLogado.perfil === 'ADM';

    container.innerHTML = `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-ticket" style="color: var(--cor-principal);"></i> Abrir Novo Chamado de Suporte
            </h3>
            <form id="form-chamado" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Categoria</label>
                        <select name="categoria" id="select-cat-chamado" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white" onchange="atualizarSubcategoriasChamado(this.value)" required>
                            <option value="">Selecione...</option>
                            ${categoriasProblema.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Subcategoria</label>
                        <select name="subcategoria" id="select-subcat-chamado" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white" required>
                            <option value="">Selecione a categoria primeiro</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Prioridade</label>
                    <select name="prioridade" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                        <option value="Baixa">Baixa</option>
                        <option value="Média" selected>Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                    </select>
                </div>
                <div>
                    <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Descrição do Problema</label>
                    <textarea name="descricao" rows="3" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Descreva detalhadamente o ocorrido..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primario text-xs px-4 py-2.5 rounded-xl font-semibold"><i class="fa-solid fa-paper-plane"></i> Enviar Chamado</button>
            </form>
        </div>

        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Histórico de Chamados Geral</h3>
            <div class="overflow-x-auto">
                <table class="tabela-moderna w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-100 text-xs text-slate-500">
                            <th class="p-3">ID</th>
                            <th class="p-3">Solicitante</th>
                            <th class="p-3">Categoria / Sub</th>
                            <th class="p-3">Prioridade</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Ações / Mudar Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs">
                        ${chamados.map(ch => `
                            <tr class="border-b border-slate-50 hover:bg-slate-50">
                                <td class="p-3 font-bold">#${ch.id}</td>
                                <td class="p-3">${ch.solicitante}</td>
                                <td class="p-3">${ch.categoria} <br><span class="text-[10px] text-slate-400">${ch.subcategoria || ''}</span></td>
                                <td class="p-3"><span class="font-bold text-slate-700">${ch.prioridade}</span></td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${ch.status === 'Aberto' ? 'bg-rose-50 text-rose-600' : (ch.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}">
                                        ${ch.status}
                                    </span>
                                </td>
                                <td class="p-3 text-right space-x-2">
                                    ${ehAdm ? `
                                        <select onchange="alterarStatusChamado(${ch.id}, this.value)" class="campo p-1 text-xs rounded-lg border border-slate-200 bg-white">
                                            <option value="Aberto" ${ch.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                                            <option value="Em Andamento" ${ch.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                                            <option value="Resolvido" ${ch.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                                        </select>
                                        ${ch.status !== 'Resolvido' ? `<button onclick="alterarStatusChamado(${ch.id}, 'Resolvido'); navegarPara('chamados');" class="text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 bg-emerald-50 rounded-lg text-xs" title="Concluir Chamado"><i class="fa-solid fa-check"></i> Concluir</button>` : ''}
                                        <button onclick="removerChamado(${ch.id})" class="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i></button>
                                    ` : `
                                        <span class="text-slate-400 italic text-[11px]">Apenas visualização</span>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelector('#form-chamado').addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const novo = {
            id: DB.proximoId(chamados),
            solicitante: usuarioLogado.nome,
            status: 'Aberto',
            data: new Date().toLocaleString('pt-BR'),
            ...data
        };
        chamados.unshift(novo);
        salvarTudo();
        alert('Chamado aberto com sucesso!');
        carregarChamados(container);
    });
}

function atualizarSubcategoriasChamado(nomeCat) {
    const selectSub = document.getElementById('select-subcat-chamado');
    if (!selectSub) return;
    const cat = categoriasProblema.find(c => c.nome === nomeCat);
    if (!cat || !cat.subcategorias || cat.subcategorias.length === 0) {
        selectSub.innerHTML = `<option value="">Nenhuma subcategoria disponível</option>`;
        return;
    }
    selectSub.innerHTML = cat.subcategorias.map(s => `<option value="${s}">${s}</option>`).join('');
}

function alterarStatusChamado(id, novoStatus) {
    if (usuarioLogado.perfil !== 'ADM') {
        alert('Apenas administradores podem modificar chamados.');
        return;
    }
    const ch = chamados.find(c => c.id === id);
    if (ch) {
        ch.status = novoStatus;
        salvarTudo();
        alert(`Status do chamado #${ch.id} atualizado para ${novoStatus}`);
    }
}

function removerChamado(id) {
    if (usuarioLogado.perfil !== 'ADM') {
        alert('Apenas administradores podem excluir chamados.');
        return;
    }
    if (confirm('Deseja excluir este chamado?')) {
        chamados = chamados.filter(c => c.id !== id);
        salvarTudo();
        navegarPara('chamados');
    }
}

function carregarMeusChamados(container) {
    const meus = chamados.filter(c => c.solicitante === usuarioLogado.nome);
    container.innerHTML = `
        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Meus Chamados Abertos (<span style="color: var(--cor-principal);">${meus.length}</span>)</h3>
            <div class="overflow-x-auto">
                <table class="tabela-moderna w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-100 text-xs text-slate-500">
                            <th class="p-3">ID</th>
                            <th class="p-3">Categoria</th>
                            <th class="p-3">Descrição</th>
                            <th class="p-3">Prioridade</th>
                            <th class="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs">
                        ${meus.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhum chamado encontrado em seu nome.</td></tr>` : 
                        meus.map(ch => `
                            <tr class="border-b border-slate-50">
                                <td class="p-3 font-bold">#${ch.id}</td>
                                <td class="p-3">${ch.categoria}</td>
                                <td class="p-3">${ch.descricao}</td>
                                <td class="p-3">${ch.prioridade}</td>
                                <td class="p-3"><span class="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${ch.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function carregarSetores(container) {
    const ehAdm = usuarioLogado.perfil === 'ADM';

    container.innerHTML = `
        ${ehAdm ? `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-building-shield" style="color: var(--cor-principal);"></i> Cadastrar Novo Setor e Alçada
            </h3>
            <form id="form-novo-setor" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Nome do Setor</label>
                        <input type="text" name="nomeSetor" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Logística" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Tipo de Liberação / Descrição</label>
                        <input type="text" name="tipoLiberacao" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Gestão de Estoque e Entregas" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primario text-xs px-4 py-2.5 rounded-xl font-semibold"><i class="fa-solid fa-plus"></i> Salvar Setor</button>
            </form>
        </div>
        ` : ''}

        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Gerenciamento de Setores e Liberações Cadastradas</h3>
            <div class="space-y-3">
                ${setoresLiberacoes.map(s => `
                    <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                        <div>
                            <p class="font-bold text-slate-800">${s.nome}</p>
                            <p class="text-slate-500">${s.tipoLiberacao}</p>
                        </div>
                        ${ehAdm ? `
                            <button onclick="removerSetor(${s.id})" class="text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i> Excluir</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    if (ehAdm) {
        container.querySelector('#form-novo-setor').addEventListener('submit', e => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const novoSetor = {
                id: DB.proximoId(setoresLiberacoes),
                nome: formData.get('nomeSetor'),
                tipoLiberacao: formData.get('tipoLiberacao')
            };
            setoresLiberacoes.push(novoSetor);
            salvarTudo();
            historicoAlteracoes.unshift({ data: new Date().toLocaleString('pt-BR'), acao: `Setor criado: ${novoSetor.nome}`, usuario: usuarioLogado.usuario });
            DB.set('historico', historicoAlteracoes);
            alert('Setor cadastrado com sucesso!');
            carregarSetores(container);
        });
    }
}

function removerSetor(id) {
    if (usuarioLogado.perfil !== 'ADM') return;
    if (confirm('Deseja realmente excluir este setor?')) {
        setoresLiberacoes = setoresLiberacoes.filter(s => s.id !== id);
        salvarTudo();
        navegarPara('setores');
    }
}

function carregarHistorico(container) {
    if (usuarioLogado.perfil !== 'ADM') return;
    container.innerHTML = `
        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Histórico e Auditoria Geral</h3>
            <div class="space-y-2">
                ${historicoAlteracoes.length === 0 ? `<p class="text-xs text-slate-400">Nenhuma alteração registrada ainda.</p>` :
                historicoAlteracoes.map(h => `
                    <div class="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs flex justify-between">
                        <span><strong>${h.usuario}</strong>: ${h.acao}</span>
                        <span class="text-slate-400">${h.data}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function carregarAparencia(container) {
    const aparencia = DB.get('aparencia', {
        opacidade: CONFIG.opacidadeFundo,
        desfoque: CONFIG.desfoqueFundo,
        corPrincipal: CONFIG.corPrincipalPadrao,
        corTexto: CONFIG.corTextoPadrao,
        fonteTexto: CONFIG.fontePadrao
    });

    container.innerHTML = `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-palette" style="color: var(--cor-principal);"></i> Configurações Visuais e Globais
            </h3>
            <form id="form-aparencia" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Cor Principal</label>
                        <input type="color" name="corPrincipal" class="campo h-10 p-1 cursor-pointer w-full rounded-xl border border-slate-200" value="${aparencia.corPrincipal}">
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Cor do Texto Padrão</label>
                        <input type="color" name="corTexto" class="campo h-10 p-1 cursor-pointer w-full rounded-xl border border-slate-200" value="${aparencia.corTexto || CONFIG.corTextoPadrao}">
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Fonte do Sistema</label>
                        <select name="fonteTexto" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700">
                            <option value="Inter, sans-serif" ${aparencia.fonteTexto.includes('Inter') ? 'selected' : ''}>Inter (Padrão Moderna)</option>
                            <option value="Roboto, sans-serif" ${aparencia.fonteTexto.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                            <option value="Segoe UI, sans-serif" ${aparencia.fonteTexto.includes('Segoe UI') ? 'selected' : ''}>Segoe UI</option>
                            <option value="Poppins, sans-serif" ${aparencia.fonteTexto.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                            <option value="Montserrat, sans-serif" ${aparencia.fonteTexto.includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                            <option value="Open Sans, sans-serif" ${aparencia.fonteTexto.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                            <option value="Lato, sans-serif" ${aparencia.fonteTexto.includes('Lato') ? 'selected' : ''}>Lato</option>
                            <option value="Courier New, monospace" ${aparencia.fonteTexto.includes('Courier New') ? 'selected' : ''}>Courier New (Mono)</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Logotipo do Sistema (Arquivo de Imagem)</label>
                        <input type="file" id="input-logo" accept="image/*" class="campo w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer">
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Imagem de Fundo do Sistema (Arquivo de Imagem)</label>
                        <input type="file" id="input-fundo" accept="image/*" class="campo w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Opacidade do Fundo (${aparencia.opacidade}%)</label>
                        <input type="range" name="opacidade" min="0" max="100" class="w-full accent-indigo-600" value="${aparencia.opacidade}">
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Desfoque do Fundo (${aparencia.desfoque}px)</label>
                        <input type="range" name="desfoque" min="0" max="20" class="w-full accent-indigo-600" value="${aparencia.desfoque}">
                    </div>
                </div>
                <button type="submit" class="btn bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2"><i class="fa-solid fa-floppy-disk text-emerald-600"></i> Salvar Alterações</button>
            </form>
        </div>
    `;

    container.querySelector('#form-aparencia').addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        
        const arquivoLogo = container.querySelector('#input-logo').files[0];
        const arquivoFundo = container.querySelector('#input-fundo').files[0];
        
        let logoBase64 = null;
        let fundoBase64 = null;

        if (arquivoLogo) logoBase64 = await Aparencia.lerImagem(arquivoLogo);
        if (arquivoFundo) fundoBase64 = await Aparencia.lerImagem(arquivoFundo);

        Aparencia.salvar(logoBase64, fundoBase64, Number(data.opacidade), Number(data.desfoque), data.corPrincipal, data.corTexto, data.fonteTexto);
        alert('Configurações visuais aplicadas com sucesso!');
        Aparencia.aplicar();
        navegarPara('aparencia');
    });
}

function carregarCategorias(container) {
    if (usuarioLogado.perfil !== 'ADM') {
        container.innerHTML = `<div class="painel bg-white rounded-2xl p-6 text-center text-rose-600 font-bold">Acesso restrito a Administradores.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-tags" style="color: var(--cor-principal);"></i> Adicionar Nova Categoria de Problema
            </h3>
            <form id="form-nova-categoria" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Nome da Categoria</label>
                        <input type="text" name="nomeCategoria" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Segurança da Informação" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Subcategorias (separadas por vírgula)</label>
                        <input type="text" name="subcategorias" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Antivírus, Firewall, Senhas">
                    </div>
                </div>
                <button type="submit" class="btn btn-primario text-xs px-4 py-2.5 rounded-xl"><i class="fa-solid fa-plus"></i> Cadastrar Categoria</button>
            </form>
        </div>

        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Categorias Existentes</h3>
            <div class="overflow-x-auto">
                <table class="tabela-moderna w-full text-left">
                    <thead>
                        <tr class="border-b border-slate-100 text-xs text-slate-500">
                            <th class="p-3">ID</th>
                            <th class="p-3">Categoria</th>
                            <th class="p-3">Subcategorias</th>
                            <th class="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs">
                        ${categoriasProblema.map(cat => `
                            <tr class="border-b border-slate-50">
                                <td class="p-3">#${cat.id}</td>
                                <td class="p-3 font-bold">${cat.nome}</td>
                                <td class="p-3">${cat.subcategorias ? cat.subcategorias.join(', ') : 'Nenhuma'}</td>
                                <td class="p-3 text-right">
                                    <button onclick="removerCategoria(${cat.id})" class="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i> Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelector('#form-nova-categoria').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const nome = formData.get('nomeCategoria');
        const subsStr = formData.get('subcategorias');
        const subcategorias = subsStr ? subsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        const novaCat = {
            id: DB.proximoId(categoriasProblema),
            nome,
            subcategorias
        };

        categoriasProblema.push(novaCat);
        salvarTudo();
        historicoAlteracoes.unshift({ data: new Date().toLocaleString('pt-BR'), acao: `Categoria criada: ${nome}`, usuario: usuarioLogado.usuario });
        DB.set('historico', historicoAlteracoes);
        alert('Categoria adicionada com sucesso!');
        carregarCategorias(container);
    });
}

function removerCategoria(id) {
    if (confirm('Deseja realmente excluir esta categoria?')) {
        categoriasProblema = categoriasProblema.filter(c => c.id !== id);
        salvarTudo();
        alert('Categoria removida.');
        navegarPara('categorias');
    }
}

// MÓDULO DE GERENCIAMENTO DE USUÁRIOS E PERMISSÕES CUSTOMIZADAS
function carregarUsuarios(container) {
    if (usuarioLogado.perfil !== 'ADM') return;

    container.innerHTML = `
        <div class="painel mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <i class="fa-solid fa-user-plus" style="color: var(--cor-principal);"></i> Cadastrar Novo Usuário e Definir Permissões
            </h3>
            <form id="form-novo-usuario" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Nome de Usuário (Login)</label>
                        <input type="text" name="usuario" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: carlos.silva" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Nome Completo</label>
                        <input type="text" name="nome" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="Ex: Carlos Silva" required>
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Senha Inicial</label>
                        <input type="password" name="senha" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="******" required>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">E-mail</label>
                        <input type="email" name="email" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs" placeholder="carlos@empresa.com.br">
                    </div>
                    <div>
                        <label class="rotulo text-xs font-semibold text-slate-600 block mb-1">Perfil Principal</label>
                        <select name="perfil" class="campo w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                            <option value="USER">Usuário Comum / Operacional</option>
                            <option value="ADM">Administrador Geral</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="rotulo text-xs font-semibold text-slate-700 block mb-2">Módulos Liberados para Acesso:</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        ${MODULOS_SISTEMA.map(m => `
                            <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                <input type="checkbox" name="permissoes" value="${m.id}" checked class="w-4 h-4 rounded text-indigo-600 accent-indigo-600">
                                ${m.nome}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <button type="submit" class="btn btn-primario text-xs px-4 py-2.5 rounded-xl"><i class="fa-solid fa-user-check"></i> Criar Usuário com Permissões</button>
            </form>
        </div>

        <div class="painel bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4 text-sm">Usuários Cadastrados no Sistema</h3>
            <div class="overflow-x-auto">
                <table class="tabela-moderna w-full text-left">
                    <thead>
                        <tr class="border-b border-slate-100 text-xs text-slate-500">
                            <th class="p-3">Login / Nome</th>
                            <th class="p-3">E-mail</th>
                            <th class="p-3">Perfil</th>
                            <th class="p-3">Acessos Liberados</th>
                            <th class="p-3 text-right">Ações do ADM</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs">
                        ${usuarios.map(u => `
                            <tr class="border-b border-slate-50">
                                <td class="p-3">
                                    <span class="font-bold text-slate-800">${u.usuario}</span><br>
                                    <span class="text-slate-400 text-[11px]">${u.nome}</span>
                                </td>
                                <td class="p-3">${u.email || '-'}</td>
                                <td class="p-3">
                                    <select onchange="alterarPerfilUsuario(${u.id}, this.value)" class="campo p-1 text-xs rounded-lg border border-slate-200">
                                        <option value="ADM" ${u.perfil === 'ADM' ? 'selected' : ''}>Administrador</option>
                                        <option value="USER" ${u.perfil === 'USER' ? 'selected' : ''}>Usuário</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <button onclick="abrirModalPermissoes(${u.id})" class="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><i class="fa-solid fa-key"></i> Configurar Menus (${u.permissoes ? u.permissoes.length : MODULOS_SISTEMA.length})</button>
                                </td>
                                <td class="p-3 text-right space-x-2">
                                    <button onclick="alternarStatusUsuario(${u.id})" class="text-xs font-semibold px-2 py-1 ${u.ativo ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'} rounded-lg">
                                        ${u.ativo ? 'Desativar' : 'Ativar'}
                                    </button>
                                    ${u.id !== usuarioLogado.id ? `<button onclick="removerUsuario(${u.id})" class="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 bg-rose-50 rounded-lg"><i class="fa-solid fa-trash"></i></button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-permissoes" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                <h3 class="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2"><i class="fa-solid fa-shield-halved text-indigo-600"></i> Editar Módulos Permitidos</h3>
                <p class="text-xs text-slate-400 mb-4">Selecione quais telas este usuário poderá visualizar no menu lateral:</p>
                <div id="lista-checks-modal" class="space-y-2 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4"></div>
                <div class="flex justify-end gap-2">
                    <button onclick="fecharModalPermissoes()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">Cancelar</button>
                    <button id="btn-salvar-modal-permissoes" class="px-4 py-2 rounded-xl text-white text-xs font-semibold" style="background-color: var(--cor-principal);">Salvar Permissões</button>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#form-novo-usuario').addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const usuarioInput = formData.get('usuario');
        
        if (usuarios.some(u => u.usuario.toLowerCase() === usuarioInput.toLowerCase())) {
            alert('Este nome de usuário já existe!');
            return;
        }

        const checkboxes = container.querySelectorAll('input[name="permissoes"]:checked');
        const permissoes = Array.from(checkboxes).map(cb => cb.value);

        const senhaHash = await hashSenha(formData.get('senha'));

        const novoUser = {
            id: DB.proximoId(usuarios),
            usuario: usuarioInput,
            nome: formData.get('nome'),
            email: formData.get('email'),
            senha: senhaHash,
            perfil: formData.get('perfil'),
            ativo: true,
            aprovado: true,
            permissoes: permissoes
        };

        usuarios.push(novoUser);
        salvarTudo();
        historicoAlteracoes.unshift({ data: new Date().toLocaleString('pt-BR'), acao: `Novo usuário criado: ${novoUser.usuario}`, usuario: usuarioLogado.usuario });
        DB.set('historico', historicoAlteracoes);
        alert('Usuário cadastrado com sucesso!');
        carregarUsuarios(container);
    });
}

let usuarioEditandoId = null;
function abrirModalPermissoes(id) {
    usuarioEditandoId = id;
    const u = usuarios.find(item => item.id === id);
    if (!u) return;
    const userPermissoes = u.permissoes || MODULOS_SISTEMA.map(m => m.id);

    const containerChecks = document.getElementById('lista-checks-modal');
    containerChecks.innerHTML = MODULOS_SISTEMA.map(m => `
        <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" value="${m.id}" ${userPermissoes.includes(m.id) ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600 accent-indigo-600 check-modal-perm">
            ${m.nome}
        </label>
    `).join('');

    document.getElementById('modal-permissoes').classList.remove('hidden');

    document.getElementById('btn-salvar-modal-permissoes').onclick = () => {
        const checks = document.querySelectorAll('.check-modal-perm:checked');
        u.permissoes = Array.from(checks).map(c => c.value);
        salvarTudo();
        alert('Permissões atualizadas com sucesso!');
        fecharModalPermissoes();
        navegarPara('usuarios');
    };
}

function fecharModalPermissoes() {
    document.getElementById('modal-permissoes').classList.add('hidden');
    usuarioEditandoId = null;
}

function alterarPerfilUsuario(id, novoPerfil) {
    const user = usuarios.find(u => u.id === id);
    if (user) {
        user.perfil = novoPerfil;
        salvarTudo();
        alert(`Permissão do usuário ${user.usuario} alterada para ${novoPerfil} com sucesso!`);
    }
}

function alternarStatusUsuario(id) {
    const user = usuarios.find(u => u.id === id);
    if (user) {
        user.ativo = !user.ativo;
        user.aprovado = true;
        salvarTudo();
        navegarPara('usuarios');
    }
}

function removerUsuario(id) {
    if (confirm('Deseja realmente excluir este usuário?')) {
        usuarios = usuarios.filter(u => u.id !== id);
        salvarTudo();
        navegarPara('usuarios');
    }
}