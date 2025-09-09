import type { Options as PrettierOptions } from "prettier";
import * as monaco from "monaco-editor";

export interface FileInfo {
  id: number;
  name: string;
  language: string;
  content: string;
  state?: any;
}

export interface MonacoEditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
  prettier?: PrettierOptions;
}

export interface DiffContent {
  search: string;
  replace: string;
}

export interface DiffChange {
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
}