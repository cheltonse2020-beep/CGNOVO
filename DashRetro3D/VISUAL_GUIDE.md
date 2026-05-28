# 🎮 VISUAL GUIDE — Records System UI

## 📍 Localização dos Elementos

### HUD Durante o Jogo

```
┌─────────────────────────────────────────────────────────────────┐
│                                                    ☰    ⏸        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ SPEED                │                                       │
│  │ 0 KM/H              │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ LEVEL: 1            │                                       │
│  │ OVERTAKES: 0        │                                       │
│  │ 💰 COINS: 0         │                                       │
│  │ NITRO: ████ 100%    │                                       │
│  │ JUMPS: 3/3          │                                       │
│  │ FAROL: OFF          │                                       │
│  │ TIME: DAY ☀️         │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ ⚡ RECORDES       🔄 │ ← RESET BUTTON                       │
│  ├──────────────────────┤                                       │
│  │ TEMPO:               │                                       │
│  │ — (com data/hora)    │                                       │
│  │                      │                                       │
│  │ ULTRAPASSAGENS:      │                                       │
│  │ — (com data/hora)    │                                       │
│  └──────────────────────┘                                       │
│                          ↑ GREEN NEON TEXT                      │
│                                                                  │
│         ╔════════════════════════════════════╗                 │
│         ║  🎉 NOVO RECORDE! 🎉              ║  ← Animation   │
│         ║     (ao bater novo recorde)        ║                 │
│         ╚════════════════════════════════════╝                 │
│              ↑ YELLOW GLOW + PINK RING                          │
│                                                                  │
│                                                                  │
│                    [GAME VIEWPORT]                              │
│                   (THREE.JS CANVAS)                             │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Records Panel — Detailed View

### Normal State (Sem Recorde)

```
┌─────────────────────┐
│ ⚡ RECORDES      🔄 │  ← Title (Green Neon)
├─────────────────────┤
│ ┃ TEMPO:           │  ← Label (Cyan)
│ ┃ —                │  ← Value (Yellow)
│ ┃ —                │  ← Date (Green dim)
│                    │
│ ┃ ULTRAPASSAGENS:  │
│ ┃ —                │
│ ┃ —                │
└─────────────────────┘

