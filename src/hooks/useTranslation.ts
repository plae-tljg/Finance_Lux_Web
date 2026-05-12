import { useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { t as translate, Language } from '../i18n';

export function useTranslation() {
    const { state } = useAppState();
    const lang: Language = state.language;

    const t = useCallback((key: string): string => {
        return translate(key, lang);
    }, [lang]);

    return { t, language: lang };
}

export { Language };