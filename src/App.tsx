import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider, RepositoryProvider, AppStateProvider } from './contexts';
import { ErrorBoundary } from './components/ui';
import { WelcomeAnimation } from './components/effects';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Debts from './pages/Debts';
import Settings from './pages/Settings';
import Debugger from './pages/Debugger';
import RecurringTransactions from './pages/RecurringTransactions';

const BASE_PATH = (import.meta.env.VITE_BASE_PATH as string) || (import.meta.env.PROD ? '/Finance-Management-Web' : '/');

function App() {
    const [showWelcome, setShowWelcome] = useState(() => {
        const hasVisited = sessionStorage.getItem('hasVisitedFinanceApp');
        return !hasVisited;
    });

    const handleWelcomeComplete = useCallback(() => {
        sessionStorage.setItem('hasVisitedFinanceApp', 'true');
        setShowWelcome(false);
    }, []);

    return (
        <ErrorBoundary>
            <DatabaseProvider>
                <RepositoryProvider>
                    <AppStateProvider>
                        <BrowserRouter basename={BASE_PATH}>
                            {showWelcome && <WelcomeAnimation onComplete={handleWelcomeComplete} />}
                            <Routes>
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="transactions" element={<Transactions />} />
                                    <Route path="budgets" element={<Budgets />} />
                                    <Route path="accounts" element={<Accounts />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="categories" element={<Categories />} />
                                    <Route path="calendar" element={<Calendar />} />
                                    <Route path="goals" element={<Goals />} />
                                    <Route path="debts" element={<Debts />} />
                                    <Route path="settings" element={<Settings />} />
                                    <Route path="recurring" element={<RecurringTransactions />} />
                                    <Route path="debugger" element={<Debugger />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </AppStateProvider>
                </RepositoryProvider>
            </DatabaseProvider>
        </ErrorBoundary>
    );
}

export default App;