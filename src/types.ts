import type { ReadStream as ReadStreamBase, WriteStream as WriteStreamBase } from 'fs';
import type { Options as OptionsBase } from 'fast-extract';

export type { Progress } from 'fast-extract';
export interface Options extends OptionsBase {
  headers?: object | Headers | Headers;
  extract?: boolean;
  time?: number;
}

export interface OptionsInternal extends Options {
  time?: number;
}

export type Callback = (error?: Error) => void;
export type FileCallback = (error?: Error, filePath?: string) => void;

export interface HeadResponse {
  statusCode: number;
  headers: object | Headers;
}
export type HeadCallback = (error?: Error, res?: HeadResponse) => void;

export interface JSONResponse {
  statusCode: number;
  headers: object | Headers;
  body: object;
}
export type JSONCallback = (error?: Error, stream?: JSONResponse) => void;

export type PipeCallback = (error?: Error) => void;

export interface StreamOptions {
  method?: string;
}
export interface WriteStream extends WriteStreamBase {
  statusCode?: number;
  headers?: object | Headers;
}
export interface ReadStream extends ReadStreamBase {
  filename?: string;
  statusCode?: number;
  headers?: object | Headers;
}
export type StreamCallback = (error?: Error, stream?: ReadStream) => void;

export interface TextResponse {
  statusCode: number;
  headers: object | Headers;
  body: string;
}
export type TextCallback = (error?: Error, stream?: TextResponse) => void;

export interface StreamSource extends ReadStream {
  size?: number;
  basename?: string;
  filename?: string;
}

export interface SourceStats {
  size?: number;
  basename?: string;
}

export type Source = StreamSource | string;
