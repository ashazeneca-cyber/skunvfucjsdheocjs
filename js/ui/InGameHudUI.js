/**
 * RAPSONYX In-Game Action HUD, Shop Drawer, Gacha Modal & Telemetry Bar
 * Zero emoji UI — uses pure inline SVGs & CDN icon artwork
 */

import * as THREE from 'three';
import { AssetRegistry } from '../core/AssetRegistry.js';
import { MAP_CATALOG, TEAM_CONFIG } from '../config/constants.js';
import { GraphicsPresetManager } from '../core/GraphicsPresetManager.js';
import { SHOP_ITEMS_30 } from '../combat/ItemsSpellsEmblems.js';
import { openModalDialog, closeModalDialog } from './DialogHelper.js';

export class InGameHudUI {
  constructor({
    onBasicAttack,
    onSkillCast,
    onSpellCast,
    onJump,
    onDash,
    onMountToggle,
    onCameraToggle,
    onBuyItem,
    onReturnLobby,
    onOpenSettings,
    onJoystickInput
  }) {
    this.onBasicAttack = onBasicAttack;
    this.onSkillCast = onSkillCast;
    this.onSpellCast = onSpellCast;
    this.onJump = onJump;
    this.onDash = onDash;
    this.onMountToggle = onMountToggle;
    this.onCameraToggle = onCameraToggle;
    this.onBuyItem = onBuyItem;
    this.onReturnLobby = onReturnLobby;
    this.onOpenSettings = onOpenSettings;
    this.onJoystickInput = onJoystickInput;

    this.rootEl = document.getElementById('ingame-hud');
    this.minimapImgEl = document.getElementById('hud-minimap-img');
    this.minimapCanvas = document.getElementById('hud-minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.timerEl = document.getElementById('hud-match-timer');
    this.scoreEl = document.getElementById('hud-scoreboard-kda');
    this.goldEl = document.getElementById('hud-gold-val');
    this.telemetryEl = document.getElementById('hud-telemetry-badge');
    this.eventBannerEl = document.getElementById('hud-event-banner');

    this.hpFillEl = document.getElementById('hud-hp-fill');
    this.hpTextEl = document.getElementById('hud-hp-text');
    this.manaFillEl = document.getElementById('hud-mana-fill');
    this.levelEl = document.getElementById('hud-hero-level');

    this.joystickPadEl = document.getElementById('hud-joystick-pad');
    this.joystickKnobEl = document.getElementById('hud-joystick-knob');

    this.skillImgEls = [null, document.getElementById('hud-skill1-img'), document.getElementById('hud-skill2-img'), document.getElementById('hud-skill3-img')];
    this.skillCdEls = [null, document.getElementById('hud-skill1-cd'), document.getElementById('hud-skill2-cd'), document.getElementById('hud-skill3-cd')];
    this.spellImgEl = document.getElementById('hud-spell-img');
    this.spellCdEl = document.getElementById('hud-spell-cd');

    // Shop Modal
    this.shopModalEl = document.getElementById('shop-modal');
    this.shopGridEl = document.getElementById('shop-items-grid');
    this.shopGoldEl = document.getElementById('shop-gold-val');
    this.shopCatBtns = document.querySelectorAll('[data-shop-cat]');
    this.shopCloseBtn = document.getElementById('shop-close-btn');
    this.activeShopCat = 'All';

    // Result Banner Modal
    this.resultModalEl = document.getElementById('match-result-modal');
    this.resultTitleEl = document.getElementById('mr-title');
    this.resultRankEl = document.getElementById('mr-rank-summary');
    this.resultBoardEl = document.getElementById('mr-scoreboard');
    this.resultExitBtn = document.getElementById('mr-exit-btn');

    this.bannerTimer = 0;
    this.currentHeroId = 'freya';
  }

  init() {
    document.getElementById('hud-atk-btn')?.addEventListener('click', () => this.onBasicAttack?.('auto'));
    document.getElementById('hud-minion-btn')?.addEventListener('click', () => this.onBasicAttack?.('minion'));
    document.getElementById('hud-turret-btn')?.addEventListener('click', () => this.onBasicAttack?.('turret'));

    document.getElementById('hud-skill1-btn')?.addEventListener('click', () => this.onSkillCast?.(1));
    document.getElementById('hud-skill2-btn')?.addEventListener('click', () => this.onSkillCast?.(2));
    document.getElementById('hud-skill3-btn')?.addEventListener('click', () => this.onSkillCast?.(3));
    document.getElementById('hud-spell-btn')?.addEventListener('click', () => this.onSpellCast?.());

    document.getElementById('hud-jump-btn')?.addEventListener('click', () => this.onJump?.());
    document.getElementById('hud-dash-btn')?.addEventListener('click', () => this.onDash?.());
    document.getElementById('hud-mount-btn')?.addEventListener('click', () => this.onMountToggle?.());

    document.getElementById('hud-shop-btn')?.addEventListener('click', () => this.openShop());
    document.getElementById('hud-camera-btn')?.addEventListener('click', () => this.onCameraToggle?.());
    document.getElementById('hud-settings-btn')?.addEventListener('click', () => this.onOpenSettings?.());
    document.getElementById('hud-lobby-btn')?.addEventListener('click', () => this.onReturnLobby?.());

    if (this.shopCloseBtn) this.shopCloseBtn.addEventListener('click', () => this.closeShop());
    this.shopCatBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeShopCat = btn.dataset.shopCat;
        this.shopCatBtns.forEach((b) => b.classList.toggle('active', b === btn));
        this.renderShop();
      });
    });

    if (this.resultExitBtn) {
      this.resultExitBtn.addEventListener('click', () => {
        closeModalDialog(this.resultModalEl);
        this.onReturnLobby?.();
      });
    }

    this._bindVirtualJoystick();
  }

  _bindVirtualJoystick() {
    if (!this.joystickPadEl || !this.joystickKnobEl) return;
    let activePointerId = null;

    const updateStick = (clientX, clientY) => {
      const rect = this.joystickPadEl.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const maxR = rect.width * 0.36;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > maxR) {
        dx = (dx / d) * maxR;
        dy = (dy / d) * maxR;
      }
      this.joystickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      // Flip Z forward convention (screen up => -Z forward -> pass dx/maxR, -dy/maxR)
      this.onJoystickInput?.(dx / maxR, -dy / maxR);
    };

    this.joystickPadEl.addEventListener('pointerdown', (e) => {
      activePointerId = e.pointerId;
      this.joystickPadEl.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });
    this.joystickPadEl.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activePointerId) return;
      updateStick(e.clientX, e.clientY);
    });
    const endStick = (e) => {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;
      this.joystickKnobEl.style.transform = 'translate(0px, 0px)';
      this.onJoystickInput?.(0, 0);
    };
    this.joystickPadEl.addEventListener('pointerup', endStick);
    this.joystickPadEl.addEventListener('pointercancel', endStick);
  }

  show({ mapId, heroId, spellIcon }) {
    this.currentHeroId = heroId;
    const mapCfg = MAP_CATALOG[mapId] || MAP_CATALOG.arena_colosseum;
    if (this.minimapImgEl) {
      const mmAlias = mapCfg.minimapAlias || 'minimap_world_preview';
      this.minimapImgEl.src = AssetRegistry.toCdnUrl(mmAlias);
    }

    const slotNames = [null, 'skill_1', 'skill_2', 'ultimate'];
    for (let s = 1; s <= 3; s++) {
      if (this.skillImgEls[s]) {
        this.skillImgEls[s].src = AssetRegistry.toCdnUrl(
          `assets/ui/skill_icons_672/skill_icons_672_states/ready_framed/${heroId}_${slotNames[s]}.webp`
        );
      }
    }
    if (this.spellImgEl && spellIcon) {
      this.spellImgEl.src = AssetRegistry.toCdnUrl(spellIcon);
    }

    this.rootEl?.classList.remove('hidden');
  }

  hide() {
    this.rootEl?.classList.add('hidden');
    this.closeShop();
    closeModalDialog(this.resultModalEl);
  }

  showBanner(text, durationSec = 3.2) {
    if (!this.eventBannerEl) return;
    this.eventBannerEl.textContent = text;
    this.eventBannerEl.classList.remove('hidden');
    this.bannerTimer = durationSec;
  }

  openShop() {
    this.renderShop();
    openModalDialog(this.shopModalEl);
  }

  closeShop() {
    closeModalDialog(this.shopModalEl);
  }

  renderShop(playerGold = 0) {
    if (!this.shopGridEl) return;
    if (this.shopGoldEl) this.shopGoldEl.textContent = `Gold Anda: ${Math.floor(playerGold)}`;

    const items = SHOP_ITEMS_30.filter((it) => this.activeShopCat === 'All' || it.category === this.activeShopCat);
    this.shopGridEl.innerHTML = '';
    for (const it of items) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shop-item-card';
      card.style.textAlign = 'left';
      card.style.color = 'var(--text-primary)';
      card.innerHTML = `
        <img src="${AssetRegistry.toCdnUrl(it.icon)}" alt="${it.name}" loading="lazy">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.8rem;">${it.name}</div>
          <div style="font-size:0.7rem;color:var(--gold-primary);" class="tabular-nums">${it.price} Gold • ${it.category}</div>
          <div style="font-size:0.68rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.passive}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        const res = this.onBuyItem?.(it.id);
        if (res?.ok) {
          this.showBanner(`Dibeli: ${it.name}`, 2.0);
        } else if (res?.reason) {
          this.showBanner(res.reason, 2.0);
        }
      });
      this.shopGridEl.appendChild(card);
    }
  }

  showMatchResult(result) {
    if (!this.resultModalEl) return;
    if (this.resultTitleEl) {
      this.resultTitleEl.textContent = result.isVictory ? 'KEMENANGAN RAPSONYX' : 'PERTARUNGAN SELESAI';
      this.resultTitleEl.style.color = result.isVictory ? 'var(--sky-primary)' : 'var(--danger-coral)';
    }
    if (this.resultRankEl) {
      const rr = result.rankResult;
      if (rr?.rank) {
        const sign = rr.starDelta >= 0 ? `+${rr.starDelta}` : String(rr.starDelta);
        this.resultRankEl.textContent = `${rr.rank.displayLabel} (${rr.rank.totalStars} Bintang • ${sign})${result.isMvp ? ' • MVP PERTANDINGAN' : ''}`;
      } else {
        this.resultRankEl.textContent = `Durasi: ${result.durationSec || 0} detik`;
      }
    }
    if (this.resultBoardEl) {
      this.resultBoardEl.innerHTML = result.scoreboard.map((r) => {
        const tc = TEAM_CONFIG[r.team] || TEAM_CONFIG.team_dream;
        return `
          <div class="settings-row">
            <div>
              <strong style="color:${tc.colorHex};">${r.name}</strong>${r.isPlayer ? ' (Anda)' : ''}
              <span style="font-size:0.75rem;color:var(--text-muted);"> • Lv.${r.level}</span>
            </div>
            <div class="tabular-nums" style="font-size:0.82rem;">
              ${r.kills}/${r.deaths}/${r.assists} • ${r.gold}G • MVP ${r.mvpScore}
            </div>
          </div>
        `;
      }).join('');
    }
    openModalDialog(this.resultModalEl);
  }

  update(dt, { warController, playerUnit, playerPos, mapId }) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0 && this.eventBannerEl) {
        this.eventBannerEl.classList.add('hidden');
      }
    }

    // Update Telemetry pill
    if (this.telemetryEl) {
      if (GraphicsPresetManager.settings.showTelemetry) {
        const tel = GraphicsPresetManager.getTelemetry();
        this.telemetryEl.classList.remove('hidden');
        this.telemetryEl.textContent = `${tel.fps} FPS | ${tel.frameTimeMs}ms | ${tel.preset} (${tel.renderScale}x) | ${tel.drawCalls} DC${tel.sector ? ` | ${tel.sector}` : ''}`;
      } else {
        this.telemetryEl.classList.add('hidden');
      }
    }

    if (warController && playerUnit) {
      const m = String(Math.floor(warController.matchTimeSec / 60)).padStart(2, '0');
      const s = String(Math.floor(warController.matchTimeSec % 60)).padStart(2, '0');
      if (this.timerEl) this.timerEl.textContent = warController.suddenDeathTriggered ? `${m}:${s} SD` : `${m}:${s}`;
      if (this.scoreEl) this.scoreEl.textContent = `KDA ${playerUnit.kills}/${playerUnit.deaths}/${playerUnit.assists}`;
      if (this.goldEl) this.goldEl.textContent = `${Math.floor(playerUnit.gold)} G`;
      if (this.levelEl) this.levelEl.textContent = `Lv.${playerUnit.level}`;

      const hpPct = THREE.MathUtils.clamp((playerUnit.hp / Math.max(1, playerUnit.maxHp)) * 100, 0, 100);
      const mpPct = THREE.MathUtils.clamp((playerUnit.mana / Math.max(1, playerUnit.maxMana)) * 100, 0, 100);
      if (this.hpFillEl) this.hpFillEl.style.width = `${hpPct}%`;
      if (this.manaFillEl) this.manaFillEl.style.width = `${mpPct}%`;
      if (this.hpTextEl) this.hpTextEl.textContent = `${Math.round(playerUnit.hp)} / ${playerUnit.maxHp}`;

      for (let slot = 1; slot <= 3; slot++) {
        const cd = playerUnit.skillCooldowns[slot];
        if (this.skillCdEls[slot]) {
          if (cd > 0.1) {
            this.skillCdEls[slot].classList.remove('hidden');
            this.skillCdEls[slot].textContent = cd.toFixed(1);
          } else {
            this.skillCdEls[slot].classList.add('hidden');
          }
        }
      }
      if (this.spellCdEl) {
        if (playerUnit.spellCooldown > 0.1) {
          this.spellCdEl.classList.remove('hidden');
          this.spellCdEl.textContent = Math.ceil(playerUnit.spellCooldown);
        } else {
          this.spellCdEl.classList.add('hidden');
        }
      }
    } else if (playerPos) {
      if (this.timerEl) this.timerEl.textContent = 'JELAJAH';
      if (this.scoreEl) this.scoreEl.textContent = `(${Math.round(playerPos.x)}, ${Math.round(playerPos.z)})`;
      if (this.hpFillEl) this.hpFillEl.style.width = '100%';
      if (this.manaFillEl) this.manaFillEl.style.width = '100%';
    }

    // Minimap Canvas Radar
    if (this.minimapCtx && this.minimapCanvas) {
      const ctx = this.minimapCtx;
      const w = this.minimapCanvas.width;
      const h = this.minimapCanvas.height;
      ctx.clearRect(0, 0, w, h);
      const mapCfg = MAP_CATALOG[mapId] || {};
      const extent = mapCfg.radius ? mapCfg.radius * 1.1 : mapCfg.width ? mapCfg.width * 0.55 : 240;

      const toPx = (pos) => ({
        x: THREE.MathUtils.clamp((pos.x / (extent * 2) + 0.5) * w, 4, w - 4),
        y: THREE.MathUtils.clamp((pos.z / (extent * 2) + 0.5) * h, 4, h - 4)
      });

      if (warController) {
        for (const st of warController.structures) {
          if (!st.alive) continue;
          const pt = toPx(st.position);
          ctx.fillStyle = (TEAM_CONFIG[st.team] || TEAM_CONFIG.team_dream).colorHex;
          ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        }
        for (const u of warController.combatants) {
          if (!u.alive) continue;
          const pt = toPx(u.position);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, u.isPlayer ? 4.5 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = u.isPlayer ? '#fde68a' : (TEAM_CONFIG[u.team] || TEAM_CONFIG.team_dream).colorHex;
          ctx.fill();
        }
      } else if (playerPos) {
        const pt = toPx(playerPos);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();
      }
    }
  }
}
