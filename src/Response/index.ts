import extract from './extract.js';
import file from './file.js';
import head from './head.js';
import json from './json.js';
import pipe from './pipe.js';
import stream from './stream.js';
import text from './text.js';

export default class Response {
  endpoint: string;
  options: object;

  constructor(endpoint: string, options: object = {}) {
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
