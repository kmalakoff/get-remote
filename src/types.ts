import type { ReadStream } from 'fs';

export type ExtractCallback = (error?: Error) => void;
export type FileCallback = (error?: Error, filePath?: string) => void;

export interface HeadResponse {
  statusCode: number;
  headers: object;
}
export type HeadCallback = (error?: Error, res?: HeadResponse) => void;

export interface JSONStream extends ReadStream {
  body: object;
}
export type JSONCallback = (error?: Error, stream?: JSONStream) => void;

export type PipeCallback = (error?: Error) => void;

export interface StreamOption {
  method?: string;
}
export interface StreamResponse extends ReadStream {
  statusCode: number;
  headers: object;
}
export type StreamCallback = (error?: Error, stream?: StreamResponse) => void;

export interface TextResponse {
  statusCode: number;
  headers: object;
  body: string;
}
export type TextCallback = (error?: Error, stream?: TextResponse) => void;
