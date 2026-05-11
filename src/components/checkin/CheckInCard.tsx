import { useState, useEffect, useCallback } from 'react';
import { useCheckInRepository } from '../../contexts/RepositoryContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAppState } from '../../contexts/AppStateContext';
import { achievementService } from '../../services/achievement/AchievementService';

interface CheckInState {
    hasCheckedIn: boolean;
    currentStreak: number;
    lastCheckIn: string | null;
    totalBonus: number;
    daysCount: number;
}

export default function CheckInCard() {
    const checkInRepo = useCheckInRepository();
    const { state } = useAppState();
    const { theme } = state;
    const [checkInState, setCheckInState] = useState<CheckInState>({
        hasCheckedIn: false,
        currentStreak: 0,
        lastCheckIn: null,
        totalBonus: 0,
        daysCount: 0,
    });
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [rewardAmount, setRewardAmount] = useState(0);

    const loadCheckInState = useCallback(async () => {
        if (!checkInRepo) return;

        const today = new Date().toISOString().split('T')[0];
        const todayCheckIn = await checkInRepo.findByDate(today);
        const latest = await checkInRepo.getLatest();
        const allCheckIns = await checkInRepo.findAll();
        const totalBonus = allCheckIns.reduce((sum, c) => sum + c.bonus, 0);

        setCheckInState({
            hasCheckedIn: !!todayCheckIn,
            currentStreak: latest?.streak || 0,
            lastCheckIn: latest?.checkInDate || null,
            totalBonus,
            daysCount: allCheckIns.length,
        });
    }, [checkInRepo]);

    useEffect(() => {
        loadCheckInState();
    }, [loadCheckInState]);

    const handleCheckIn = async () => {
        if (!checkInRepo || checkInState.hasCheckedIn) return;

        setIsCheckingIn(true);

        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            let streak = 1;
            if (checkInState.lastCheckIn) {
                const lastDate = new Date(checkInState.lastCheckIn);
                const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak = checkInState.currentStreak + 1;
                } else if (diffDays === 0) {
                    setIsCheckingIn(false);
                    return;
                }
            }

            const bonus = Math.min(10 + (streak - 1) * 2, 50);

            await checkInRepo.create({
                checkInDate: todayStr,
                streak,
                bonus,
            });

            setRewardAmount(bonus);
            setShowReward(true);
            setTimeout(() => setShowReward(false), 2000);

            await loadCheckInState();

            if (streak >= 7) {
                await achievementService.checkAndUnlock('week_streak', streak);
            }
            if (streak >= 30) {
                await achievementService.checkAndUnlock('month_streak', streak);
            }
        } catch (error) {
            console.error('Check-in failed:', error);
        } finally {
            setIsCheckingIn(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isDark = theme === 'dark';

    return (
        <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-indigo-900/40 via-purple-900/30 to-pink-900/40' : 'from-indigo-100/60 via-purple-100/50 to-pink-100/60'} pointer-events-none`} />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        📅 Daily Check-in
                    </h3>
                    {checkInState.hasCheckedIn && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                            ✓ Checked In
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                        <p className="text-2xl font-bold text-indigo-500">{checkInState.currentStreak}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Streak</p>
                    </div>
                    <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                        <p className="text-2xl font-bold text-purple-500">{checkInState.totalBonus}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Bonus</p>
                    </div>
                    <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                        <p className="text-2xl font-bold text-pink-500">{checkInState.daysCount}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Days</p>
                    </div>
                </div>

                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Last check-in: {formatDate(checkInState.lastCheckIn)}
                </p>

                <div className="relative">
                    <Button
                        onClick={handleCheckIn}
                        disabled={checkInState.hasCheckedIn || isCheckingIn}
                        isLoading={isCheckingIn}
                        className={`w-full transition-all duration-300 ${
                            checkInState.hasCheckedIn
                                ? 'bg-green-500/20 text-green-400 cursor-default'
                                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:scale-95'
                        }`}
                    >
                        {checkInState.hasCheckedIn ? '✓ Checked In Today' : '🎁 Check In & Earn Bonus'}
                    </Button>

                    {showReward && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl animate-pulse">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent text-2xl font-bold animate-bounce">
                                +{rewardAmount} Bonus Points!
                            </div>
                        </div>
                    )}
                </div>

                {!checkInState.hasCheckedIn && (
                    <div className={`mt-4 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Consecutive check-ins increase your bonus!
                    </div>
                )}
            </div>
        </Card>
    );
}