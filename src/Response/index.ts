import type { Options } from '../types.ts';
import extract from './extract.ts';
import file from './file.ts';
import head from './head.ts';
import json from './json.ts';
import pipe from './pipe.ts';
import stream from './stream.ts';
import text from './text.ts';

export default class Response {
  endpoint: string;
  options: Options;

  constructor(endpoint: string, options: Options = {}) {
    this.endpoint = endpoint;
    this.options = options;
  }

  public extract = extract;
  public file = file;
  public head = head;
  public json = json;
  public pipe = pipe;
  public stream = stream;
  public text = text;
}
