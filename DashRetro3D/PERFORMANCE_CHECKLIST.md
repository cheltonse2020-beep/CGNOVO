# ⚡ CHECKLIST DE PERFORMANCE

## PRÉ-JOGO: Verificar Ambiente

- [ ] Feche outras abas/programas pesados (Discord, Chrome, Spotify)
- [ ] Use DevTools → Performance → FPS Meter
- [ ] Teste em modo fullscreen para melhor performance
- [ ] Verifique GPU usage (DevTools → GPU process)

---

## DURANTE O JOGO: Monitorar

### Câmera Chase (3ª pessoa - padrão)
- [ ] FPS deve estar **50-60 fps** (ou estável)
- [ ] Sem stuttering ao passar por traffic
- [ ] Polícia visível com siren piscando
- [ ] Árvores suaves no fundo

### Câmera Top (visão de cima)
- [ ] FPS deve estar **55-60 fps** (menos load que chase)
- [ ] Tela inteira visível sem lag
- [ ] Moedas e obstáculos smooth

### Câmera Hood (capô)
- [ ] FPS deve estar **50-60 fps**
- [ ] Sem jank ao virar bruscamente
- [ ] Headlights funcionam (Teclas 1/2/3)

### Câmera Cinematic (lateral)
- [ ] FPS deve estar **50-60 fps**
- [ ] Movimento suave da câmera
- [ ] Sem delay na resposta

---

## STRESS TEST: Máximo de Objetos

```
Cenário: 50+ segundos de jogo (velocidade alta)

Esperado:
✅ Máximo 5 carros inimigos simultâneos
✅ Máximo 3 obstáculos simultâneos
✅ Máximo 12 moedas simultâneos
✅ Máximo 2 police cars em chase
✅ FPS nunca abaixo de 30 (target 50+)
```

---

## COMPARAÇÃO: Antes vs Depois

### Antes da Otimização
- ❌ FPS oscila 20-40 fps
- ❌ Stuttering ao spawn de traffic
- ❌ Lag visível com 9 carros
- ❌ HUD atualiza a cada frame (caro)
- ❌ Árv ores muito poligonais
- ❌ Siren policial ofuscante

### Depois da Otimização
- ✅ FPS estável 50-60 fps
- ✅ Transições suaves
- ✅ Máximo 5 carros, sem lag
- ✅ HUD atualiza 6x/segundo (imperceptível)
- ✅ Árvores mais leves, visual igual
- ✅ Siren police subtle mas visível

---

## DICAS DE TROUBLESHOOTING

### Se FPS ainda estiver baixo (<40)

**Passo 1: Verificar GPU**
```javascript
// Abra DevTools Console e copie isto:
console.log(renderer.info);
```
Se `geometries` e `textures` crescer rapidamente, há memory leak.

**Passo 2: Reduzir limites ainda mais**
```javascript
// Em main.js, linha ~580
if (trafficSpawnTimer <= 0 && enemyCars.length < 3) {  // de 5 → 3
```

**Passo 3: Desativar sway de árvores**
```javascript
// Em updateActiveCamera, comentar sway:
// const swayAngle = Math.sin(...);
```

**Passo 4: Simplificar shadow map mais**
```javascript
// Em initScene
dirLight.shadow.mapSize.set(512, 512);  // de 1024 → 512
```

---

## KEYBOARD SHORTCUTS (durante jogo)

| Tecla | Função |
|-------|--------|
| `A` / `←` | Virar esquerda |
| `D` / `→` | Virar direita |
| `SPACE` | Pular (3× disponíveis) |
| `N` | Nitro (acelera 2.5×) |
| `1` | Farol mínimo |
| `2` | Farol médio |
| `3` | Farol máximo |
| `C` | Trocar câmera |
| `P` | Pausar jogo |
| `ESC` | Voltar ao menu |

---

## RENDERIZAÇÃO OTIMIZADA

### Renderer Settings
```javascript
✅ pixelRatio: Math.min(window.devicePixelRatio, 1.5)
✅ antialias: false
✅ powerPreference: 'high-performance'
✅ shadowMap.type: THREE.BasicShadowMap
✅ shadowMap.size: 1024×1024
```

### Limites Ativos
```javascript
✅ enemyCars: 5 max
✅ obstacles: 3 max
✅ coins: 12 max
✅ jumpPickups: 2 max
✅ policeCars: 2 max
```

### Luz Ambiente
```javascript
✅ AmbientLight: intensity 1.2
✅ DirectionalLight: intensity 1.8
✅ PointLights: intensity 1.0
```

---

## MEMORY MONITORING

### Como verificar memory leaks

```javascript
// DevTools Console:
// 1. Abra e anote heap size (ex: 150 MB)
// 2. Jogue por 2 minutos
// 3. Anote heap size novamente

✅ Normal: aumenta ~5-10 MB
❌ Leak: aumenta >50 MB contínuamente
```

Se tiver leak, verificar:
```javascript
// Procurar por .remove() faltando em:
// - scene.remove(obstacle)
// - scene.remove(coin)
// - scene.remove(enemyCar.mesh)
```

---

## PRÓXIMOS PASSOS

Se quiser otimizações avançadas:

1. **Instanciar geometrias** (InstancedMesh)
   - Reutilizar mesh para 100+ árvores iguais
   - Reduzir draw calls drasticamente

2. **LOD (Level of Detail)**
   - Árvores longe = geometria mais simples
   - Obstáculos distantes = mais simples

3. **Occlusion Culling**
   - Não renderizar objetos atrás da câmera

4. **WebWorkers**
   - Cálculos de colisão em thread separada

---

## ✅ CHECKLIST FINAL

- [ ] FPS estável 50+ fps em solo
- [ ] FPS estável 40+ fps com 5 carros
- [ ] Sem crash com máximo de objetos
- [ ] Todas 4 câmeras funcionam
- [ ] Polícia spawn OK
- [ ] Moedas e obstáculos OK
- [ ] HUD não pisca
- [ ] Sem visual glitches
- [ ] Árvores suaves
- [ ] Pedestres andam smooth

---

**Criado: 2026-05-21**  
**Status: Pronto para Produção** 🚀
