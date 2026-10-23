# Kronos BJJ — site (cópia da página Lovable)

Página estática (HTML/CSS/JS puro, sem build) recriando a landing page
`https://jiu-jitsu-trials-dark.lovable.app/`, com o calendário de agendamento
substituído pelo formulário embedado do GoHighLevel (CRM).

## Como abrir

Basta abrir `index.html` direto no navegador — não precisa de servidor nem
de instalar nada. As fotos já disponíveis (logo, hero, coach, "respect is
everything", faixa, "why we train") estão embutidas direto no HTML em
base64, então o arquivo funciona sozinho mesmo se você mover/baixar só ele,
sem precisar levar a pasta `images/` junto. Os arquivos originais ficam em
`site/images/` só como fonte, caso precise trocar/editar alguma foto depois.

## Fotos

Como não consegui acessar a página ao vivo nem os arquivos originais do
Lovable (sem repositório conectado), as fotos da página original foram
substituídas por blocos escuros com um rótulo indicando qual foto deveria
entrar ali. Para colocar as fotos reais, adicione os arquivos dentro de
`site/images/` com estes nomes (ou troque os nomes no CSS/HTML) e atualize os
`background` correspondentes em `index.html`:

- `hero.jpg` — foto do hero (duas alunas treinando)
- `features-side.jpg` — foto lateral da seção de 4 cards
- `beginners-1.jpg`, `beginners-2.jpg`, `beginners-3.jpg` — seção "First time on the mat"
- `coach.jpg` — foto do Leonardo Peçanha
- `why.jpg` — foto da seção "Why do we train"

## Formulário (GoHighLevel)

O formulário atual (calendário + seleção de horário + cadastro) foi
substituído pelo embed do GoHighLevel, exatamente como enviado, dentro da
seção `#trial-form` (`site/index.html`, perto do final do arquivo). Todos os
botões "Claim My Free Trial" / "Book Free Trial" da página rolam até essa
seção (`href="#trial-form"`).

## Horários (Class Timetable)

A grade de horários é gerada por um objeto JS (`schedule`, no final do
`index.html`) e os filtros por categoria (PeeWee, Kids, Adults Beginners,
etc.) funcionam clicando nas abas. Os horários de quarta 19:10 e sexta 19:10
foram inferidos pelo padrão dos outros dias (texto cortado no print
original) — vale conferir e ajustar se estiver diferente.

## Links placeholder

- Ícones de Instagram/Facebook no rodapé apontam para `#` — troque pelo link
  real dos perfis do Kronos BJJ.
