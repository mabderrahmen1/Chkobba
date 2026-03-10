/**
 * Internationalization (i18n)
 * English and Tunisian Arabic translations
 */

const translations = {
  en: {
    // Landing
    tagline: 'The Traditional Tunisian Card Game',
    nicknamePlaceholder: 'Enter your nickname',
    playNow: 'Play Now',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    
    // Create Room
    createRoomTitle: 'Create New Room',
    targetScore: 'Target Score',
    maxPlayers: 'Players',
    create: 'Create',
    cancel: 'Cancel',
    
    // Join Room
    joinRoomTitle: 'Join Room',
    roomCode: 'Room Code',
    roomCodePlaceholder: 'ABCD1234',
    join: 'Join',
    
    // Lobby
    lobby: 'Lobby',
    roomCodeLabel: 'Room:',
    copy: 'Copy',
    ready: 'Ready',
    startGame: 'Start Game',
    leave: 'Leave',
    waitingForPlayers: 'Waiting for players...',
    hostBadge: 'Host',
    
    // Game
    team1: 'Team 1',
    team2: 'Team 2',
    round: 'Round',
    cards: 'cards',
    yourTurn: 'Your Turn',
    opponentTurn: 'Opponent\'s Turn',
    captured: 'Captured:',
    selectCapture: 'Select Capture',
    roundOver: 'Round Over!',
    gameOver: 'Game Over!',
    newGame: 'New Game',
    rematch: 'Play Again',
    continue: 'Continue',
    playerDisconnected: 'Player Disconnected',
    tableEmpty: 'Table is empty',
    
    // Capture options
    captureSingle: 'Capture 1 card',
    captureCombination: 'Capture {count} cards',
    
    // Score categories
    carta: 'Carta (Most Cards)',
    dinari: 'Dinari (Most Diamonds)',
    bermila: 'Bermila (Most 7s)',
    sabaaElHaya: 'Sabaa el Haya (7♦)',
    chkobba: 'Chkobba (Sweeps)',
    
    // Chat
    chatPlaceholder: 'Type a message...',
    send: 'Send',
    
    // System messages
    playerJoined: '{name} joined the room',
    playerLeft: '{name} left the room',
    playerReady: '{name} is ready',
    gameStarted: 'Game started!',
    chkobbaMessage: '🎉 CHKOBBA by {name}!',
    roundEnded: 'Round {round} ended',
    gameWon: '{team} wins the game!',
    autoWinWarning: '{name} disconnected. Auto-win in {time} seconds.',
    autoWin: '{name} didn\'t reconnect. {winner} wins!',
    
    // Errors
    errorGeneric: 'Something went wrong',
    errorRoomNotFound: 'Room not found',
    errorRoomFull: 'Room is full',
    errorNicknameTaken: 'Nickname already taken',
    errorGameStarted: 'Game already started',
    errorNotYourTurn: 'Not your turn',
    errorInvalidCard: 'Invalid card',
    
    // Team names for game over
    team1Wins: 'Team 1 Wins!',
    team2Wins: 'Team 2 Wins!',
    youWin: 'You Win!',
    youLose: 'You Lose!',
    tie: 'It\'s a Tie!'
  },
  
  tn: {
    // Landing
    tagline: 'لعبة الورق التونسية التقليدية',
    nicknamePlaceholder: 'أدخل اسمك',
    playNow: 'العب الآن',
    createRoom: 'أنشئ غرفة',
    joinRoom: 'انضم لغرفة',
    
    // Create Room
    createRoomTitle: 'أنشئ غرفة جديدة',
    targetScore: 'النقاط المطلوبة',
    maxPlayers: 'اللاعبين',
    create: 'أنشئ',
    cancel: 'إلغاء',
    
    // Join Room
    joinRoomTitle: 'انضم لغرفة',
    roomCode: 'رمز الغرفة',
    roomCodePlaceholder: 'ABCD1234',
    join: 'انضم',
    
    // Lobby
    lobby: 'غرفة الانتظار',
    roomCodeLabel: 'الغرفة:',
    copy: 'نسخ',
    ready: 'جاهز',
    startGame: 'ابدأ اللعبة',
    leave: 'مغادرة',
    waitingForPlayers: 'في انتظار اللاعبين...',
    hostBadge: 'مضيف',
    
    // Game
    team1: 'فريق 1',
    team2: 'فريق 2',
    round: 'جولة',
    cards: 'أوراق',
    yourTurn: 'دورك',
    opponentTurn: 'دور الخصم',
    captured: 'التقاط:',
    selectCapture: 'اختر الالتقاط',
    roundOver: 'انتهت الجولة!',
    gameOver: 'انتهت اللعبة!',
    newGame: 'لعبة جديدة',
    rematch: 'العب مرة أخرى',
    continue: 'تابع',
    playerDisconnected: 'انقطع اللاعب',
    tableEmpty: 'الطاولة فارغة',
    
    // Capture options
    captureSingle: 'التقاط ورقة واحدة',
    captureCombination: 'التقاط {count} أوراق',
    
    // Score categories
    carta: 'كرطة (أكثر أوراق)',
    dinari: 'ديناري (أكثر ديناري)',
    bermila: 'بيرميلا (أكثر سباعيات)',
    sabaaElHaya: 'سبعة العيا (7♦)',
    chkobba: 'شكوبة (كنس)',
    
    // Chat
    chatPlaceholder: 'اكتب رسالة...',
    send: 'إرسال',
    
    // System messages
    playerJoined: '{name} انضم للغرفة',
    playerLeft: '{name} غادر الغرفة',
    playerReady: '{name} جاهز',
    gameStarted: 'بدأت اللعبة!',
    chkobbaMessage: '🎉 شكوبة من {name}!',
    roundEnded: 'انتهت الجولة {round}',
    gameWon: '{team} فاز باللعبة!',
    autoWinWarning: '{name} انقطع. فوز تلقائي خلال {time} ثانية.',
    autoWin: '{name} ما رجعش. {winner} فاز!',
    
    // Errors
    errorGeneric: 'حدث خطأ ما',
    errorRoomNotFound: 'الغرفة غير موجودة',
    errorRoomFull: 'الغرفة ممتلئة',
    errorNicknameTaken: 'الاسم مستخدم بالفعل',
    errorGameStarted: 'اللعبة بدأت بالفعل',
    errorNotYourTurn: 'ليس دورك',
    errorInvalidCard: 'ورقة غير صالحة',
    
    // Team names for game over
    team1Wins: 'فريق 1 فاز!',
    team2Wins: 'فريق 2 فاز!',
    youWin: 'فزت!',
    youLose: 'خسرت!',
    tie: 'تعادل!'
  }
};

