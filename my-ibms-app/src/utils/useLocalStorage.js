import { useState, useEffect } from 'react';
import { loadData, saveData } from '../services/storage';

/**
 * 自定义 Hook：自动将数据持久化到 localStorage
 * 用法：const [data, setData] = useLocalStorage('key', defaultData);
 */
export function useLocalStorage(key, defaultValue) {
  const [data, setData] = useState(() => {
    const stored = loadData(key, null);
    // 如果存储的是空数组且默认值非空，用默认值覆盖
    if (Array.isArray(stored) && stored.length === 0 && Array.isArray(defaultValue) && defaultValue.length > 0) {
      return defaultValue;
    }
    return stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    saveData(key, data);
  }, [key, data]);

  return [data, setData];
}
