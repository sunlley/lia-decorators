import 'reflect-metadata';

export const CONTROLLER_METADATA = 'cus:controller';
export const Controller = (path = ''): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
    };
}
