export = Response;
declare function Response(endpoint: any, options: any): void;
declare class Response {
    constructor(endpoint: any, options: any);
    endpoint: any;
    options: any;
    stream(options: any, callback: any): any;
    extract: (dest: any, options: any, callback: any) => any;
    file: (dest: any, options: any, callback: any) => any;
    head: (callback: any) => any;
    json: (callback: any) => any;
    pipe: (dest: any, callback: any) => any;
    text: (callback: any) => any;
}
