// UI copy for the three supported languages, carried over from the
// Streamlit app's locales.py so wording stays consistent across both
// front ends. The AI system instructions / per-action request text stay
// backend-only (locales.py, used by backend/main.py) — this file only
// covers what the browser renders.
import type { Language } from "./types";

export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: "Русский",
  en: "English",
  vi: "Tiếng Việt",
};

export const SIGN_NAMES: Record<Language, Record<string, string>> = {
  ru: {
    aries: "Овен",
    taurus: "Телец",
    gemini: "Близнецы",
    cancer: "Рак",
    leo: "Лев",
    virgo: "Дева",
    libra: "Весы",
    scorpio: "Скорпион",
    sagittarius: "Стрелец",
    capricorn: "Козерог",
    aquarius: "Водолей",
    pisces: "Рыбы",
  },
  en: {
    aries: "Aries",
    taurus: "Taurus",
    gemini: "Gemini",
    cancer: "Cancer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Scorpio",
    sagittarius: "Sagittarius",
    capricorn: "Capricorn",
    aquarius: "Aquarius",
    pisces: "Pisces",
  },
  vi: {
    aries: "Bạch Dương",
    taurus: "Kim Ngưu",
    gemini: "Song Tử",
    cancer: "Cự Giải",
    leo: "Sư Tử",
    virgo: "Xử Nữ",
    libra: "Thiên Bình",
    scorpio: "Bọ Cạp",
    sagittarius: "Nhân Mã",
    capricorn: "Ma Kết",
    aquarius: "Bảo Bình",
    pisces: "Song Ngư",
  },
};

interface Copy {
  appTitle: string;
  appSubtitle: string;
  disclaimer: string;
  onboardingTitle: string;
  onboardingPoints: string[];
  askName: string;
  namePlaceholder: string;
  emptyName: string;
  askBirthDate: string;
  birthDatePlaceholder: string;
  invalidDate: string;
  dateInFuture: string;
  dateTooOld: string;
  consentLabel: string;
  consentWhy: string;
  consentRequired: string;
  saveButton: string;
  editProfile: string;
  profileName: string;
  profileBirthDate: string;
  profileZodiacSign: string;
  profileLifePath: string;
  heroGreeting: (name: string) => string;
  tabZodiac: string;
  tabNumerology: string;
  zodiacCards: Record<"my_sign" | "today" | "month" | "year" | "compatibility" | "ask_ai", string>;
  zodiacCardDesc: Record<"my_sign" | "today" | "month" | "year" | "compatibility" | "ask_ai", string>;
  numerologyCards: Record<
    "life_path" | "today" | "month" | "year" | "full_reading" | "compatibility" | "ask_ai",
    string
  >;
  numerologyCardDesc: Record<
    "life_path" | "today" | "month" | "year" | "full_reading" | "compatibility" | "ask_ai",
    string
  >;
  getForecastButton: string;
  getInterpretationButton: string;
  getFullReadingButton: string;
  getCompatibilityButton: string;
  askButton: string;
  askPlaceholderZodiac: string;
  askPlaceholderNumerology: string;
  companionName: string;
  companionBirthDate: string;
  loadingReading: string;
  translatingReading: string;
  errorGeneric: string;
  emptyResponse: string;
  serviceUnavailable: string;
  poweredBy: string;
}

