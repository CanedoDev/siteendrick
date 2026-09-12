// Força a página a sempre carregar no topo e evita que o navegador memorize o scroll
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// Variável para checar se a página já carregou completamente
let isLoaded = document.readyState === "complete";
if (!isLoaded) {
    window.addEventListener("load", () => {
        isLoaded = true;
        if (window.waitingForLoad) {
            window.waitingForLoad();
        }
    });
    // Fallback de segurança para conexões mais lentas
    setTimeout(() => {
        if (!isLoaded) {
            isLoaded = true;
            if (window.waitingForLoad) {
                window.waitingForLoad();
            }
        }
    }, 4000);
}

// Impede o scroll inicialmente
document.body.style.overflow = "hidden";

const loaderTimeline = gsap.timeline({
    onComplete: () => {
        // Habilita o scroll do body
        document.body.style.overflow = "auto";
        // INICIA SCROLL TRIGGERS APENAS AQUI!
        initScrollAnimations();
    }
});

const texts = gsap.utils.toArray('.loader-text');
gsap.set(texts, { opacity: 0, rotateX: -90, transformOrigin: "center center", transformPerspective: 800 });

texts.forEach((text, index) => {
    let isLast = index === texts.length - 1;
    let durationIn = 0.4;
    let delayOut = isLast ? 0.8 : 0.4;

    // Anima a entrada (gira de -90 até 0)
    loaderTimeline.to(text,
        { opacity: 1, rotateX: 0, duration: durationIn, ease: "back.out(1.5)" }
    );

    // Anima a saída
    if (!isLast) {
        loaderTimeline.to(text, {
            opacity: 0,
            rotateX: 90,
            duration: 0.3,
            ease: "power2.in",
            delay: delayOut
        });
    } else {
        // Última frase (ENDRICK!!!) - Fica na tela até carregar o site
        loaderTimeline.add(() => {
            if (!isLoaded) {
                loaderTimeline.pause(); // Pausa a timeline
                // Efeito pulsante enquanto espera a internet carregar
                gsap.to(text, { scale: 1.05, opacity: 0.8, repeat: -1, yoyo: true, duration: 0.4, ease: "sine.inOut" });

                // Quando o evento 'load' disparar, ele chama isso:
                window.waitingForLoad = () => {
                    gsap.killTweensOf(text); // Para de pulsar
                    gsap.to(text, { scale: 1, opacity: 1, duration: 0.2, onComplete: () => loaderTimeline.play() });
                };
            }
        }, `+=${delayOut}`); // Aplica o tempo de leitura antes de decidir pausar

        // A última frase dá um zoom para sumir antes de revelar a hero
        loaderTimeline.to(text, {
            opacity: 0,
            scale: 2,
            duration: 0.5,
            ease: "power2.inOut"
        });
    }
});

