import { getContext, extension_settings } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

const MODULE_NAME = "meow_emotion_vn";
const MAX_ON_SCREEN = 3;

const defaultSettings = {
    enabled: true,
};

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = { ...defaultSettings };
    }
    return extension_settings[MODULE_NAME];
}

function saveSettings() {
    getContext().saveSettingsDebounced();
}

function renderSettingsUI() {
    const settings = getSettings();
    
    const html = `
    <div class="meow-emotion-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>👁🫦< 我注意到你的情绪了喵</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label flex-container">
                    <input type="checkbox" id="meow_emotion_toggle" ${settings.enabled ? 'checked' : ''} />
                    <span>启用多角色自动情绪同屏与跳动动画</span>
                </label>
                <small class="notes">开启后，AI 回复中的不同角色散发的情绪会以 1~3 人同屏与跳动效果呈现在视觉小说模式中，喵~</small>
            </div>
        </div>
    </div>
    `;

    $('#extensions_settings').append(html);

    $('#meow_emotion_toggle').on('change', function () {
        const isEnabled = $(this).prop('checked');
        settings.enabled = isEnabled;
        saveSettings();

        const stage = document.getElementById('vn-multi-stage');
        if (stage) {
            stage.style.display = isEnabled ? 'flex' : 'none';
        }
    });
}

function initVNOverlay() {
    if (document.getElementById('vn-multi-stage')) return;

    const settings = getSettings();
    const stage = document.createElement('div');
    stage.id = 'vn-multi-stage';
    stage.style.display = settings.enabled ? 'flex' : 'none';
    stage.innerHTML = `
        <div class="vn-slot vn-left"></div>
        <div class="vn-slot vn-center"></div>
        <div class="vn-slot vn-right"></div>
    `;
    document.body.appendChild(stage);
}

function parseMessageToSegments(text) {
    const regex = /(?:【?([^\n：:\"“「]+)】?[：:])?\s*[“\"「]([^”\"」]+)[”\"」]/g;
    let match;
    const segments = [];

    const overrideMatch = text.match(/[\(\[（]([^\s:\)：]+)[：:\s]+(happy|sad|anger|joy|surprised|neutral|disgust|fear)[\)\]）]/i);
    const forceChar = overrideMatch ? overrideMatch[1].trim() : null;
    const forceEmotion = overrideMatch ? overrideMatch[2].toLowerCase() : null;

    while ((match = regex.exec(text)) !== null) {
        const charName = match[1] ? match[1].trim() : "DefaultChar";
        const dialogue = match[2];

        segments.push({
            character: charName,
            dialogue: dialogue,
            overrideEmotion: (charName === forceChar) ? forceEmotion : null
        });
    }

    return { segments, globalForceChar: forceChar, globalForceEmotion: forceEmotion };
}

async function classifyDialogueEmotion(dialogueText) {
    try {
        if (window.classifyText) {
            const result = await window.classifyText(dialogueText);
            return result?.emotion || 'neutral';
        }
        
        if (/怒|恨|滚|生气|咬牙/.test(dialogueText)) return 'anger';
        if (/哭|难过|伤心|呜呜|悲伤/.test(dialogueText)) return 'sadness';
        if (/笑|开心|哈哈|高兴|欢快/.test(dialogueText)) return 'joy';
        if (/惊|什么|难道|惊讶/.test(dialogueText)) return 'surprised';

        return 'neutral';
    } catch (e) {
        return 'neutral';
    }
}

async function updateVNStage(parsedData) {
    const settings = getSettings();
    if (!settings.enabled) return;

    const { segments, globalForceChar, globalForceEmotion } = parsedData;
    if (!segments.length) return;

    const uniqueChars = [];
    for (let i = segments.length - 1; i >= 0; i--) {
        const c = segments[i].character;
        if (!uniqueChars.includes(c)) {
            uniqueChars.unshift(c);
        }
        if (uniqueChars.length >= MAX_ON_SCREEN) break;
    }

    const lastActiveSegment = segments[segments.length - 1];
    const currentSpeaker = lastActiveSegment.character;

    const charEmotionMap = {};
    for (const seg of segments) {
        if (seg.overrideEmotion) {
            charEmotionMap[seg.character] = seg.overrideEmotion;
        } else if (globalForceChar && seg.character === globalForceChar) {
            charEmotionMap[seg.character] = globalForceEmotion;
        } else {
            charEmotionMap[seg.character] = await classifyDialogueEmotion(seg.dialogue);
        }
    }

    const slots = [
        document.querySelector('#vn-multi-stage .vn-left'),
        document.querySelector('#vn-multi-stage .vn-center'),
        document.querySelector('#vn-multi-stage .vn-right')
    ];

    slots.forEach(s => s.innerHTML = '');

    uniqueChars.forEach((charName, index) => {
        const slot = slots[index];
        if (!slot) return;

        const emotion = charEmotionMap[charName] || 'neutral';
        
        const img = document.createElement('img');
        img.src = `img/expressions/${charName}/${emotion}.png`;
        img.className = 'vn-character-sprite';

        // 当前说话的角色触发 Bounce 跳动动画与高亮
        if (charName === currentSpeaker) {
            img.classList.add('speaker-active', 'emo-bounce');
        } else {
            img.classList.add('speaker-inactive');
        }

        img.onerror = () => {
            img.src = `img/expressions/${charName}/neutral.png`;
        };

        slot.appendChild(img);
    });
}

function bindEvents() {
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (messageId) => {
        const settings = getSettings();
        if (!settings.enabled) return;

        const context = getContext();
        const msg = context.chat[messageId];

        if (!msg || msg.is_user) return;

        const parsedData = parseMessageToSegments(msg.text);
        await updateVNStage(parsedData);
    });
}

jQuery(() => {
    getSettings();
    renderSettingsUI();
    initVNOverlay();
    bindEvents();
    console.log("[MeowEmotionVN] 👁🫦< 我注意到你的情绪了喵（含跳动动画）插件已加载！");
});
