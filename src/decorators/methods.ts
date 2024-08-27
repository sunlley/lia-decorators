import 'reflect-metadata';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export const ROUTE_METADATA = 'cus:method';
export const AUTHORIZATION_METADATA = 'cus:authorization';

export function CallLog(
    target: Object,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor): PropertyDescriptor {

    const method = propertyDescriptor.value;

    propertyDescriptor.value = function (...args: any[]) {
        console.log(`Call [${propertyName}] Start`, 'Args', args);
        const params = args;
        const result = method.apply(this, args);
        return result;

    }
    return propertyDescriptor;
}

function create_assert_params(keys: any, assertFunction?: string) {
    return (target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
        const method = descriptor.value;
        descriptor.value = function (...args: any[]) {
            // @ts-ignore
            target[assertFunction ? assertFunction : 'assertParams'](args[0], keys)
            const result = method.apply(this, args);
            return result;
        }
        return descriptor;
    }
}


export function createMethodDecorator(method: HttpMethod = 'get') {

    return (path = ''): MethodDecorator => (target: any, name: string | symbol, descriptor: any) => {
        Reflect.defineMetadata(
            ROUTE_METADATA,
            {type: method, path},
            descriptor.value,
        );
    };
}
export function createAuthorizationDecorator() {

    return (auth:boolean,key?:string): MethodDecorator => (target: any, name: string | symbol, descriptor: any) => {
        Reflect.defineMetadata(
            AUTHORIZATION_METADATA,
            {auth,key},
            descriptor.value,
        );
    };
}

export const AssertParams = create_assert_params;
export const Authorization = createAuthorizationDecorator();

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');
