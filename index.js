/**
 * SillyTavern Extension: 👁🫦< 我注意到你的情緒了喵 (版本更新 0.2)
 * Features:
 * 1. Pink frosted glass entry in Extensions Menu (🧩) & matching draggable settings panel
 * 2. Double-click (點兩下) on the settings panel to quickly collapse/expand or close
 * 3. One-click Update & Restart Tavern button (🔄 更新並重啟酒館)
 * 4. Toggleable NPC overhead thought bubble (角色頭頂冒泡可自由選擇開啟或關閉)
 * 5. Load Prompt (載入提示詞 - from preset or file) & Reset Prompt (重置提示詞) buttons
 * 6. Up to 10 characters with keyword detection & 28 standard SillyTavern expressions
 * 7. Visual Novel (VN) stage mode with up to 3 characters (Left, Center, Right) + speaker hop animation
 * 8. Bottom-right badge displaying "版本更新 0.2"
 */

(function () {
    const EXTENSION_NAME = "i-noticed-your-emotion-nya";
    const DISPLAY_TITLE = "👁🫦< 我注意到你的情緒了喵";
    const VERSION_TEXT = "版本更新 0.2";

    // Standard 28 SillyTavern Classify Expressions
    const ST_28_EXPRESSIONS = [
        { id: "admiration", label: "欽佩 (admiration)", emoji: "🤩" },
        { id: "amusement", label: "開心 (amusement)", emoji: "😄" },
        { id: "anger", label: "憤怒 (anger)", emoji: "💢" },
        { id: "annoyance", label: "惱怒 (annoyance)", emoji: "😒" },
        { id: "approval", label: "贊同 (approval)", emoji: "👍" },
        { id: "caring", label: "關心 (caring)", emoji: "🤗" },
        { id: "confusion", label: "困惑 (confusion)", emoji: "❓" },
        { id: "curiosity", label: "好奇 (curiosity)", emoji: "🧐" },
        { id: "desire", label: "渴望 (desire)", emoji: "😍" },
        { id: "disappointment", label: "失望 (disappointment)", emoji: "😞" },
        { id: "disapproval", label: "不贊同 (disapproval)", emoji: "👎" },
        { id: "disgust", label: "厭惡 (disgust)", emoji: "🤢" },
        { id: "embarrassment", label: "害羞/尷尬 (embarrassment)", emoji: "😳" },
        { id: "excitement", label: "興奮 (excitement)", emoji: "✨" },
        { id: "fear", label: "恐懼 (fear)", emoji: "😨" },
        { id: "gratitude", label: "感激 (gratitude)", emoji: "🙏" },
        { id: "grief", label: "悲傷 (grief)", emoji: "😭" },
        { id: "joy", label: "喜悅 (joy)", emoji: "😊" },
        { id: "love", label: "愛意 (love)", emoji: "💕" },
        { id: "nervousness", label: "緊張 (nervousness)", emoji: "😰" },
        { id: "optimism", label: "樂觀 (optimism)", emoji: "🌟" },
        { id: "pride", label: "驕傲 (pride)", emoji: "😤" },
        { id: "realization", label: "頓悟 (realization)", emoji: "💡" },
        { id: "relief", label: "安心 (relief)", emoji: "😌" },
        { id: "remorse", label: "懊悔 (remorse)", emoji: "😔" },
        { id: "sadness", label: "難過 (sadness)", emoji: "😢" },
        { id: "surprise", label: "驚訝 (surprise)", emoji: "😲" },
        { id: "neutral", label: "平常 (neutral)", emoji: "🙂" }
    ];

    const DEFAULT_PROMPT = `[系統指令：👁🫦< 角色與即時情緒反應協議]
在生成每次回覆時，請嚴格執行「先確認說話者身份，再思考即時情緒反應」的雙步邏輯：
1. 【確認說話角色】：首先判斷當前段落或對話是由哪位已登錄角色發言，或是由路人/旁白/NPC（MPC）發言。
2. 【思考並做出即時情緒反應】：在確認說話者後，立即根據當下語境思考該角色最真實的即時情緒變化，並在身體語言、語氣與神態中自然流露。情緒標籤請從以下 28 種標準情緒中選擇：
(admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity, desire, disappointment, disapproval, disgust, embarrassment, excitement, fear, gratitude, grief, joy, love, nervousness, optimism, pride, realization, relief, remorse, sadness, surprise, neutral)
3. 【標記格式】：
- 當主要角色說話時，請在對話開頭或段落首行附上標記：<nya_state speaker="角色名" emotion="情緒英文ID">
- 當 NPC / MPC（非主要角色或路人）說話時，請附上標記：<nya_state speaker="NPC" emotion="neutral" thought="角色心裡正在思考的小泡泡內容...">，此時在場角色將保持平常（neutral）站姿並在頭頂浮現思考泡泡，直到 NPC 講完話。`;

    function createDefaultCharacters() {
        const list = [];
        const defaultPositions = ["left", "center", "right", "auto", "auto", "auto", "auto", "auto", "auto", "auto"];
        for (let i = 0; i < 10; i++) {
            const customSprites = {};
            ST_28_EXPRESSIONS.forEach(exp => { customSprites[exp.id] = ""; });
            list.push({
                enabled: i < 3,
                name: i === 0 ? "角色A" : (i === 1 ? "角色B" : (i === 2 ? "角色C" : "")),
                keywords: i === 0 ? "角色A, 少女A" : (i === 1 ? "角色B, 少女B" : (i === 2 ? "角色C, 少女C" : "")),
                position: defaultPositions[i],
                spriteFolder: "",
                currentEmotion: "neutral",
                customSprites: customSprites
            });
        }
        return list;
    }

    const DEFAULT_SETTINGS = {
        enabled: true,
        vnMode: true,
        promptEnabled: true,
        npcBubbleEnabled: true,
        promptText: DEFAULT_PROMPT,
        savedCustomPrompt: "",
        npcKeywords: "NPC, MPC, 路人, 旁白, 店员, 村民, 衛兵, 系統",
        defaultBubbleText: "💭 正在默默聽 NPC 說話喵...",
        panelLeft: null,
        panelTop: null,
        characters: createDefaultCharacters()
    };

    const stageState = {
        left: null,
        center: null,
        right: null,
        activeSpeakerPos: null,
        isNpcSpeaking: false,
        npcThoughtText: ""
    };

    let npcBubbleTimer = null;

    function notifyToast(msg, type = "info") {
        if (typeof toastr !== "undefined" && toastr[type]) {
            toastr[type](msg, DISPLAY_TITLE);
        } else {
            console.log(`[${DISPLAY_TITLE}] ${msg}`);
        }
    }

    function getSettings() {
        const ctx = (typeof SillyTavern !== "undefined" && SillyTavern.getContext) ? SillyTavern.getContext() : window;
        if (!ctx.extensionSettings) ctx.extensionSettings = {};
        if (!ctx.extensionSettings[EXTENSION_NAME]) {
            ctx.extensionSettings[EXTENSION_NAME] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
        const s = ctx.extensionSettings[EXTENSION_NAME];
        if (typeof s.npcBubbleEnabled === "undefined") s.npcBubbleEnabled = true;
        if (!Array.isArray(s.characters) || s.characters.length < 10) {
            const defaults = createDefaultCharacters();
            s.characters = defaults.map((def, idx) => (s.characters && s.characters[idx]) ? Object.assign({}, def, s.characters[idx]) : def);
        }
        return s;
    }

    function saveSettings() {
        const ctx = (typeof SillyTavern !== "undefined" && SillyTavern.getContext) ? SillyTavern.getContext() : window;
        if (ctx && typeof ctx.saveSettingsDebounced === "function") {
            ctx.saveSettingsDebounced();
        } else if (typeof saveSettingsDebounced === "function") {
            saveSettingsDebounced();
        }
        updateMenuPill();
        syncPromptInjection();
    }

    // Update extension & restart SillyTavern
    async function updateAndRestartTavern() {
        notifyToast("正在檢查更新並準備重啟酒館喵...", "info");
        try {
            const ctx = (typeof SillyTavern !== "undefined" && SillyTavern.getContext) ? SillyTavern.getContext() : window;
            const headers = (ctx && typeof ctx.getRequestHeaders === "function")
                ? ctx.getRequestHeaders()
                : { "Content-Type": "application/json" };

            await fetch("/api/extensions/update", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ extensionName: EXTENSION_NAME, global: false })
            }).catch(() => {});
        } catch (err) {
            console.warn("Extension update API fallback:", err);
        }

        notifyToast("更新完成！即將重新載入酒館喵 ✨", "success");
        setTimeout(() => {
            window.location.reload();
        }, 700);
    }

    function syncPromptInjection() {
        const s = getSettings();
        const ctx = (typeof SillyTavern !== "undefined" && SillyTavern.getContext) ? SillyTavern.getContext() : window;
        const setPromptFn = (ctx && ctx.setExtensionPrompt) ? ctx.setExtensionPrompt : (typeof setExtensionPrompt === "function" ? setExtensionPrompt : null);
        if (!setPromptFn) return;

        if (s.enabled && s.promptEnabled && s.promptText.trim()) {
            const activeNames = s.characters
                .filter(c => c.enabled && c.name.trim())
                .map(c => `${c.name.trim()} (關鍵詞: ${c.keywords || c.name})`)
                .join(" / ");
            const dynamicPrompt = s.promptText + (activeNames ? `\n【當前已登錄角色名單】：${activeNames}` : "");
            setPromptFn(EXTENSION_NAME, dynamicPrompt, 1, 1);
        } else {
            setPromptFn(EXTENSION_NAME, "", 1, 0);
        }
    }

    // Build Puzzle Menu (🧩) Pink Frosted Glass Entry
    function buildPuzzleMenuEntry() {
        if (document.getElementById("emotion_nya_menu_item")) return;
        const menuContainer = document.getElementById("extensionsMenu") || document.querySelector("#extensions_menu") || document.body;
        const item = document.createElement("div");
        item.id = "emotion_nya_menu_item";
        item.className = "list-group-item flex-container flexGap5 interactable";
        item.innerHTML = `
            <div class="nya-menu-title">
                <span>🧩</span>
                <span>${DISPLAY_TITLE}</span>
            </div>
            <span id="emotion_nya_status_pill" class="nya-status-pill">開啟喵</span>
        `;
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSettingsPanel();
        });
        menuContainer.appendChild(item);
        updateMenuPill();
    }

    function updateMenuPill() {
        const pill = document.getElementById("emotion_nya_status_pill");
        if (!pill) return;
        const s = getSettings();
        if (s.enabled) {
            pill.textContent = "開啟喵";
            pill.classList.remove("off");
        } else {
            pill.textContent = "已關閉";
            pill.classList.add("off");
        }
    }

    // Build Visual Novel 3-Slot Stage (Left, Center, Right)
    function buildVnStage() {
        if (document.getElementById("emotion_nya_vn_stage")) return;
        const stage = document.createElement("div");
        stage.id = "emotion_nya_vn_stage";
        stage.innerHTML = `
            <div class="nya-vn-slot slot-left" data-pos="left"></div>
            <div class="nya-vn-slot slot-center" data-pos="center"></div>
            <div class="nya-vn-slot slot-right" data-pos="right"></div>
        `;
        document.body.appendChild(stage);
        refreshStageInitialSlots();
        renderVnStage();
    }

    function refreshStageInitialSlots() {
        const s = getSettings();
        ["left", "center", "right"].forEach(pos => { stageState[pos] = null; });
        s.characters.forEach((c, idx) => {
            if (!c.enabled || !c.name.trim()) return;
            if (["left", "center", "right"].includes(c.position) && stageState[c.position] === null) {
                stageState[c.position] = idx;
            }
        });
        s.characters.forEach((c, idx) => {
            if (!c.enabled || !c.name.trim()) return;
            if ([stageState.left, stageState.center, stageState.right].includes(idx)) return;
            for (const pos of ["left", "center", "right"]) {
                if (stageState[pos] === null) {
                    stageState[pos] = idx;
                    break;
                }
            }
        });
    }

    function resolveSpriteUrl(charObj, emotionId) {
        if (!charObj) return "";
        if (charObj.customSprites && charObj.customSprites[emotionId] && charObj.customSprites[emotionId].trim()) {
            return charObj.customSprites[emotionId].trim();
        }
        if (charObj.customSprites && charObj.customSprites["neutral"] && charObj.customSprites["neutral"].trim()) {
            return charObj.customSprites["neutral"].trim();
        }
        const folder = (charObj.spriteFolder && charObj.spriteFolder.trim()) ? charObj.spriteFolder.trim() : charObj.name.trim();
        if (!folder) return "";
        return `/characters/${encodeURIComponent(folder)}/${encodeURIComponent(emotionId)}.png`;
    }

    function getEmotionMeta(emotionId) {
        return ST_28_EXPRESSIONS.find(e => e.id === emotionId) || ST_28_EXPRESSIONS[ST_28_EXPRESSIONS.length - 1];
    }

    function renderVnStage(triggerHopPos = null) {
        const s = getSettings();
        const stage = document.getElementById("emotion_nya_vn_stage");
        if (!stage) return;
        if (!s.enabled || !s.vnMode) {
            stage.classList.remove("vn-active");
            return;
        }
        stage.classList.add("vn-active");

        // Show thought bubble ONLY if NPC is speaking AND user enabled npcBubbleEnabled
        const showBubble = Boolean(stageState.isNpcSpeaking && s.npcBubbleEnabled);

        ["left", "center", "right"].forEach(pos => {
            const slotEl = stage.querySelector(`.slot-${pos}`);
            if (!slotEl) return;
            const charIdx = stageState[pos];
            if (charIdx === null || charIdx === undefined || !s.characters[charIdx] || !s.characters[charIdx].enabled || !s.characters[charIdx].name.trim()) {
                slotEl.innerHTML = "";
                slotEl.className = `nya-vn-slot slot-${pos}`;
                return;
            }
            const charObj = s.characters[charIdx];
            const effectiveEmotion = stageState.isNpcSpeaking ? "neutral" : (charObj.currentEmotion || "neutral");
            const emoMeta = getEmotionMeta(effectiveEmotion);
            const spriteUrl = resolveSpriteUrl(charObj, effectiveEmotion);
            const bubbleText = stageState.npcThoughtText || s.defaultBubbleText || "💭 正在聽 NPC 說話喵...";
            const isSpeaking = !stageState.isNpcSpeaking && stageState.activeSpeakerPos === pos;

            slotEl.className = `nya-vn-slot slot-${pos} ${isSpeaking ? "is-speaking" : "is-listening"}`;
            slotEl.innerHTML = `
                <div class="nya-thought-bubble ${showBubble ? "active" : ""}">
                    <span>${bubbleText}</span>
                    <span class="nya-bubble-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
                <div class="nya-vn-sprite-wrap">
                    <img class="nya-vn-sprite" src="${spriteUrl}" alt="${charObj.name}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="nya-vn-fallback-avatar" style="display:none;">
                        <div class="nya-vn-fallback-emoji">${emoMeta.emoji}</div>
                        <div style="font-weight:700;font-size:1rem;">${charObj.name}</div>
                        <div style="font-size:0.78rem;opacity:0.85;">${emoMeta.label}</div>
                    </div>
                </div>
                <div class="nya-vn-nameplate">
                    <span>${charObj.name}</span>
                    <span class="nya-vn-emotion-tag">${emoMeta.emoji} ${emoMeta.id}</span>
                </div>
            `;

            if (triggerHopPos === pos) {
                slotEl.classList.remove("hop-anim");
                void slotEl.offsetWidth;
                slotEl.classList.add("hop-anim");
            }
        });
    }

    function ensureCharacterOnStage(charIdx) {
        const s = getSettings();
        const charObj = s.characters[charIdx];
        if (!charObj) return "center";
        for (const pos of ["left", "center", "right"]) {
            if (stageState[pos] === charIdx) return pos;
        }
        if (["left", "center", "right"].includes(charObj.position)) {
            stageState[charObj.position] = charIdx;
            return charObj.position;
        }
        for (const pos of ["left", "center", "right"]) {
            if (stageState[pos] === null) {
                stageState[pos] = charIdx;
                return pos;
            }
        }
        const fallbackOrder = ["right", "left", "center"].filter(p => p !== stageState.activeSpeakerPos);
        const targetPos = fallbackOrder[0] || "center";
        stageState[targetPos] = charIdx;
        return targetPos;
    }

    function analyzeReplyAndReact(rawText, isStreaming = false) {
        const s = getSettings();
        if (!s.enabled || !rawText) return;
        if (npcBubbleTimer) {
            clearTimeout(npcBubbleTimer);
            npcBubbleTimer = null;
        }

        const tagRegex = /<nya_state\s+[^>]*speaker=["']([^"']+)["'][^>]*>/gi;
        let lastMatch = null;
        let m;
        while ((m = tagRegex.exec(rawText)) !== null) {
            lastMatch = m[0];
        }

        let detectedSpeakerType = null;
        let detectedCharIdx = -1;
        let detectedEmotion = null;
        let detectedThought = "";

        if (lastMatch) {
            const speakerAttr = (lastMatch.match(/speaker=["']([^"']+)["']/i) || [])[1] || "";
            const emotionAttr = ((lastMatch.match(/emotion=["']([^"']+)["']/i) || [])[1] || "").toLowerCase().trim();
            const thoughtAttr = (lastMatch.match(/thought=["']([^"']+)["']/i) || [])[1] || "";

            if (isNpcKeywordMatch(speakerAttr, s.npcKeywords)) {
                detectedSpeakerType = "npc";
                detectedThought = thoughtAttr;
            } else {
                const idx = matchCharacterByText(speakerAttr, s.characters);
                if (idx !== -1) {
                    detectedSpeakerType = "character";
                    detectedCharIdx = idx;
                }
            }
            if (ST_28_EXPRESSIONS.some(e => e.id === emotionAttr)) {
                detectedEmotion = emotionAttr;
            }
        }

        if (!detectedSpeakerType) {
            const lines = rawText.split(/\n+/).map(l => l.trim()).filter(Boolean);
            const tailText = lines.slice(-3).join(" ");
            const prefixMatch = tailText.match(/^([^：:「『\(\（]{1,16})[：:「『]/);
            const prefixCandidate = prefixMatch ? prefixMatch[1].trim() : tailText;

            if (isNpcKeywordMatch(prefixCandidate, s.npcKeywords)) {
                detectedSpeakerType = "npc";
            } else {
                const idx = matchCharacterByText(prefixCandidate, s.characters);
                if (idx !== -1) {
                    detectedSpeakerType = "character";
                    detectedCharIdx = idx;
                } else {
                    const broadIdx = matchCharacterByText(tailText, s.characters);
                    if (broadIdx !== -1) {
                        detectedSpeakerType = "character";
                        detectedCharIdx = broadIdx;
                    }
                }
            }
        }

        if (!detectedEmotion) {
            detectedEmotion = inferEmotionFromText(rawText);
        }

        if (detectedSpeakerType === "npc") {
            stageState.isNpcSpeaking = true;
            stageState.npcThoughtText = detectedThought || s.defaultBubbleText;
            s.characters.forEach(c => { if (c.enabled) c.currentEmotion = "neutral"; });
            renderVnStage(null);
            if (!isStreaming) {
                npcBubbleTimer = setTimeout(() => {
                    stageState.isNpcSpeaking = false;
                    renderVnStage(null);
                }, 4200);
            }
        } else if (detectedSpeakerType === "character" && detectedCharIdx !== -1) {
            stageState.isNpcSpeaking = false;
            const charObj = s.characters[detectedCharIdx];
            charObj.currentEmotion = detectedEmotion || "neutral";
            const prevSpeakerPos = stageState.activeSpeakerPos;
            const pos = ensureCharacterOnStage(detectedCharIdx);
            stageState.activeSpeakerPos = pos;
            const shouldHop = (prevSpeakerPos !== pos) || !isStreaming;
            renderVnStage(shouldHop ? pos : null);
            syncNativeStExpression(charObj, charObj.currentEmotion);
        }
    }

    function isNpcKeywordMatch(text, npcKeywordCsv) {
        if (!text || !npcKeywordCsv) return false;
        const keywords = npcKeywordCsv.split(/[,，、]/).map(k => k.trim().toLowerCase()).filter(Boolean);
        const lower = text.toLowerCase();
        return keywords.some(k => lower.includes(k));
    }

    function matchCharacterByText(text, characters) {
        if (!text) return -1;
        const lower = text.toLowerCase();
        for (let i = 0; i < characters.length; i++) {
            const c = characters[i];
            if (!c.enabled || !c.name.trim()) continue;
            const kwList = [c.name, ...(c.keywords || "").split(/[,，、]/)].map(k => k.trim().toLowerCase()).filter(Boolean);
            if (kwList.some(k => lower.includes(k))) return i;
        }
        return -1;
    }

    const EMOTION_LEXICON = [
        { id: "joy", words: ["笑", "開心", "高興", "太好了", "嘻嘻", "哈哈", "愉快", "happy", "smile", "joy"] },
        { id: "love", words: ["喜歡", "愛", "心動", "親吻", "抱緊", "深情", "love", "kiss", "heart"] },
        { id: "embarrassment", words: ["臉紅", "害羞", "羞恥", "發燙", "支吾", "低頭", "blush", "shy", "embarrass"] },
        { id: "anger", words: ["生氣", "憤怒", "滾", "可惡", "咬牙", "怒火", "angry", "rage", "furious"] },
        { id: "annoyance", words: ["煩人", "討厭", "嘖", "翻白眼", "不耐煩", "哼", "annoy", "tsk"] },
        { id: "sadness", words: ["難過", "傷心", "流淚", "眼淚", "哭", "低落", "sad", "tear", "cry"] },
        { id: "grief", words: ["痛哭", "絕望", "崩潰", "心碎", "嗚嗚", "grief", "sob"] },
        { id: "surprise", words: ["驚訝", "咦", "什麼", "居然", "瞪大", "愣住", "surprise", "shock", "gasp"] },
        { id: "curiosity", words: ["好奇", "為什麼", "歪頭", "打量", "疑問", "curious", "wonder"] },
        { id: "confusion", words: ["困惑", "迷茫", "不懂", "怎麼回事", "抓頭", "confused", "puzzled"] },
        { id: "fear", words: ["害怕", "恐懼", "發抖", "顫抖", "救命", "可怕", "fear", "scared", "tremble"] },
        { id: "nervousness", words: ["緊張", "冒汗", "不安", "心跳加速", "吞口水", "nervous", "anxious"] },
        { id: "excitement", words: ["興奮", "期待", "太棒了", "發光", "激動", "excited", "thrilled"] },
        { id: "admiration", words: ["厲害", "崇拜", "欽佩", "好棒", "了不起", "admire", "awesome"] },
        { id: "amusement", words: ["有趣", "好笑", "噗嗤", "逗", "調侃", "amused", "chuckle"] },
        { id: "caring", words: ["小心", "關心", "溫柔", "摸摸頭", "沒事吧", "心疼", "care", "gentle"] },
        { id: "gratitude", words: ["謝謝", "感謝", "感激", "多虧", "thank", "grateful"] },
        { id: "pride", words: ["驕傲", "得意", "那是當然", "哼哼", "挺胸", "proud", "smug"] },
        { id: "relief", words: ["鬆了一口氣", "安心", "太好了", "呼—", "放心", "relief", "sigh"] },
        { id: "disappointment", words: ["失望", "嘆氣", "算了", "可惜", "唉", "disappoint"] },
        { id: "disgust", words: ["噁心", "厭惡", "嫌棄", "皺眉", "髒", "disgust", "gross"] },
        { id: "desire", words: ["渴望", "想要", "喘息", "眼神熾熱", "舔唇", "desire", "lust"] },
        { id: "approval", words: ["贊成", "點頭", "沒錯", "同意", "認可", "nod", "agree"] },
        { id: "disapproval", words: ["反對", "搖頭", "不行", "不准", "拒絕", "disapprove"] },
        { id: "realization", words: ["原來如此", "明白了", "恍然大悟", "突然意識到", "realize"] },
        { id: "remorse", words: ["對不起", "抱歉", "後悔", "內疚", "自責", "sorry", "regret"] },
        { id: "optimism", words: ["一定可以", "沒問題", "充滿希望", "加油", "optimistic", "hope"] }
    ];

    function inferEmotionFromText(text) {
        if (!text) return "neutral";
        const tail = text.slice(-260).toLowerCase();
        for (const item of EMOTION_LEXICON) {
            if (item.words.some(w => tail.includes(w))) return item.id;
        }
        return "neutral";
    }

    function syncNativeStExpression(charObj, emotionId) {
        const imgEl = document.querySelector("#expression-image");
        if (imgEl) {
            const url = resolveSpriteUrl(charObj, emotionId);
            if (url) imgEl.src = url;
        }
    }

    // Enable smooth mouse & touch dragging on the Settings Panel + Double-click handler
    function makePanelDraggableAndDoubleClickable(panel, header) {
        const s = getSettings();
        if (typeof s.panelLeft === "number" && typeof s.panelTop === "number") {
            panel.style.left = `${s.panelLeft}px`;
            panel.style.top = `${s.panelTop}px`;
            panel.style.transform = "none";
        }

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        function onPointerDown(e) {
            if (e.target.closest("button, input, select, textarea, label")) return;
            isDragging = true;
            panel.classList.add("dragging");

            const rect = panel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            panel.style.left = `${initialLeft}px`;
            panel.style.top = `${initialTop}px`;
            panel.style.transform = "none";

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;

            document.addEventListener("mousemove", onPointerMove);
            document.addEventListener("mouseup", onPointerUp);
            document.addEventListener("touchmove", onPointerMove, { passive: false });
            document.addEventListener("touchend", onPointerUp);
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            const newLeft = Math.max(8, Math.min(window.innerWidth - 120, initialLeft + dx));
            const newTop = Math.max(8, Math.min(window.innerHeight - 60, initialTop + dy));

            panel.style.left = `${newLeft}px`;
            panel.style.top = `${newTop}px`;
        }

        function onPointerUp() {
            if (!isDragging) return;
            isDragging = false;
            panel.classList.remove("dragging");

            const rect = panel.getBoundingClientRect();
            s.panelLeft = Math.round(rect.left);
            s.panelTop = Math.round(rect.top);
            saveSettings();

            document.removeEventListener("mousemove", onPointerMove);
            document.removeEventListener("mouseup", onPointerUp);
            document.removeEventListener("touchmove", onPointerMove);
            document.removeEventListener("touchend", onPointerUp);
        }

        header.addEventListener("mousedown", onPointerDown);
        header.addEventListener("touchstart", onPointerDown, { passive: true });

        // Double-click (點兩下設置板面) to toggle collapse/expand body
        panel.addEventListener("dblclick", (e) => {
            if (e.target.closest("input, textarea, select, button, label")) return;
            panel.classList.toggle("minimized");
        });
    }

    // Build Pink Frosted Glass Settings Modal (v0.2)
    function buildSettingsModal() {
        if (document.getElementById("emotion_nya_panel")) return;
        const panel = document.createElement("div");
        panel.id = "emotion_nya_panel";
        panel.innerHTML = `
            <div class="nya-panel-header" id="nya_panel_drag_header" title="按住可拖動面板 · 點兩下板面可收合/展開">
                <h3>
                    <span>👁🫦<</span>
                    <span>我注意到你的情緒了喵</span>
                    <span class="nya-drag-hint">✥ 可拖動 / 點兩下收合</span>
                </h3>
                <div class="nya-header-actions">
                    <button class="nya-btn nya-btn-update" id="nya_update_restart_btn" title="更新插件並立即重啟酒館">🔄 更新並重啟酒館</button>
                    <button class="nya-close-btn" id="nya_close_panel_btn" title="關閉">✕</button>
                </div>
            </div>
            <div class="nya-panel-body">
                <div class="nya-card">
                    <div class="nya-card-title">
                        <span>🌸 核心模式開關</span>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            <button class="nya-btn nya-btn-secondary" id="nya_demo_switch_btn">✨ 測試角色切換跳動</button>
                            <button class="nya-btn nya-btn-secondary" id="nya_demo_npc_btn">💭 測試 NPC 思考泡泡</button>
                        </div>
                    </div>
                    <div class="nya-toggle-grid">
                        <div class="nya-toggle-item">
                            <span class="nya-toggle-label">選擇開啟 / 關閉插件</span>
                            <label class="nya-switch">
                                <input type="checkbox" id="nya_toggle_enabled">
                                <span class="nya-slider"></span>
                            </label>
                        </div>
                        <div class="nya-toggle-item">
                            <span class="nya-toggle-label">視覺小說模式 (左/中/右立繪)</span>
                            <label class="nya-switch">
                                <input type="checkbox" id="nya_toggle_vn">
                                <span class="nya-slider"></span>
                            </label>
                        </div>
                        <div class="nya-toggle-item">
                            <span class="nya-toggle-label">NPC 講話時頭頂冒泡美化</span>
                            <label class="nya-switch">
                                <input type="checkbox" id="nya_toggle_npc_bubble">
                                <span class="nya-slider"></span>
                            </label>
                        </div>
                        <div class="nya-toggle-item">
                            <span class="nya-toggle-label">注入即時情緒反應提示詞</span>
                            <label class="nya-switch">
                                <input type="checkbox" id="nya_toggle_prompt">
                                <span class="nya-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="nya-card">
                    <div class="nya-card-title">
                        <span>💌 說話者確認與即時情緒提示詞 (Prompt)</span>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            <input type="file" id="nya_prompt_file_input" accept=".txt,.md,.json" style="display:none;" />
                            <button class="nya-btn nya-btn-secondary" id="nya_load_prompt_btn" title="從本地檔案或已存檔載入提示詞">📂 載入提示詞</button>
                            <button class="nya-btn nya-btn-secondary" id="nya_reset_prompt_btn" title="恢復為預設的雙步即時情緒提示詞">♻️ 重置提示詞</button>
                        </div>
                    </div>
                    <textarea class="nya-textarea" id="nya_prompt_textarea" placeholder="在此輸入提示詞..."></textarea>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
                        <div>
                            <div style="font-size:0.78rem;color:#ffd1e6;margin-bottom:4px;">NPC / MPC 觸發關鍵詞 (逗號分隔)</div>
                            <input type="text" class="nya-input" id="nya_npc_keywords" placeholder="NPC, MPC, 路人, 旁白" />
                        </div>
                        <div>
                            <div style="font-size:0.78rem;color:#ffd1e6;margin-bottom:4px;">NPC 講話時角色頭頂泡泡預設文字</div>
                            <input type="text" class="nya-input" id="nya_bubble_default" placeholder="💭 正在默默聽 NPC 說話喵..." />
                        </div>
                    </div>
                </div>

                <div class="nya-card">
                    <div class="nya-card-title">
                        <span>🎭 角色名稱與關鍵詞檢測 (最多 10 位角色 · 內建 28 種標準情緒差分)</span>
                    </div>
                    <div class="nya-char-list" id="nya_char_list_container"></div>
                </div>
            </div>
            <div class="nya-panel-footer">
                <span>💡 提示：按住頂部可自由拖動位置，點兩下板面空白處可快速收合/展開喵</span>
                <span class="nya-version-badge">${VERSION_TEXT}</span>
            </div>
        `;
        document.body.appendChild(panel);

        const dragHeader = document.getElementById("nya_panel_drag_header");
        makePanelDraggableAndDoubleClickable(panel, dragHeader);

        document.getElementById("nya_close_panel_btn").addEventListener("click", () => {
            panel.classList.remove("open");
        });

        document.getElementById("nya_update_restart_btn").addEventListener("click", () => {
            updateAndRestartTavern();
        });

        const s = getSettings();
        const elEnabled = document.getElementById("nya_toggle_enabled");
        const elVn = document.getElementById("nya_toggle_vn");
        const elNpcBubble = document.getElementById("nya_toggle_npc_bubble");
        const elPrompt = document.getElementById("nya_toggle_prompt");
        const elPromptText = document.getElementById("nya_prompt_textarea");
        const elNpcKw = document.getElementById("nya_npc_keywords");
        const elBubbleDef = document.getElementById("nya_bubble_default");
        const elFileInput = document.getElementById("nya_prompt_file_input");

        elEnabled.checked = !!s.enabled;
        elVn.checked = !!s.vnMode;
        elNpcBubble.checked = s.npcBubbleEnabled !== false;
        elPrompt.checked = !!s.promptEnabled;
        elPromptText.value = s.promptText || DEFAULT_PROMPT;
        elNpcKw.value = s.npcKeywords || "";
        elBubbleDef.value = s.defaultBubbleText || "";

        elEnabled.addEventListener("change", (e) => {
            s.enabled = e.target.checked;
            saveSettings();
            renderVnStage();
        });
        elVn.addEventListener("change", (e) => {
            s.vnMode = e.target.checked;
            saveSettings();
            refreshStageInitialSlots();
            renderVnStage();
        });
        elNpcBubble.addEventListener("change", (e) => {
            s.npcBubbleEnabled = e.target.checked;
            saveSettings();
            renderVnStage();
        });
        elPrompt.addEventListener("change", (e) => {
            s.promptEnabled = e.target.checked;
            saveSettings();
        });
        elPromptText.addEventListener("input", (e) => {
            s.promptText = e.target.value;
            s.savedCustomPrompt = e.target.value;
            saveSettings();
        });
        elNpcKw.addEventListener("input", (e) => {
            s.npcKeywords = e.target.value;
            saveSettings();
        });
        elBubbleDef.addEventListener("input", (e) => {
            s.defaultBubbleText = e.target.value;
            saveSettings();
        });

        // 載入提示詞 (Load Prompt)
        document.getElementById("nya_load_prompt_btn").addEventListener("click", () => {
            elFileInput.click();
        });

        elFileInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = String(ev.target.result || "").trim();
                if (content) {
                    s.promptText = content;
                    s.savedCustomPrompt = content;
                    elPromptText.value = content;
                    saveSettings();
                    notifyToast("已成功載入提示詞喵！", "success");
                }
            };
            reader.readAsText(file, "UTF-8");
            e.target.value = "";
        });

        // 重置提示詞 (Reset Prompt)
        document.getElementById("nya_reset_prompt_btn").addEventListener("click", () => {
            s.promptText = DEFAULT_PROMPT;
            elPromptText.value = DEFAULT_PROMPT;
            saveSettings();
            notifyToast("已重置為預設雙步情緒提示詞喵！", "info");
        });

        // Demo buttons
        document.getElementById("nya_demo_switch_btn").addEventListener("click", () => {
            const activeIndices = s.characters.map((c, idx) => (c.enabled && c.name.trim()) ? idx : -1).filter(i => i !== -1);
            if (activeIndices.length === 0) return;
            const randomCharIdx = activeIndices[Math.floor(Math.random() * activeIndices.length)];
            const randomEmo = ST_28_EXPRESSIONS[Math.floor(Math.random() * (ST_28_EXPRESSIONS.length - 1))].id;
            stageState.isNpcSpeaking = false;
            s.characters[randomCharIdx].currentEmotion = randomEmo;
            const pos = ensureCharacterOnStage(randomCharIdx);
            stageState.activeSpeakerPos = pos;
            renderVnStage(pos);
        });

        document.getElementById("nya_demo_npc_btn").addEventListener("click", () => {
            stageState.isNpcSpeaking = !stageState.isNpcSpeaking;
            if (stageState.isNpcSpeaking) {
                stageState.npcThoughtText = s.defaultBubbleText || "💭 正在默默聽 NPC 說話喵...";
                s.characters.forEach(c => { if (c.enabled) c.currentEmotion = "neutral"; });
            }
            renderVnStage(null);
        });

        renderCharacterSlotSettings();
    }

    function renderCharacterSlotSettings() {
        const container = document.getElementById("nya_char_list_container");
        if (!container) return;
        const s = getSettings();
        container.innerHTML = "";

        s.characters.forEach((charObj, idx) => {
            const slot = document.createElement("div");
            slot.className = `nya-char-slot ${charObj.enabled ? "active-slot" : ""}`;
            const exprInputsHtml = ST_28_EXPRESSIONS.map(exp => `
                <div class="nya-expr-item">
                    <label title="${exp.label}">${exp.emoji} ${exp.label}</label>
                    <input type="text" class="nya-input nya-expr-url-input"
                           data-char="${idx}" data-emo="${exp.id}"
                           placeholder="/characters/${charObj.name || '角色'}/${exp.id}.png"
                           value="${(charObj.customSprites && charObj.customSprites[exp.id]) ? charObj.customSprites[exp.id] : ''}" />
                </div>
            `).join("");

            slot.innerHTML = `
                <div class="nya-char-row-main">
                    <div class="nya-slot-index">#${idx + 1}</div>
                    <input type="text" class="nya-input char-name-input" placeholder="角色名稱 (例：愛莉絲)" value="${charObj.name || ''}" />
                    <input type="text" class="nya-input char-kw-input" placeholder="檢測關鍵詞 (逗號分隔)" value="${charObj.keywords || ''}" />
                    <select class="nya-select char-pos-select">
                        <option value="auto" ${charObj.position === "auto" ? "selected" : ""}>位置：自動補位</option>
                        <option value="left" ${charObj.position === "left" ? "selected" : ""}>位置：左邊 (Left)</option>
                        <option value="center" ${charObj.position === "center" ? "selected" : ""}>位置：中間 (Center)</option>
                        <option value="right" ${charObj.position === "right" ? "selected" : ""}>位置：右邊 (Right)</option>
                    </select>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <label class="nya-switch" title="啟用此角色槽位">
                            <input type="checkbox" class="char-enable-toggle" ${charObj.enabled ? "checked" : ""}>
                            <span class="nya-slider"></span>
                        </label>
                        <button class="nya-btn nya-btn-secondary char-expr-btn" title="配置 28 種情緒立繪差分">差分(28)</button>
                    </div>
                </div>
                <div class="nya-expr-drawer" id="nya_expr_drawer_${idx}">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                        <span style="font-size:0.78rem;color:#ffd1e6;">📁 立繪資料夾名稱 (預設同角色名，對應 /characters/資料夾/情緒.png)：</span>
                        <input type="text" class="nya-input char-folder-input" style="max-width:220px;"
                               placeholder="${charObj.name || '角色資料夾'}" value="${charObj.spriteFolder || ''}" />
                    </div>
                    <div class="nya-expr-grid">${exprInputsHtml}</div>
                </div>
            `;

            const nameInput = slot.querySelector(".char-name-input");
            const kwInput = slot.querySelector(".char-kw-input");
            const posSelect = slot.querySelector(".char-pos-select");
            const enableToggle = slot.querySelector(".char-enable-toggle");
            const exprBtn = slot.querySelector(".char-expr-btn");
            const drawer = slot.querySelector(`#nya_expr_drawer_${idx}`);
            const folderInput = slot.querySelector(".char-folder-input");

            nameInput.addEventListener("input", (e) => {
                charObj.name = e.target.value;
                saveSettings();
                refreshStageInitialSlots();
                renderVnStage();
            });
            kwInput.addEventListener("input", (e) => {
                charObj.keywords = e.target.value;
                saveSettings();
            });
            posSelect.addEventListener("change", (e) => {
                charObj.position = e.target.value;
                saveSettings();
                refreshStageInitialSlots();
                renderVnStage();
            });
            enableToggle.addEventListener("change", (e) => {
                charObj.enabled = e.target.checked;
                slot.classList.toggle("active-slot", charObj.enabled);
                saveSettings();
                refreshStageInitialSlots();
                renderVnStage();
            });
            exprBtn.addEventListener("click", () => {
                drawer.classList.toggle("open");
            });
            folderInput.addEventListener("input", (e) => {
                charObj.spriteFolder = e.target.value;
                saveSettings();
                renderVnStage();
            });
            slot.querySelectorAll(".nya-expr-url-input").forEach(inp => {
                inp.addEventListener("input", (e) => {
                    const emoId = e.target.getAttribute("data-emo");
                    if (!charObj.customSprites) charObj.customSprites = {};
                    charObj.customSprites[emoId] = e.target.value;
                    saveSettings();
                    renderVnStage();
                });
            });
            container.appendChild(slot);
        });
    }

    function toggleSettingsPanel() {
        buildSettingsModal();
        const panel = document.getElementById("emotion_nya_panel");
        if (panel) panel.classList.toggle("open");
    }

    function registerSillyTavernHooks() {
        const ctx = (typeof SillyTavern !== "undefined" && SillyTavern.getContext) ? SillyTavern.getContext() : window;
        const evSource = ctx.eventSource || window.eventSource;
        const evTypes = ctx.event_types || window.event_types;

        if (evSource && evTypes) {
            if (evTypes.STREAM_TOKEN_RECEIVED) {
                evSource.on(evTypes.STREAM_TOKEN_RECEIVED, (fullText) => {
                    analyzeReplyAndReact(fullText, true);
                });
            }
            if (evTypes.CHARACTER_MESSAGE_RENDERED) {
                evSource.on(evTypes.CHARACTER_MESSAGE_RENDERED, (messageId) => {
                    const chat = ctx.chat || window.chat;
                    if (Array.isArray(chat) && chat[messageId] && chat[messageId].mes) {
                        analyzeReplyAndReact(chat[messageId].mes, false);
                    }
                });
            }
            if (evTypes.CHAT_COMPLETION_PROMPT_READY) {
                evSource.on(evTypes.CHAT_COMPLETION_PROMPT_READY, () => {
                    syncPromptInjection();
                });
            }
        }

        const chatEl = document.getElementById("chat");
        if (chatEl) {
            const observer = new MutationObserver(() => {
                const lastMes = chatEl.querySelector(".mes:last-child .mes_text");
                if (lastMes) {
                    analyzeReplyAndReact(lastMes.innerText || lastMes.textContent || "", false);
                }
            });
            observer.observe(chatEl, { childList: true, subtree: true, characterData: true });
        }
    }

    function initExtension() {
        buildPuzzleMenuEntry();
        buildSettingsModal();
        buildVnStage();
        syncPromptInjection();
        registerSillyTavernHooks();
        console.log(`[${DISPLAY_TITLE}] ${VERSION_TEXT} 插件已載入完成喵！`);
    }

    if (typeof jQuery !== "undefined") {
        jQuery(document).ready(() => setTimeout(initExtension, 400));
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initExtension, 400));
    } else {
        setTimeout(initExtension, 400);
    }
})();
