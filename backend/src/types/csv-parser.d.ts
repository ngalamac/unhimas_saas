declare module 'csv-parser' {
  import { Transform } from 'stream';
  interface CSVParserOptions {
    separator?: string;
    headers?: string[] | boolean;
    skipLines?: number;
    strict?: boolean;
  }
  export default function csv(options?: CSVParserOptions): Transform;
}
