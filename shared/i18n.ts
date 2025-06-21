import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import ru from './locales/ru.json';
import en from './locales/en.json';

const i18n = new I18n({ ru, en });
i18n.enableFallback = true;
const deviceLocale = Localization.locale ? String(Localization.locale) : 'en';
i18n.locale = deviceLocale && deviceLocale.startsWith('ru') ? 'ru' : 'en';

export default i18n; 