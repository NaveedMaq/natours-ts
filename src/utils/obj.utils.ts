import lodash from 'lodash';

export function makePropertiesEnumerable(obj: any) {
  const propertyDescriptors = Object.getOwnPropertyDescriptors(obj);

  for (const key in propertyDescriptors) {
    propertyDescriptors[key].enumerable = true;
  }

  const newObj = Object.create(Object.getPrototypeOf(obj));
  Object.defineProperties(newObj, propertyDescriptors);

  return newObj;
}

export function cloneError(error: any) {
  return lodash.clone(makePropertiesEnumerable(error));
}