// Current language
let currentLang = 'en';

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {Object} params - Parameters to replace
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  const lang = translations[currentLang] || translations.en;
  let text = lang[key] || translations.en[key] || key;
  
  // Replace parameters
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
  }
  
  return text;
}

/**
 * Set the current language
 * @param {string} lang - Language code ('en' or 'tn')
 */
function setLanguage(lang) {
  currentLang = lang;
  
  // Update direction
  document.documentElement.dir = lang === 'tn' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang === 'tn' ? 'ar' : 'en';
  
  // Update language toggle text
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    const langText = langToggle.querySelector('.lang-text');
    if (langText) {
      langText.textContent = lang === 'tn' ? 'English' : 'عربي';
    }
  }
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  // Update all elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  
  // Save preference
  localStorage.setItem('chkobba_lang', lang);
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('languageChange', { detail: { lang } }));
}

/**
 * Get current language
 * @returns {string} Current language code
 */
function getLanguage() {
  return currentLang;
}

/**
 * Initialize i18n from saved preference or default
 */
function initI18n() {
  const savedLang = localStorage.getItem('chkobba_lang') || 'en';
  setLanguage(savedLang);
}

// Export for use in other modules
window.i18n = {
  t,
  setLanguage,
  getLanguage,
  initI18n,
  translations
};

// ==================== Theme Toggle ====================

/**
 * Set the theme
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a2e' : '#f5f7fa');
  }
  
  // Save preference
  localStorage.setItem('chkobba_theme', theme);
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Get current theme
 * @returns {string} Current theme
 */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Initialize theme from saved preference or default
 */
function initTheme() {
  const savedTheme = localStorage.getItem('chkobba_theme') || 'light';
  setTheme(savedTheme);
}

// Add theme functions to global scope
window.i18n.setTheme = setTheme;
window.i18n.toggleTheme = toggleTheme;
window.i18n.getTheme = getTheme;

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initTheme();
});