CORES:
█ ⚡ RECORDES = Cyan (#00ffff) com glow
█ TEMPO: = Cyan (#00ffff)
█ — = Yellow (#ffdd00) com glow intenso
█ Data = Green (#00ff88) transparente
█ 🔄 = Pink (#ff2d78) border
```

---

### Com Recordes Salvos

```
┌─────────────────────┐
│ ⚡ RECORDES      🔄 │
├─────────────────────┤
│ ┃ TEMPO:           │
│ ┃ 2:15.3           │  ← Amarelo glow
│ ┃ 28/05/25 14:32   │  ← Verde dim
│                    │
│ ┃ ULTRAPASSAGENS:  │
│ ┃ 42               │  ← Amarelo glow
│ ┃ 28/05/25 14:30   │  ← Verde dim
└─────────────────────┘
```

---

## 🎬 Animation — Novo Recorde

### Frame 1: Start (0%)

```
                           Opacity: 0
                           Scale: 0.5
                           Color: Very bright
                           
            🎉 NOVO RECORDE! 🎉
            (pequeno e fadeado)
            
           ◆ Pink ring:
           ◇ Scale: 0.8
           ◇ Opacity: 1
```

### Frame 2: Mid (50%)

```
                           Opacity: 1
                           Scale: 1
                           Color: Full yellow glow
                           Filter: brightness(1.3)
                           
         🎉 NOVO RECORDE! 🎉
         (maior, mais brilho)
         
        ◆ Pink ring:
        ◆ Scale: 1.2
        ◆ Opacity: 0.7
        ◆ Glow intenso
```

### Frame 3: End (100%)

```
                           Opacity: 1
                           Scale: 1
                           Color: Normal
                           
        🎉 NOVO RECORDE! 🎉
        (tamanho normal)
        
       ◆ Pink ring:
       ◇ Scale: 1.5
       ◇ Opacity: 0
       ◇ Glow fade
       
       (depois de 3.5s, overlay desaparece)
```

---

## 🔄 Reset Button Interaction

### Normal State

```
┌──────────────────────┐
│ ⚡ RECORDES      🔄   │  ← 28x28px, pink border
│                      │     Font size: 0.9rem
│                      │     Background: rgba(255, 45, 120, 0.1)
```

### Hover State

```
┌──────────────────────┐
│ ⚡ RECORDES      🔄   │  ← Glow aumenta
│                      │     Background: rgba(255, 45, 120, 0.25)
│                      │     Scale: 1.1x
│                      │     Box-shadow: 0 0 16px rgba(255, 45, 120, 0.6)
```

### Click → Confirm Dialog

```
        ┌──────────────────────────────────────┐
        │  ⚠️ Tem a certeza que quer          │
        │  apagar todos os recordes?          │
        │                                      │
        │  Esta ação não pode ser desfeita.   │
        │                                      │
        │  ┌─────────┐     ┌──────────┐      │
        │  │ Cancelar│     │   OK     │      │
        │  └─────────┘     └──────────┘      │
        └──────────────────────────────────────┘
        
        → Se OK: Apaga recordes, mostra "—"
        → Se Cancelar: Nada muda
```

---

## 📐 Responsive Sizes

### Desktop (1920px+)

```
HUD Records:
  Width: 240px
  Font size: 0.75rem
  Padding: 0.7rem 0.9rem
  Border: 1px solid rgba(...)
  
Reset Button:
  Width: 28px
  Height: 28px
  
New Record Animation:
  Font size: 4.5rem (max)
  Ring size: 60px+ diameter
```

### Tablet (768px-1920px)

```
HUD Records:
  Width: 200px (escalado proporcionalmente)
  Font size: 0.7rem
  
Reset Button:
  Width: 26px
  Height: 26px
  
New Record Animation:
  Font size: 3.5rem
  Ring size: 50px diameter
```

### Mobile (320px-768px)

```
HUD Records:
  Width: 160px (compacto)
  Font size: 0.65rem
  Padding: 0.6rem 0.8rem
  
Reset Button:
  Width: 24px
  Height: 24px
  Font size: 0.8rem
  
New Record Animation:
  Font size: 2rem (clamp mínimo)
  Ring size: 30px diameter
  Background blur: 3px
```

---

## 🌈 Color Palette

### Records Panel

```
┌────────────────────────────┬──────────────┬────────────────────┐
│ Elemento                   │ Cor Primária │ Glow/Shadow        │
├────────────────────────────┼──────────────┼────────────────────┤
│ Título (⚡ RECORDES)       │ #00ffff      │ 0 0 8px #00ffff    │
│ Label (TEMPO:)             │ #00ffff      │ nenhum             │
│ Valor Recorde              │ #ffdd00      │ 0 0 8px, 0 0 16px  │
│ Data/Hora                  │ #00ff88      │ opacity: 0.7       │
│ Background Painel          │ transparent  │ rgba(0,20,40,0.5)  │
│ Border Painel              │ transparent  │ rgba(0,255,136,0.35)│
│ Reset Button Border        │ #ff2d78      │ 0 0 8px rgba(...)  │
└────────────────────────────┴──────────────┴────────────────────┘
```

### Novo Recorde Overlay

```
┌────────────────────────────┬──────────────┬────────────────────┐
│ Elemento                   │ Cor Primária │ Glow               │
├────────────────────────────┼──────────────┼────────────────────┤
│ Texto Principal            │ #ffdd00      │ Quad-layer         │
│  ├─ Layer 1                │              │ 0 0 10px #ffdd00   │
│  ├─ Layer 2                │              │ 0 0 20px #ff8800   │
│  ├─ Layer 3                │              │ 0 0 40px #ff2d78   │
│  └─ Layer 4                │              │ 0 0 80px rgba(...) │
│ Anel Expandindo            │ #ff2d78      │ Dynamic            │
│ Background Overlay         │ transparent  │ rgba(0,0,0,0.4)    │
└────────────────────────────┴──────────────┴────────────────────┘
```

---

## 📊 Layout Grid

### Positioning

```
body (fixed, viewport)
├── #game-canvas (WebGL, z-index: 0)
├── #pause-btn (top-left, z-index: 1000)
├── #hud-menu-btn (top-right, z-index: 1000)
├── #hud-controls-panel (top-right, z-index: 999)
│
└── #game-hud (fixed, z-index: 5, pointer-events: none)
    └── .hud-container (top-20px, left-20px)
        ├── .hud-speed
        ├── .hud-info
        └── .hud-records  ← NOVO
            ├── .hud-records-title
            ├── .record-item (×2)
            │   ├── .record-label
            │   ├── .record-value
            │   └── .record-date
            └── #reset-records-btn (absolute, top-right)

└── #new-record-overlay (fixed, z-index: 50) ← NOVO
    └── .new-record-content
        ├── .new-record-text
        └── .new-record-pulse
```

---

## 📱 Mobile Interactions

### Touch-friendly Sizing

```
Reset Button:
  Original: 28×28px
  Touch target: 44×44px (Apple HIG)
  → Margin/padding arredonda

Font Sizes:
  Desktop: 0.75rem
  Mobile: 0.65rem
  → Ainda legível em 320px

Animação Overlay:
  Desktop: 4.5rem font-size
  Mobile: clamp(2rem, 8vw, 4.5rem)
  → Adapta ao viewport
```

---

## 🔦 Visual Hierarchy

### Importância Visual (Destaque)

1. **Muito Alto** - Animação novo recorde
   - Tamanho grande
   - Cores quentes (amarelo/pink)
   - Glow intenso
   - Overlay escuro atrás

2. **Alto** - Valores de recordes
   - Amarelo grilho (#ffdd00)
   - Múltiplas camadas de text-shadow

3. **Médio** - Labels
   - Cyan (#00ffff)
   - Sem glow especial

4. **Baixo** - Data/Hora
   - Verde semi-transparente
   - Texto pequeno
   - Menos destaque

5. **Reset Button**
   - Pink pequeno
   - Canto, menos visível
   - Apenas hover mostra destaque

---

## 🎬 Timing & Animations

### Update Timing

```
updateRecordsHUD():
  Throttle: 100ms
  → Atualizar DOM max 10x/seg
  
updateNewRecordAnimation():
  Frequência: 60fps
  → Smooth animation

triggerNewRecordAnimation():
  Duration: 3.5s
  → Auto-hide
```

### CSS Animations

```
new-record-pulse: 0.8s ease-in-out
  → Opacity fade in
  → Scale grow
  
new-record-pulse-ring: 0.8s ease-out
  → Anel expande e desaparece
  → Glow reduz

Hover effects: 0.2s
  → Smooth transitions
```

---

## 🧪 Checklist Visual

- [ ] Records panel aparece no lado esquerdo
- [ ] Cores estão neon (verde/amarelo/pink)
- [ ] Reset button está no canto superior direito
- [ ] Dados aparecem como "—" se sem recorde
- [ ] Animação overlay aparece no centro
- [ ] Overlay é 3.5s e desaparece
- [ ] Texto animado tem glow notável
- [ ] Ring expande corretamente
- [ ] Responsivo em mobile (320px, 768px)
- [ ] Sem layout shift ou flicker

---

## 📸 Screenshots (Descrição)

### Desktop View

```
[Full game screen]
- Speed em grande no canto superior esquerdo
- Game info abaixo (Level, Overtakes, etc)
- Records panel logo abaixo (com 🔄 button)
- Game canvas ocupando resto da tela
- Pause button (⏸) no canto superior esquerdo
- Menu button (☰) no canto superior direito
```

### Novo Recorde

```
[Overlay aparece no centro]
- Fundo escuro semi-transparente
- Texto "🎉 NOVO RECORDE! 🎉" em amarelo/pink glow
- Anel rosa expandindo ao redor
- Background blur subtle
- Dura 3.5 segundos
```

### Mobile View

```
[Comprimido horizontalmente]
- HUD records ocupam ~70% da largura
- Reset button ainda visível
- Fonts escaladas para caber
- Animação overlay similar mas texto menor
```

---

**Visual Design: ✅ Complete & Production Ready**
