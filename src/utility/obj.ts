/**
 * 将一个具有下划线命名风格的 JSON 对象的属性转换成驼峰命名风格
 * @param obj
 * @param parentKey
 * @returns
 */
export const convertKeysToCamelCase = (obj: any, parentKey: string = ''): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item));
  }
  let res = Object.keys(obj).reduce((acc: any, key) => {
    const camelCaseKey = parentKey 
      ? `${parentKey}${key.charAt(0).toUpperCase()}${key.slice(1).replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())}` 
      : key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

    let value = obj[key];
    if (typeof value === 'object' && value !== null) {
      // Check if the current key is 'time_zone' or 'currency'
      if (key === 'time_zone' || key === 'currency') {
        value = convertKeysToCamelCase(value, camelCaseKey);
        Object.assign(acc, value);
      } else {
        value = convertKeysToCamelCase(value);
        acc[camelCaseKey] = value;
      }
    } else {
      acc[camelCaseKey] = value;
    }
    return acc;
  }, {});
  console.log(`转换后的obj:`, res);
  return res;
};
