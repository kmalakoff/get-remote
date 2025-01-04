import extract from './extract';
import file from './file';
import head from './head';
import json from './json';
import pipe from './pipe';
import stream from './stream';
import text from './text';

export default class Response {
  public extract = extract;
  public file = file;
  public head = head;
  public json = json;
  public pipe = pipe;
  public stream = stream;
  public text = text;

  endpoint: string;
  options: object;

  constructor(endpoint: string, options: object = {}) {
    this.endpoint = endpoint;
    this.options = options;
  }
}