export const COPY: Record<Language, Copy> = {
  ru: {
    appTitle: "✨ Зодиак и Нумерология",
    appSubtitle: "Характер, циклы и отношения — через астрологию, нумерологию и AI",
    disclaimer:
      "Астрологические и нумерологические прогнозы — это развлечение и повод для размышлений, а не научно доказанный способ предсказать будущее.",
    onboardingTitle: "Загляни в свою космическую карту",
    onboardingPoints: [
      "Точный расчёт знака и чисел",
      "Персональные AI-расклады",
      "3 языка, приватно и быстро",
    ],
    askName: "Как тебя зовут?",
    namePlaceholder: "Например, Анна",
    emptyName: "Имя не может быть пустым.",
    askBirthDate: "Дата рождения",
    birthDatePlaceholder: "ДД.ММ.ГГГГ",
    invalidDate: "Не удалось распознать дату. Формат: ДД.ММ.ГГГГ, ДД/ММ/ГГГГ или ГГГГ-ММ-ДД.",
    dateInFuture: "Дата рождения не может быть в будущем.",
    dateTooOld: "Такая дата выглядит нереалистично.",
    consentLabel:
      "Я соглашаюсь отправить своё имя и дату рождения AI для персонализированных раскладов.",
    consentWhy:
      "Это нужно, чтобы AI мог сформировать персональный расклад на основе твоего знака и чисел. Без согласия расчёты знака и чисел всё равно доступны — только AI-расклады требуют его.",
    consentRequired: "Необходимо согласие на отправку данных перед вызовом AI.",
    saveButton: "Сохранить профиль",
    editProfile: "Изменить профиль",
    profileName: "Имя",
    profileBirthDate: "Дата рождения",
    profileZodiacSign: "Знак зодиака",
    profileLifePath: "Число жизненного пути",
    heroGreeting: (name) => `Привет, ${name}`,
    tabZodiac: "♈ Знак зодиака",
    tabNumerology: "🔢 Нумерология",
    zodiacCards: {
      my_sign: "Мой знак",
      today: "Прогноз на сегодня",
      month: "Прогноз на месяц",
      year: "Прогноз на год",
      compatibility: "Совместимость",
      ask_ai: "Свой вопрос",
    },
    zodiacCardDesc: {
      my_sign: "Черты, сильные стороны, сложности",
      today: "Энергия дня для тебя",
      month: "Настроение и темы месяца",
      year: "Главные темы этого года",
      compatibility: "Сравни два знака зодиака",
      ask_ai: "Свой вопрос о твоём знаке",
    },
    numerologyCards: {
      life_path: "Число жизненного пути",
      today: "Число дня",
      month: "Число месяца",
      year: "Число года",
      full_reading: "Полный разбор",
      compatibility: "Совместимость",
      ask_ai: "Свой вопрос",
    },
    numerologyCardDesc: {
      life_path: "Главное число твоего пути",
      today: "Число дня и его смысл",
      month: "Число месяца и его смысл",
      year: "Число года и его смысл",
      full_reading: "Полный разбор всех чисел",
      compatibility: "Сравни числа двух людей",
      ask_ai: "Свой вопрос о нумерологии",
    },
    getForecastButton: "Получить прогноз",
    getInterpretationButton: "Получить AI-расклад",
    getFullReadingButton: "Получить полный разбор",
    getCompatibilityButton: "Проверить совместимость",
    askButton: "Спросить",
    askPlaceholderZodiac: "Что ты хочешь спросить про свой знак зодиака?",
    askPlaceholderNumerology: "Что ты хочешь спросить про свою нумерологию?",
    companionName: "Как зовут второго человека?",
    companionBirthDate: "Дата рождения второго человека",
    loadingReading: "AI думает...",
    translatingReading: "переводим на новый язык...",
    errorGeneric: "Произошла ошибка при обращении к AI. Попробуй ещё раз.",
    emptyResponse: "AI вернул пустой ответ. Попробуй ещё раз.",
    serviceUnavailable: "AI-сервис временно недоступен.",
    poweredBy: "AI-провайдер",
  },
  en: {
    appTitle: "✨ Zodiac & Numerology",
    appSubtitle: "Character, cycles, and relationships — through astrology, numerology, and AI",
    disclaimer:
      "Astrological and numerology forecasts are for entertainment and self-reflection, not a scientifically proven way to predict the future.",
    onboardingTitle: "Discover your cosmic blueprint",
    onboardingPoints: [
      "Precise sign & number calculations",
      "Personal AI readings",
      "3 languages, private and fast",
    ],
    askName: "What's your name?",
    namePlaceholder: "e.g. Anna",
    emptyName: "Name can't be empty.",
    askBirthDate: "Birth date",
    birthDatePlaceholder: "DD.MM.YYYY",
    invalidDate: "Couldn't parse that date. Use DD.MM.YYYY, DD/MM/YYYY, or YYYY-MM-DD.",
    dateInFuture: "Birth date can't be in the future.",
    dateTooOld: "That date doesn't look realistic.",
    consentLabel: "I consent to send my name and birth date to the AI for personalized readings.",
    consentWhy:
      "This lets the AI build a personal reading from your sign and numbers. Calculations still work without it — only AI readings need your consent.",
    consentRequired: "Consent is required before calling the AI.",
    saveButton: "Save profile",
    editProfile: "Edit profile",
    profileName: "Name",
    profileBirthDate: "Birth date",
    profileZodiacSign: "Zodiac sign",
    profileLifePath: "Life Path Number",
    heroGreeting: (name) => `Hi, ${name}`,
    tabZodiac: "♈ Zodiac",
    tabNumerology: "🔢 Numerology",
    zodiacCards: {
      my_sign: "My sign",
      today: "Today's forecast",
      month: "Monthly forecast",
      year: "Yearly forecast",
      compatibility: "Compatibility",
      ask_ai: "Ask AI",
    },
    zodiacCardDesc: {
      my_sign: "Traits, strengths, challenges",
      today: "Today's energy, just for you",
      month: "This month's mood and themes",
      year: "This year's key themes",
      compatibility: "Compare two zodiac signs",
      ask_ai: "Ask anything about your sign",
    },
    numerologyCards: {
      life_path: "Life Path Number",
      today: "Today's number",
      month: "This month's number",
      year: "This year's number",
      full_reading: "Full reading",
      compatibility: "Compatibility",
      ask_ai: "Ask AI",
    },
    numerologyCardDesc: {
      life_path: "The core number of your path",
      today: "Today's number and its meaning",
      month: "This month's number and meaning",
      year: "This year's number and meaning",
      full_reading: "A full reading of every number",
      compatibility: "Compare two people's numbers",
      ask_ai: "Ask anything about your numerology",
    },
    getForecastButton: "Get forecast",
    getInterpretationButton: "Get AI reading",
    getFullReadingButton: "Get full reading",
    getCompatibilityButton: "Check compatibility",
    askButton: "Ask",
    askPlaceholderZodiac: "What would you like to ask about your zodiac sign?",
    askPlaceholderNumerology: "What would you like to ask about your numerology?",
    companionName: "What is the second person's name?",
    companionBirthDate: "Second person's birth date",
    loadingReading: "AI is thinking...",
    translatingReading: "translating to the new language...",
    errorGeneric: "Something went wrong contacting the AI. Please try again.",
    emptyResponse: "The AI returned an empty response. Please try again.",
    serviceUnavailable: "The AI service is temporarily unavailable.",
    poweredBy: "AI provider",
  },
  vi: {
    appTitle: "✨ Cung Hoàng Đạo & Thần Số Học",
    appSubtitle: "Tính cách, chu kỳ và các mối quan hệ — qua chiêm tinh, thần số học và AI",
    disclaimer:
      "Vận trình chiêm tinh và thần số học chỉ mang tính giải trí và tự chiêm nghiệm, không phải phương pháp dự đoán tương lai đã được khoa học chứng minh.",
    onboardingTitle: "Khám phá bản đồ vũ trụ của bạn",
    onboardingPoints: [
      "Tính toán chính xác cung và con số",
      "Luận giải AI cá nhân hóa",
      "3 ngôn ngữ, riêng tư và nhanh chóng",
    ],
    askName: "Bạn tên là gì?",
    namePlaceholder: "Ví dụ: Anna",
    emptyName: "Tên không được để trống.",
    askBirthDate: "Ngày sinh",
    birthDatePlaceholder: "DD.MM.YYYY",
    invalidDate: "Không nhận dạng được ngày. Dùng định dạng DD.MM.YYYY, DD/MM/YYYY, hoặc YYYY-MM-DD.",
    dateInFuture: "Ngày sinh không thể ở tương lai.",
    dateTooOld: "Ngày này có vẻ không hợp lý.",
    consentLabel: "Tôi đồng ý gửi tên và ngày sinh của mình cho AI để nhận phân tích cá nhân hóa.",
    consentWhy:
      "Điều này giúp AI tạo luận giải cá nhân dựa trên cung và con số của bạn. Các phép tính vẫn hoạt động nếu không có — chỉ luận giải AI mới cần sự đồng ý.",
    consentRequired: "Cần có sự đồng ý trước khi gọi AI.",
    saveButton: "Lưu hồ sơ",
    editProfile: "Chỉnh sửa hồ sơ",
    profileName: "Tên",
    profileBirthDate: "Ngày sinh",
    profileZodiacSign: "Cung hoàng đạo",
    profileLifePath: "Số chủ đạo (Life Path)",
    heroGreeting: (name) => `Xin chào, ${name}`,
    tabZodiac: "♈ Cung hoàng đạo",
    tabNumerology: "🔢 Thần số học",
    zodiacCards: {
      my_sign: "Cung của tôi",
      today: "Vận trình hôm nay",
      month: "Vận trình tháng này",
      year: "Vận trình năm nay",
      compatibility: "Sự hợp nhau",
      ask_ai: "Hỏi AI",
    },
    zodiacCardDesc: {
      my_sign: "Tính cách, điểm mạnh, thử thách",
      today: "Năng lượng hôm nay dành cho bạn",
      month: "Tâm trạng và chủ đề tháng này",
      year: "Những chủ đề chính của năm nay",
      compatibility: "So sánh hai cung hoàng đạo",
      ask_ai: "Hỏi bất cứ điều gì về cung của bạn",
    },
    numerologyCards: {
      life_path: "Số chủ đạo",
      today: "Con số hôm nay",
      month: "Con số tháng này",
      year: "Con số năm nay",
      full_reading: "Phân tích đầy đủ",
      compatibility: "Sự hợp nhau",
      ask_ai: "Hỏi AI",
    },
    numerologyCardDesc: {
      life_path: "Con số cốt lõi của hành trình",
      today: "Con số hôm nay và ý nghĩa",
      month: "Con số tháng này và ý nghĩa",
      year: "Con số năm nay và ý nghĩa",
      full_reading: "Phân tích đầy đủ mọi con số",
      compatibility: "So sánh con số của hai người",
      ask_ai: "Hỏi bất cứ điều gì về thần số học",
    },
    getForecastButton: "Xem vận trình",
    getInterpretationButton: "Xem luận giải AI",
    getFullReadingButton: "Xem phân tích đầy đủ",
    getCompatibilityButton: "Kiểm tra sự hợp nhau",
    askButton: "Hỏi",
    askPlaceholderZodiac: "Bạn muốn hỏi gì về cung hoàng đạo của mình?",
    askPlaceholderNumerology: "Bạn muốn hỏi gì về thần số học của mình?",
    companionName: "Người thứ hai tên là gì?",
    companionBirthDate: "Ngày sinh của người thứ hai",
    loadingReading: "AI đang suy nghĩ...",
    translatingReading: "đang dịch sang ngôn ngữ mới...",
    errorGeneric: "Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.",
    emptyResponse: "AI trả về phản hồi trống. Vui lòng thử lại.",
    serviceUnavailable: "Dịch vụ AI tạm thời không khả dụng.",
    poweredBy: "Nhà cung cấp AI",
  },
};

export function t(language: Language): Copy {
  return COPY[language];
}
