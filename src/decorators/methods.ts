import 'reflect-metadata';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
/**
 * params key
 */
export type AssertParamsType1 = string | `${string}|${string}`;
export type AssertParamsType2 = 'string' | 'number' | 'boolean' | 'object';
export type AssertParamsType2_1 = string | number | boolean | object | ((value: any) => any);
/**
 * exp1:string[]
 * [ 'name', 'age' ]
 *
 * exp2:[string,typeof][]
 * [ ['name','string'] ,['age','number'] ]
 *
 * exp3:[string,typeof,defaultValue][]
 * [ ['name','string','Tom'] ,['age','number',18] ]
 */
export type AssertParamsType =
  | AssertParamsType1
  | [string, AssertParamsType2]
  | [string, AssertParamsType2, AssertParamsType2_1];
const AssertParamsDefault: any = {
  string: '',
  number: 0,
  boolean: true,
  object: undefined,
};

export const ROUTE_METADATA = 'cus:method';
export const AUTHORIZATION_METADATA = 'cus:authorization';

export function CallLog(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor): PropertyDescriptor {
  const method = propertyDescriptor.value;

  propertyDescriptor.value = function (...args: any[]) {
    console.log(`Call [${propertyName}] Start`, 'Args', args);
    const params = args;
    const result = method.apply(this, args);
    return result;
  };
  return propertyDescriptor;
}

const create_method_log = (options?: {
  formater?: (...args: any[]) => any;
  tag?: string;
  showTime?: boolean;
  showEnd?: boolean;
}) => {
  return (target: object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    let formater = options?.formater;
    let tag = options?.tag;
    let showTime = options?.showTime ?? true;
    let showEnd = options?.showEnd ?? false;
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      let startTime = Date.now();
      const args_: any[] = [];
      if (tag) {
        args_.push(tag);
      }
      if (showTime) {
        args_.push(new Date().toLocaleString());
      }
      args_.push(`${target.constructor.name}'${name}`);
      if (formater) {
        let message = formater(...args);
        args_.push(message);
      } else {
        if (args) {
          args_.push(JSON.stringify(args));
        }
      }
      console.log(...args_);
      const result = method.apply(this, args);
      console.log(...args_.slice(0, args_.length - 1), 'Done', `UseTime:${Date.now() - startTime}ms`);
      return result;
    };
    return descriptor;
  };
};

const defaultAssertKey = (params: any, key: AssertParamsType, useDefault: boolean) => {
  if (typeof key === 'string') {
    key = key.trim();
    if (!Object.hasOwn(params, key)) {
      throw new Error(`params.${key} is not exist`);
    }
  } else if (Array.isArray(key)) {
    // console.log('defaultAssertKey', 'array', key);
    let hasKeyName = '';
    let key_ = '';
    let type_ = '';
    let defaultValue_: any;
    if (key.length > 1) {
      key_ = key[0].trim();
      type_ = key[1];
    }
    if (key.length == 3) {
      defaultValue_ = key[2];
    }
    let keys_: string[] | undefined;
    if (key_.indexOf('|') > 0) {
      keys_ = key_.split('|');
      for (const key1 of keys_) {
        if (Object.hasOwn(params, key1)) {
          hasKeyName = key1;
          break;
        }
      }
      hasKeyName = keys_[0];
    } else {
      hasKeyName = key_;
    }
    if (!Object.hasOwn(params, hasKeyName)) {
      if (defaultValue_) {
        if (typeof defaultValue_ =='function'){
          defaultValue_ = defaultValue_(params);
        }
        if (typeof defaultValue_ != type_) {
          throw new Error(`params.${hasKeyName}'s default value type is not ${type_}`);
        } else {
          params[hasKeyName] = defaultValue_;
        }
      } else if (useDefault) {
        defaultValue_ = AssertParamsDefault[type_];
        params[hasKeyName] = defaultValue_;
      } else {
        throw new Error(`params.${hasKeyName} is not exist`);
      }
    } else {
      if (defaultValue_){
        if (typeof defaultValue_ =='function'){
          params[hasKeyName] = defaultValue_(params[hasKeyName]);
        }
      }
      if (type_ != typeof params[hasKeyName]) {
        throw new Error(`params.${hasKeyName} type is not ${type_}`);
      }
    }
  }
};
const defaultAssertParams = (params: any, keys: AssertParamsType[], useDefault: boolean) => {
  for (const key of keys) {
    defaultAssertKey(params, key, useDefault);
  }
};

function create_assert_params(
  keys: AssertParamsType[],
  options?: {
    validator?: string | ((value: any, keys: AssertParamsType[]) => void);
    paramsIndex?: number;
    useDefault?: boolean;
    catcher?: (error: Error | any) => void;
  },
) {
  return (target: object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    // console.log('create_assert_params', 'target....', Object.getOwnPropertyNames(target));
    // console.log('create_assert_params', 'name......', name);
    // console.log('create_assert_params', 'descriptor', descriptor);
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      let { validator, paramsIndex, useDefault, catcher } = options ?? {};
      paramsIndex = paramsIndex ?? 0;
      useDefault = useDefault ?? false;
      const params = args[paramsIndex];
      try {
        if (validator) {
          if (typeof validator === 'function') {
            validator(params, keys);
          } else {
            let hasOwn = Object.hasOwn(target, validator);
            if (hasOwn) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              target[assertFunction](params, keys);
            } else {
              throw new Error(`${target.constructor.name} has no property ${validator}`);
            }
          }
        } else {
          defaultAssertParams(params, keys, useDefault);
        }
      } catch (e: any) {
        if (catcher) {
          catcher(e);
        } else {
          throw e;
        }
      }
      return method.apply(this, args);
    };
    return descriptor;
  };
}

export function createMethodDecorator(method: HttpMethod = 'get') {
  return (path = ''): MethodDecorator =>
    (target: any, name: string | symbol, descriptor: any) => {
      Reflect.defineMetadata(ROUTE_METADATA, { type: method, path }, descriptor.value);
    };
}

export function createAuthorizationDecorator() {
  return (auth: boolean, key?: string): MethodDecorator =>
    (target: any, name: string | symbol, descriptor: any) => {
      Reflect.defineMetadata(AUTHORIZATION_METADATA, { auth, key }, descriptor.value);
    };
}

export const MethodLog = create_method_log;
export const AssertParams = create_assert_params;
export const Authorization = createAuthorizationDecorator();

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');