loaderTimeline
    // Loader apenas desaparece em vez de subir
    .to("#loader", { opacity: 0, duration: 0.5, ease: "power2.inOut" })
    .set("#loader", { display: "none" }) // Oculta para não bloquear cliques
    // Animação de entrada da Hero (fundo preto e crescimento) começando junto com o sumiço do loader
    .fromTo("#combined-section-wrapper",
        { backgroundColor: "#000000" },
        { backgroundColor: "transparent", duration: 1.5, ease: "power2.inOut" },
        "-=0.5"
    )
    .fromTo("#hero",
        { scale: 0, opacity: 0, transformOrigin: "center center", clipPath: "inset(0% 0% 0% 0%)" },
        { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" },
        "<"
    );
// ==========================================
// Limite de Loop do Vídeo Global (0.4s a 7.8s)
// ==========================================
const globalVideoContent = document.querySelector('.global-fixed-video video');
if (globalVideoContent) {
    const setStartTime = () => {
        if (globalVideoContent.currentTime < 0.3 || globalVideoContent.currentTime >= 7.8) {
            globalVideoContent.currentTime = 0.3;
        }
    };

    if (globalVideoContent.readyState >= 1) {
        setStartTime();
    } else {
        globalVideoContent.addEventListener('loadedmetadata', setStartTime, { once: true });
    }

    globalVideoContent.addEventListener('timeupdate', function () {
        if (this.currentTime >= 7.8) {
            this.currentTime = 0.4;
            this.play().catch(e => console.log(e));
        }
    });

    globalVideoContent.addEventListener('ended', function () {
        this.currentTime = 0.4;
        this.play().catch(e => console.log(e));
    });
}



// ==========================================
// Efeito de Reveal (Hover) na Hero Section
// ==========================================
const heroContainer = document.querySelector('.hero-images-container');
const revealImage = document.querySelector('.hero-image-reveal');

if (heroContainer && revealImage) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isHovering = false;

    // Estado principal da bolinha do mouse
    const mainState = { size: 0 };
    let idleTimeout;

    heroContainer.addEventListener('mousemove', (e) => {
        const rect = heroContainer.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;

        // Sempre que mover, garante que a bolinha está no tamanho máximo
        gsap.to(mainState, { size: 250, duration: 0.4, ease: "power2.out", overwrite: "auto" });

        // Limpa o timer de inatividade
        clearTimeout(idleTimeout);

        // Se o mouse ficar parado por 500ms (dlay), a bolinha some
        idleTimeout = setTimeout(() => {
            gsap.to(mainState, { size: 0, duration: 0.8, ease: "power2.out", overwrite: "auto" });
        }, 500);
    });

    heroContainer.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    heroContainer.addEventListener('mouseleave', () => {
        isHovering = false;
        clearTimeout(idleTimeout);
        gsap.to(mainState, { size: 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
    });

    gsap.ticker.add(() => {
        // Interpolação para movimento suave do reveal principal (fator menor = mais atraso)
        currentX += (targetX - currentX) * 0.03;
        currentY += (targetY - currentY) * 0.03;

        // Aplica a máscara final sempre, garantindo que em 0px ela oculte totalmente o Pelé
        let currentSize = Math.max(0, mainState.size);
        let maskString = `radial-gradient(circle ${currentSize}px at ${currentX}px ${currentY}px, black 0%, black 50%, transparent 100%)`;
        revealImage.style.webkitMaskImage = maskString;
        revealImage.style.maskImage = maskString;
    });
}

function initScrollAnimations() {
    // 3 e 4. Seção Combinada: Textos Parallax + Vídeo + Scroll Horizontal
    const videoContainer = document.querySelector(".global-fixed-video");
    const scrollContainers = document.querySelectorAll(".combined-scroll-container");
    const scrollingTextContent = document.querySelector(".scrolling-text-content");

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#combined-section-wrapper',
            start: 'top top',
            end: "+=8500",
            scrub: 1.5,
            pin: true
        }
    });

    tl.addLabel("inicio", 0);

    // 1. Hover na hero agora funciona o tempo todo, sem pointerEvents: none

    // A) Animação Hero Shrink
    tl.fromTo("#hero",
        { clipPath: "inset(0% 0% 0% 0% round 0px)", scale: 1 },
        {
            clipPath: "inset(15% 30% 15% 30% round 5px)",
            scale: 0,
            duration: 1.5,
            ease: "power2.inOut",
            immediateRender: false
        },
        "inicio"
    );

    tl.fromTo(videoContainer,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1.5 },
        "inicio+=1.5"
    );

    tl.to(".autograph-container", { opacity: 1, duration: 0.1 }, "inicio+=2.5");

    const autoPath = document.querySelector('.autograph-path');
    if (autoPath) {
        const length = autoPath.getTotalLength() || 15000;

        gsap.set(autoPath, {
            strokeDasharray: length,
            strokeDashoffset: length,
            fillOpacity: 0
        });

        tl.to(autoPath, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, "inicio+=2.5");
        tl.to(autoPath, { fillOpacity: 1, duration: 0.3, ease: "none" }, "inicio+=3.1");
        tl.to(autoPath, { strokeDashoffset: length, duration: 1, ease: "none" }, "inicio+=3.6");
        tl.to(autoPath, { fillOpacity: 0, duration: 0.3, ease: "none" }, "inicio+=4.1");
        tl.to(".autograph-container", { opacity: 0, duration: 0.1 }, "inicio+=4.6");
    } else {
        tl.to(videoContainer, { duration: 1.5 }, "inicio+=2.5");
    }

    let amountToScroll = window.innerWidth * 2.3;
    tl.to(scrollContainers, {
        x: -amountToScroll,
        ease: "none",
        duration: 5.0
    }, "inicio+=4.6");

    tl.addLabel("galeriaStart", "inicio+=4.6");

    tl.to("#combined-wrapper", {
        backgroundColor: "transparent",
        color: "#111",
        ease: "none",
        duration: 1.5
    }, "inicio+=8.1");

    // ==========================================
    let videoPinDuration = 2250; // Ajustado para remover o gap vazio e reduzir scroll pela metade

    ScrollTrigger.create({
        trigger: "#rotational-wrapper",
        start: "top top",
        end: () => `+=${videoPinDuration}`,
        pin: true,
        pinSpacing: false // Não precisa de double spacing
    });

    const videoTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#spc-video-wrapper", // O wrapper que engloba SPC
            start: "top top",
            end: () => `+=${videoPinDuration}`,
            scrub: 1.5,
            pin: true,
            pinSpacing: true
        }
    });

    videoTl.addLabel("start");

    // 1. Texto 1 (Esquerda) sobe direto sem parar, aparecendo e sumindo
    videoTl.fromTo(".spc-text-1",
        { y: 100 },
        { y: -100, duration: 2, ease: "none" },
        "start"
    );
    videoTl.fromTo(".spc-text-1",
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power1.inOut" },
        "start"
    );
    videoTl.to(".spc-text-1",
        { opacity: 0, duration: 0.5, ease: "power1.inOut" },
        "start+=1.5"
    );

    // 2. Texto 2 (Direita) sobe direto sem parar, aparecendo e sumindo
    videoTl.fromTo(".spc-text-2",
        { y: 100 },
        { y: -100, duration: 2, ease: "none" },
        "start+=1.5"
    );
    videoTl.fromTo(".spc-text-2",
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power1.inOut" },
        "start+=1.5"
    );
    videoTl.to(".spc-text-2",
        { opacity: 0, duration: 0.5, ease: "power1.inOut" },
        "start+=3.0"
    );

    // 3. Vídeo GLOBAL some para a animação rotacional entrar limpa
    videoTl.to(".global-fixed-video", { opacity: 0, duration: 0.5 }, "start+=4.0");

    // 4. Rotação do Vídeo Rotacional entra na sequência
    videoTl.fromTo("#big-video-section",
        {
            rotateX: 90,
            scaleX: 0.5,
            opacity: 0,
            transformOrigin: "center bottom",
            transformPerspective: 3000,
            borderRadius: '30px',
            overflow: 'hidden'
        },
        {
            rotateX: 0,
            scale: 1,
            scaleX: 1,
            opacity: 1,
            duration: 1.5,
            borderRadius: '0px',
            ease: "power2.out"
        },
        "start+=4.5"
    );

    // Gap final para a pessoa conseguir assistir o vídeo inteiro
    videoTl.to({}, { duration: 1.5 });

    // ==========================================
    // 7. Imagens Sequenciais (Depois do vídeo)
    // ==========================================
    let seqPinDuration = 2500;

    const sequentialTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#sequential-images-wrapper",
            start: "top top",
            end: () => `+=${seqPinDuration}`,
            scrub: 1.5,
            pin: true,
            pinSpacing: true
        }
    });

    sequentialTl.addLabel("inicio");
    sequentialTl.to(".global-fixed-video", { opacity: 1, duration: 1 }, "inicio");
    sequentialTl.addLabel("estatisticasStart", "inicio+1");

    gsap.utils.toArray(".sequential-stat").forEach((stat, index) => {
        let delay = index * 1; // Cada texto tem seu tempo na pista

        let statTl = gsap.timeline();

        // Surge do fundo (como saindo do túnel), ganha opacidade enquanto sobe até o centro
        statTl.fromTo(stat,
            { y: 300, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "none" }
        );

        // Continua subindo e perde opacidade (entrando no próximo túnel)
        statTl.to(stat,
            { y: -300, opacity: 0, duration: 1, ease: "none" }
        );

        // Adiciona essa sub-timeline na timeline principal de scroll
        sequentialTl.add(statTl, `inicio+=${delay}`);
    });

    // ==========================================
    // 9. Linha do Tempo de Títulos
    // ==========================================
    let timelinePinDuration = 4000;

    const timelineTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#timeline-wrapper",
            start: "top top",
            end: () => `+=${timelinePinDuration}`,
            scrub: 1.5,
            pin: true,
            pinSpacing: true
        }
    });

    // Animação horizontal da faixa (ocorre do começo ao fim)
    let horizTween = timelineTl.to("#timeline-horizontal-track", {
        x: "-900vw",
        ease: "none",
        duration: 1
    });

    // Animação sincronizada dos fundos amarelos (baseada na posição de cada item no scroll)
    gsap.utils.toArray('.timeline-item').forEach((item, index) => {
        let title = item.querySelector('.timeline-title');
        let year = item.querySelector('.timeline-year');

        if (title || year) {
            // Cada item está a 150vw de distância (100vw do item + 50vw de margem)
            // O scroll total move 900vw ao longo de duration: 1.
            // O item 'index' está na posição '150 * index' vw.
            // Queremos que a animação dispare quando a borda esquerda dele chegar a 60vw da tela.
            // Isso acontece quando x = -(150 * index - 60)
            let triggerX = (150 * index) - 60;

            // Converte a posição em tempo (0 a 1) na timeline
            let triggerTime = triggerX / 900;

            // Garante que o primeiro item já anime de cara se a conta der negativo
            triggerTime = Math.max(0, triggerTime);

            timelineTl.to([title, year], {
                "--bg-translate": "0%",
                color: "#111", // Animado pelo GSAP para #111
                duration: 0.15, // Duração rápida
                ease: "power2.out"
            }, triggerTime);
        }
    });

    // Transição do background revelando a imagem do herói (ganha opacidade)
    timelineTl.to(".timeline-bg-overlay", {
        opacity: 1,
        ease: "none",
        duration: 0.5
    }, 0.5); // Começa em 0.5 da timeline inteira

    // Adiciona um pequeno gap de scroll no final da SV (para não ir direto pra próxima seção)
    timelineTl.to({}, { duration: 0.15 });
    // ==========================================
    // Barra de Progresso Superior
    // ==========================================
    gsap.to(".scroll-progress-bar", {
        width: "100%",
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.1
        }
    });

    // ==========================================
    // 10. Seção Imagem Fixa sob o Footer
    // ==========================================
    ScrollTrigger.create({
        trigger: "#cards-normal",
        start: "top top", // Pina quando a última seção chega no topo
        end: () => `+=${document.querySelector('#footer').offsetHeight}`,
        pin: true,
        pinSpacing: false, // Footer vai deslizar por cima desta seção
    });

    // ==========================================
    // Navegação do Menu Topo (ScrollToPlugin)
    // ==========================================
    document.querySelectorAll('.top-menu a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            let targetId = this.getAttribute('href');

            let scrollTarget = targetId;

            // Regras Específicas
            if (targetId === '#hero') {
                scrollTarget = 0;
            } else if (targetId === '#combined-wrapper') {
                // Vai direto para o momento em que a Galeria (Scroll Horizontal) começa
                scrollTarget = tl.scrollTrigger.labelToScroll("galeriaStart");
            } else if (targetId === '#sequential-images-wrapper') {
                // Vai para o momento em que o vídeo já tem opacidade
                scrollTarget = sequentialTl.scrollTrigger.labelToScroll("estatisticasStart");
            }

            gsap.to(window, {
                scrollTo: scrollTarget,
                duration: 2, // Scroll um pouco mais demorado pra ser cinematográfico e dar tempo do GSAP animar tudo
                ease: "power2.inOut"
            });
        });
    });

} // Fim da initScrollAnimations
