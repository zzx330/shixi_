import { useState, useEffect } from 'react';
import { loadData, saveData } from '../services/storage';

/**
 * 自定义 Hook：自动将数据持久化到 localStorage
 * 用法：const [data, setData] = useLocalStorage('key', defaultData);
 */
export function useLocalStorage(key, defaultValue) {
  const [data, setData] = useState(() => loadData(key, defaultValue));

  useEffect(() => {
    saveData(key, data);
  }, [key, data]);

  return [data, setData];
}
