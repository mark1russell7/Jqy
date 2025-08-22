// object.utils.js
export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}
