/**
 * 将一个具有下划线命名风格的 JSON 对象的属性转换成驼峰命名风格
 * @param obj
 * @returns
 */
export const convertKeysToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item))
  }
  return Object.keys(obj).reduce((acc: any, key) => {
    const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) =>
      letter.toUpperCase()
    )
    let value = obj[key]
    if (typeof value === 'object' && value !== null) {
      value = convertKeysToCamelCase(value)
    }
    acc[camelCaseKey] = value
    return acc
  }, {})
}
