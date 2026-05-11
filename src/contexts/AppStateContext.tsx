import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { AppState, AppAction } from '../types/app';
import { appReducer, initialState } from '../types/app';
import { useDatabase } from './DatabaseContext';
import { useRepositories } from './RepositoryContext';

interface AppStateContextValue {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    actions: {
        loadAllData: () => Promise<void>;
        addLog: (message: string) => void;
        clearLogs: () => void;
        toggleTheme: () => void;
    };
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { dbService, isReady } = useDatabase();
    const { categoryRepo, budgetRepo, transactionRepo, accountRepo, accountBalanceRepo, goalRepo, isReady: reposReady } = useRepositories();

    const addLog = useCallback((message: string) => {
        dispatch({ type: 'ADD_LOG', payload: message });
    }, []);

    const clearLogs = useCallback(() => {
        dispatch({ type: 'CLEAR_LOGS' });
    }, []);

    const toggleTheme = useCallback(() => {
        dispatch({ type: 'TOGGLE_THEME' });
    }, []);

    const loadAllData = useCallback(async () => {
        if (!dbService || !isReady || !reposReady) return;
        if (!categoryRepo || !budgetRepo || !transactionRepo || !accountRepo || !accountBalanceRepo || !goalRepo) return;

        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const [categories, budgets, transactions, accounts, accountBalances, goals] = await Promise.all([
                categoryRepo.findAll(),
                budgetRepo.findAll(),
                transactionRepo.findAll(),
                accountRepo.findAll(),
                accountBalanceRepo.findAll(),
                goalRepo.findAll(),
            ]);

            dispatch({
                type: 'LOAD_ALL_DATA',
                payload: { categories, budgets, transactions, accounts, accountBalances, goals },
            });

            addLog('Data loaded successfully');
        } catch (error) {
            addLog(`Failed to load data: ${error}`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dbService, isReady, reposReady, categoryRepo, budgetRepo, transactionRepo, accountRepo, accountBalanceRepo, goalRepo, addLog]);

    useEffect(() => {
        if (isReady && dbService && reposReady) {
            loadAllData();
        }
    }, [isReady, dbService, reposReady, loadAllData]);

    const value: AppStateContextValue = {
        state,
        dispatch,
        actions: {
            loadAllData,
            addLog,
            clearLogs,
            toggleTheme,
        },
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}

export function useAppDispatch() {
    const { dispatch } = useAppState();
    return dispatch;
}