import { useCallback, useState, useEffect, useRef } from 'react';
import { type Database } from 'sql.js';
import { insertSampleDataWithCheck, checkTableExists as checkTableExistsService, initializeDatabaseFull, checkIsDatabaseInitialized } from '../services/database/services';
import DatabaseService from '../services/database/DatabaseService';

export interface TableSchema {
  name: string;
  sql: string;
}

export interface DatabaseState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  database: Database | null;
  isInitialized: boolean;
}

export const useDatabaseSetup = () => {
  const [state, setState] = useState<DatabaseState>({
    isReady: false,
    isLoading: false,
    error: null,
    database: null,
    isInitialized: false,
  });

  const dbServiceRef = useRef<DatabaseService | null>(null);
  const isInitializingRef = useRef(false);

  // 创建所有表
  const createTables = useCallback(async (db: Database): Promise<void> => {
    if (!db) return;
    try {
      await initializeDatabaseFull(db);
    } catch (error) {
      console.error('❌ 创建表失败:', error);
      throw error;
    }
  }, []);

  // 检查表是否存在
  const checkTableExists = useCallback((tableName: string): boolean => {
    if (!state.database) return false;
    return checkTableExistsService(state.database, tableName);
  }, [state.database]);

  // 添加示例数据
  const addSampleData = useCallback(async (db: Database): Promise<void> => {
    if (!db) return;
    try {
      await insertSampleDataWithCheck(db);
    } catch (error) {
      console.error('❌ 添加示例数据失败:', error);
      throw error;
    }
  }, []);

  // 检查数据库是否已经初始化
  const isDatabaseInitialized = useCallback((db: Database): boolean => {
    return checkIsDatabaseInitialized(db);
  }, []);

  // 智能初始化数据库
  const initializeDatabase = useCallback(async (db: Database): Promise<void> => {
    if (!db) return;

    try {
      // 检查是否已经初始化
      if (isDatabaseInitialized(db)) {
        return;
      }

      // 创建表结构和索引
      await createTables(db);
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }, [createTables, isDatabaseInitialized]);

  // 初始化数据库服务
  const initializeDatabaseService = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current || state.isReady) return;

    try {
      isInitializingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 获取数据库服务实例
      const dbService = DatabaseService.getInstance();
      dbServiceRef.current = dbService;

      // 初始化数据库
      await dbService.initialize(initializeDatabase);

      // 获取数据库实例
      const database = dbService.getDatabase();
      const isInitialized = dbService.isDatabaseInitialized();

      if (database) {
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoading: false,
          database,
          isInitialized,
        }));
      } else {
        throw new Error('数据库实例获取失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isReady: false,
      }));
      console.error('❌ 数据库服务初始化失败:', error);
    } finally {
      isInitializingRef.current = false;
    }
  }, [initializeDatabase]);

  // 重置数据库
  const resetDatabase = useCallback(async (): Promise<void> => {
    if (!dbServiceRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await dbServiceRef.current.resetDatabase();
      
      // 重新初始化
      await initializeDatabaseService();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [initializeDatabaseService]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 自动初始化
  useEffect(() => {
    initializeDatabaseService();
  }, [initializeDatabaseService]);

  return {
    // 状态
    ...state,
    
    // 方法
    createTables,
    checkTableExists,
    initializeDatabase,
    isDatabaseInitialized,
    addSampleData,
    initializeDatabaseService,
    resetDatabase,
    clearError,
    
    // 便捷属性
    dbService: dbServiceRef.current,
  };
};
